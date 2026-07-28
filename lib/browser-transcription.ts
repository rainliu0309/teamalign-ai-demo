export type BrowserTranscriptionStage =
  | "loading"
  | "downloading"
  | "transcribing";

export type BrowserTranscriptionProgress = {
  stage: BrowserTranscriptionStage;
  percent?: number;
};

type WorkerMessage =
  | { type: "progress"; stage: BrowserTranscriptionStage; percent?: number }
  | { type: "complete"; text: string }
  | { type: "error"; message: string };

const TARGET_SAMPLE_RATE = 16_000;

function resampleAudio(
  input: Float32Array,
  sourceSampleRate: number,
): Float32Array {
  if (sourceSampleRate === TARGET_SAMPLE_RATE) return input.slice();

  const ratio = sourceSampleRate / TARGET_SAMPLE_RATE;
  const output = new Float32Array(Math.ceil(input.length / ratio));
  for (let index = 0; index < output.length; index += 1) {
    const position = index * ratio;
    const before = Math.floor(position);
    const after = Math.min(before + 1, input.length - 1);
    const blend = position - before;
    output[index] = input[before] * (1 - blend) + input[after] * blend;
  }
  return output;
}

async function decodeAudioFile(file: File): Promise<Float32Array> {
  const BrowserAudioContext =
    window.AudioContext ||
    (window as Window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;

  if (!BrowserAudioContext) {
    throw new Error(
      "当前浏览器不支持本地音频解析，请改用最新版 Chrome 或 Edge。",
    );
  }

  const context = new BrowserAudioContext();
  try {
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    const mixed = new Float32Array(decoded.length);
    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const source = decoded.getChannelData(channel);
      for (let index = 0; index < decoded.length; index += 1) {
        mixed[index] += source[index] / decoded.numberOfChannels;
      }
    }
    return resampleAudio(mixed, decoded.sampleRate);
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message
        ? `无法读取该音频：${error.message}`
        : "无法读取该音频，请改用 MP3、M4A、WAV 或 WEBM 文件。",
    );
  } finally {
    await context.close().catch(() => undefined);
  }
}

export async function transcribeBrowserAudio(
  file: File,
  language: "zh" | "en",
  onProgress?: (progress: BrowserTranscriptionProgress) => void,
): Promise<string> {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    throw new Error("浏览器本地转写仅能在支持 Web Worker 的浏览器中使用。");
  }

  onProgress?.({ stage: "loading" });
  const audio = await decodeAudioFile(file);

  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./browser-transcription.worker.ts", import.meta.url),
      { type: "module" },
    );
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      callback();
    };

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      if (message.type === "progress") {
        onProgress?.({ stage: message.stage, percent: message.percent });
        return;
      }
      if (message.type === "complete") {
        finish(() => resolve(message.text));
        return;
      }
      finish(() => reject(new Error(message.message)));
    };

    worker.onerror = () => {
      finish(() =>
        reject(
          new Error(
            "浏览器本地转写未能启动，请使用最新版 Chrome 或 Edge 后重试。",
          ),
        ),
      );
    };

    worker.postMessage(
      { type: "transcribe", audio: audio.buffer, language },
      [audio.buffer],
    );
  });
}
