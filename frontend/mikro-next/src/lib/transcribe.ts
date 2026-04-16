// ── Parent → Worker (iframe) messages ──────────────────────────────────
export type WorkerMessage =
  | { type: "load-model"; modelId: string }
  | { type: "transcribe-file"; fileData: ArrayBuffer; fileName: string }
  | { type: "transcribe-recording"; audioData: Float32Array };

// ── Worker → Parent messages ───────────────────────────────────────────
export type WorkerResponse =
  | { type: "model-progress"; percent: number }
  | { type: "model-ready" }
  | { type: "transcription-started" }
  | { type: "transcription-segment"; segment: TranscriptionSegment }
  | {
      type: "transcription-complete";
      segments: TranscriptionSegment[];
      transcribeDurationMs: number;
      text: string;
    }
  | { type: "error"; message: string };

// ── Shared types ───────────────────────────────────────────────────────
export interface TranscriptionSegment {
  timeStart: number;
  timeEnd: number;
  text: string;
}

export interface ModelOption {
  id: string;
  label: string;
  size: string;
  description: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "tiny.en",
    label: "Tiny (English)",
    size: "26 MB",
    description: "Fast",
  },
  {
    id: "small.en",
    label: "Small (English)",
    size: "140 MB",
    description: "Balanced",
  },
  {
    id: "medium.en-q5_0",
    label: "Medium Q5 (English)",
    size: "405 MB",
    description: "Best quality",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────

/** Format seconds to mm:ss (e.g. 65.3 → "01:05") */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/** Accepted audio/video file extensions for upload */
export const ACCEPTED_EXTENSIONS = [
  ".mp3",
  ".m4a",
  ".wav",
  ".mp4",
  ".webm",
  ".ogg",
];

export const ACCEPTED_MIME_TYPES =
  "audio/mpeg,audio/mp4,audio/wav,audio/x-wav,video/mp4,video/webm,audio/ogg,audio/webm";
