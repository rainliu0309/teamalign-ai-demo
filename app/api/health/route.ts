import { getAIProvider, getTextModel } from "../../../lib/openai";

export async function GET() {
  const provider = getAIProvider();

  return Response.json({
    configured:
      provider === "agnes"
        ? Boolean(process.env.AGNES_API_KEY?.trim())
        : Boolean(process.env.OPENAI_API_KEY?.trim()),
    provider,
    textModel: getTextModel(),
    transcriptionConfigured: true,
    transcriptionProvider: "browser",
    localAsrEnabled: false,
    localAsrReady: false,
    transcriptionModel: "whisper-small (browser)",
  });
}
