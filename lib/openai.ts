import OpenAI from "openai";

export type AIProvider = "openai" | "agnes";
export type TranscriptionProvider = "openai" | "groq";

export const DEFAULT_OPENAI_TEXT_MODEL = "gpt-5.6-sol";
export const DEFAULT_AGNES_TEXT_MODEL = "agnes-2.0-flash";
export const DEFAULT_OPENAI_TRANSCRIPTION_MODEL = "gpt-4o-transcribe";
export const DEFAULT_GROQ_TRANSCRIPTION_MODEL = "whisper-large-v3-turbo";
export const AGNES_BASE_URL = "https://apihub.agnes-ai.com/v1";
export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_LOCAL_ASR_URL = "http://127.0.0.1:8080";

export function getAIProvider(): AIProvider {
  return process.env.AI_PROVIDER?.toLowerCase() === "agnes"
    ? "agnes"
    : "openai";
}

export function getTextModel() {
  return getAIProvider() === "agnes"
    ? process.env.AGNES_TEXT_MODEL ?? DEFAULT_AGNES_TEXT_MODEL
    : process.env.OPENAI_TEXT_MODEL ?? DEFAULT_OPENAI_TEXT_MODEL;
}

export function getTextClient() {
  const provider = getAIProvider();
  const apiKey =
    provider === "agnes"
      ? process.env.AGNES_API_KEY?.trim()
      : process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      provider === "agnes"
        ? "AGNES_API_KEY_NOT_CONFIGURED"
        : "OPENAI_API_KEY_NOT_CONFIGURED",
    );
  }

  return new OpenAI({
    apiKey,
    baseURL:
      provider === "agnes"
        ? process.env.AGNES_BASE_URL ?? AGNES_BASE_URL
        : undefined,
  });
}

export function getTranscriptionProvider(): TranscriptionProvider {
  return process.env.TRANSCRIPTION_PROVIDER?.toLowerCase() === "groq"
    ? "groq"
    : "openai";
}

export function getTranscriptionModel() {
  return getTranscriptionProvider() === "groq"
    ? process.env.GROQ_TRANSCRIPTION_MODEL ?? DEFAULT_GROQ_TRANSCRIPTION_MODEL
    : process.env.OPENAI_TRANSCRIPTION_MODEL ??
        DEFAULT_OPENAI_TRANSCRIPTION_MODEL;
}

export function getTranscriptionClient() {
  const provider = getTranscriptionProvider();
  const apiKey =
    provider === "groq"
      ? process.env.GROQ_API_KEY?.trim()
      : process.env.OPENAI_TRANSCRIPTION_API_KEY?.trim() ??
          (getAIProvider() === "openai"
            ? process.env.OPENAI_API_KEY?.trim()
            : undefined);

  if (!apiKey) {
    throw new Error(
      provider === "groq"
        ? "GROQ_API_KEY_NOT_CONFIGURED"
        : "OPENAI_TRANSCRIPTION_API_KEY_NOT_CONFIGURED",
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: provider === "groq" ? GROQ_BASE_URL : undefined,
  });
}

export function extractJson(content: string | null) {
  if (!content) throw new Error("EMPTY_AI_RESPONSE");

  const normalized = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "");

  return JSON.parse(normalized) as unknown;
}

export function apiErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  if (
    message === "OPENAI_API_KEY_NOT_CONFIGURED" ||
    message === "AGNES_API_KEY_NOT_CONFIGURED"
  ) {
    const keyName =
      message === "AGNES_API_KEY_NOT_CONFIGURED"
        ? "AGNES_API_KEY"
        : "OPENAI_API_KEY";
    return Response.json(
      {
        error: message,
        keyName,
        message: `请先在 .env.local 中配置 ${keyName}，然后重启本地预览。`,
      },
      { status: 503 },
    );
  }

  if (
    message === "OPENAI_TRANSCRIPTION_API_KEY_NOT_CONFIGURED" ||
    message === "GROQ_API_KEY_NOT_CONFIGURED"
  ) {
    const keyName =
      message === "GROQ_API_KEY_NOT_CONFIGURED"
        ? "GROQ_API_KEY"
        : "OPENAI_TRANSCRIPTION_API_KEY";
    return Response.json(
      {
        error: message,
        keyName,
        message:
          "Agnes 暂未提供公开语音转写接口。请改用文字纪要，或配置当前转写服务的 API Key 以启用录音转写。",
      },
      { status: 503 },
    );
  }

  if (
    message === "LOCAL_ASR_UNAVAILABLE" ||
    message === "LOCAL_ASR_FAILED"
  ) {
    return Response.json(
      {
        error: message,
        message:
          message === "LOCAL_ASR_UNAVAILABLE"
            ? "本地 Whisper 转写服务未启动。请先运行 npm run asr。"
            : "本地 Whisper 未能完成音频转写，请检查音频格式后重试。",
      },
      { status: 503 },
    );
  }

  if (message === "INVALID_AI_RESPONSE") {
    return Response.json(
      {
        error: message,
        message:
          "AI 返回的数据结构不完整，TeamAlign 已阻止写入项目。请重新解析一次。",
      },
      { status: 502 },
    );
  }

  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : 500;

  return Response.json(
    {
      error: "AI_REQUEST_FAILED",
      message:
        status === 401
          ? "AI API Key 无效或已失效，请重新生成并检查本地配置。"
          : status === 429
            ? "API 请求过于频繁或额度不足，请稍后重试。"
            : "AI 服务暂时未完成请求，请稍后重试。",
    },
    { status: status >= 400 && status < 600 ? status : 500 },
  );
}
