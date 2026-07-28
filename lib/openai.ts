import OpenAI from "openai";

export type AIProvider = "openai" | "agnes";

export const DEFAULT_OPENAI_TEXT_MODEL = "gpt-5.6-sol";
export const DEFAULT_AGNES_TEXT_MODEL = "agnes-2.0-flash";
export const AGNES_BASE_URL = "https://apihub.agnes-ai.com/v1";

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
