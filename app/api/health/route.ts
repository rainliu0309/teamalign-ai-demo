import {
  DEFAULT_LOCAL_ASR_URL,
  getAIProvider,
  getTextModel,
  getTranscriptionModel,
  getTranscriptionProvider,
} from "../../../lib/openai";

export async function GET() {
  const provider = getAIProvider();
  const cloudTranscriptionProvider = getTranscriptionProvider();
  const localAsrUrl =
    process.env.LOCAL_ASR_URL?.trim() || DEFAULT_LOCAL_ASR_URL;
  let localAsrReady = false;

  if (process.env.LOCAL_ASR_ENABLED === "true") {
    try {
      const response = await fetch(`${localAsrUrl}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(1200),
      });
      localAsrReady = response.ok;
    } catch {
      localAsrReady = false;
    }
  }

  const remoteTranscriptionReady = Boolean(
    cloudTranscriptionProvider === "groq"
      ? process.env.GROQ_API_KEY?.trim()
      : process.env.OPENAI_TRANSCRIPTION_API_KEY?.trim() ||
          (provider === "openai" && process.env.OPENAI_API_KEY?.trim()),
  );

  return Response.json({
    configured:
      provider === "agnes"
        ? Boolean(process.env.AGNES_API_KEY?.trim())
        : Boolean(process.env.OPENAI_API_KEY?.trim()),
    provider,
    textModel: getTextModel(),
    transcriptionConfigured: localAsrReady || remoteTranscriptionReady,
    transcriptionProvider: localAsrReady
      ? "whisper.cpp"
      : remoteTranscriptionReady
        ? cloudTranscriptionProvider
        : null,
    localAsrEnabled: process.env.LOCAL_ASR_ENABLED === "true",
    localAsrReady,
    transcriptionModel:
      localAsrReady
        ? process.env.LOCAL_ASR_MODEL ?? "small-q5_1"
        : getTranscriptionModel(),
  });
}
