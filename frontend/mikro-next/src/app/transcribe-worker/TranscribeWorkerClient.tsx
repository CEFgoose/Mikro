"use client";

import { useEffect, useRef, useState } from "react";

// Load whisper.wasm from public/ via script tag to avoid Turbopack
// bundling issues with the library's Emscripten Worker syntax.

interface Segment {
  timeStart: number;
  timeEnd: number;
  text: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getWhisperWasm(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).WhisperWasm;
}

export default function TranscribeWorkerClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whisperRef = useRef<any>(null);
  const [status, setStatus] = useState<string>("loading-script");
  const [scriptReady, setScriptReady] = useState(false);

  // Load the UMD script on mount
  useEffect(() => {
    if (getWhisperWasm()) {
      setScriptReady(true);
      setStatus("idle");
      return;
    }

    const script = document.createElement("script");
    script.src = "/whisper-wasm/index.umd.js";
    script.onload = () => {
      setScriptReady(true);
      setStatus("idle");
    };
    script.onerror = () => {
      setStatus("error");
      postToParent({ type: "error", message: "Failed to load Whisper WASM script" });
    };
    document.head.appendChild(script);
  }, []);

  // Listen for messages from parent
  useEffect(() => {
    if (!scriptReady) return;

    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;

      const { type } = event.data;
      switch (type) {
        case "load-model":
          handleLoadModel(event.data.modelId);
          break;
        case "transcribe-file":
          handleTranscribeFile(event.data.fileData, event.data.fileName);
          break;
        case "transcribe-recording":
          handleTranscribeRecording(event.data.audioData);
          break;
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [scriptReady]);

  function postToParent(message: Record<string, unknown>) {
    window.parent.postMessage(message, window.location.origin);
  }

  async function handleLoadModel(modelId: string) {
    try {
      setStatus("loading-model");
      const ww = getWhisperWasm();

      const modelManager = new ww.ModelManager();
      const modelData = await modelManager.loadModel(
        modelId,
        true,
        (progress: number) => {
          postToParent({ type: "model-progress", percent: progress });
        }
      );

      const whisper = new ww.WhisperWasmService();
      await whisper.loadWasmScript();
      await whisper.initModel(modelData);
      whisperRef.current = whisper;

      setStatus("ready");
      postToParent({ type: "model-ready" });
    } catch (err) {
      setStatus("error");
      postToParent({
        type: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function handleTranscribeFile(fileData: ArrayBuffer, _fileName: string) {
    try {
      if (!whisperRef.current) {
        postToParent({ type: "error", message: "Model not loaded" });
        return;
      }

      setStatus("transcribing");
      postToParent({ type: "transcription-started" });

      const ww = getWhisperWasm();
      const { audioData } = await ww.convertFromArrayBuffer(fileData);
      const startTime = performance.now();
      const segments: Segment[] = [];

      await whisperRef.current.transcribe(
        audioData,
        (segment: Segment) => {
          segments.push(segment);
          postToParent({ type: "transcription-segment", segment });
        }
      );

      const transcribeDurationMs = Math.round(performance.now() - startTime);
      const text = segments.map((s: Segment) => s.text).join(" ").trim();

      setStatus("ready");
      postToParent({
        type: "transcription-complete",
        segments,
        transcribeDurationMs,
        text,
      });
    } catch (err) {
      setStatus("error");
      postToParent({
        type: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function handleTranscribeRecording(audioData: Float32Array) {
    try {
      if (!whisperRef.current) {
        postToParent({ type: "error", message: "Model not loaded" });
        return;
      }

      setStatus("transcribing");
      postToParent({ type: "transcription-started" });

      const startTime = performance.now();
      const segments: Segment[] = [];

      await whisperRef.current.transcribe(
        audioData,
        (segment: Segment) => {
          segments.push(segment);
          postToParent({ type: "transcription-segment", segment });
        }
      );

      const transcribeDurationMs = Math.round(performance.now() - startTime);
      const text = segments.map((s: Segment) => s.text).join(" ").trim();

      setStatus("ready");
      postToParent({
        type: "transcription-complete",
        segments,
        transcribeDurationMs,
        text,
      });
    } catch (err) {
      setStatus("error");
      postToParent({
        type: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return <p>Whisper Worker Active ({status})</p>;
}
