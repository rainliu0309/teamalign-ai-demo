type WorkerRequest = {
  type: "transcribe";
  audio: ArrayBuffer;
  language: "zh" | "en";
};

type ProgressPayload = {
  status?: string;
  file?: string;
  progress?: number;
};

const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: unknown) => void;
};

let transcriber: ((
  audio: Float32Array,
  options: Record<string, unknown>,
) => Promise<{ text?: string }>) | null = null;

function emitProgress(progress: ProgressPayload) {
  const percent =
    typeof progress.progress === "number"
      ? Math.max(0, Math.min(100, Math.round(progress.progress)))
      : undefined;
  workerScope.postMessage({
    type: "progress",
    stage:
      progress.status === "progress" || progress.status === "download"
        ? "downloading"
        : "loading",
    percent,
  });
}

async function getTranscriber() {
  if (transcriber) return transcriber;

  const { pipeline } = await import("@huggingface/transformers");
  // WASM q4 is more consistent across Chrome, Edge, Safari, and Firefox than
  // experimental browser WebGPU for multilingual Whisper inference.
  transcriber = (await pipeline(
    "automatic-speech-recognition",
    "onnx-community/whisper-base",
    {
      dtype: "q4",
      progress_callback: emitProgress,
    },
  )) as typeof transcriber;

  return transcriber;
}

workerScope.onmessage = async (event) => {
  try {
    workerScope.postMessage({ type: "progress", stage: "loading" });
    const model = await getTranscriber();
    workerScope.postMessage({ type: "progress", stage: "transcribing" });
    const result = await model(new Float32Array(event.data.audio), {
      language: event.data.language === "zh" ? "chinese" : "english",
      task: "transcribe",
      chunk_length_s: 30,
      stride_length_s: 5,
    });
    const text = result.text?.trim() ?? "";
    if (text.length < 1) {
      throw new Error("浏览器未能从该录音中识别出有效文字。");
    }
    workerScope.postMessage({ type: "complete", text });
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "浏览器本地转写失败，请改用文字纪要或更换浏览器后重试。",
    });
  }
};
