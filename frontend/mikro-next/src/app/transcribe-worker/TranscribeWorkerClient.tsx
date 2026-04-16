"use client";

import { useEffect, useRef, useState } from "react";

// Turbopack traces all import() expressions statically and fails on
// @timur00kh/whisper.wasm because it uses `new Worker(new URL(...))`.
// We hide the import behind Function() so the bundler cannot trace it.

interface Segment {
  timeStart: number;
  timeEnd: number;
  text: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let whisperModule: any = null;

async function getWhisperModule() {
  if (!whisperModule) {
    // Runtime-only dynamic import hidden from Turbopack's static analysis
    const dynamicImport = new Function("specifier", "return import(specifier)");
    whisperModule = await dynamicImport("@timur00kh/whisper.wasm");
  }
  return whisperModule;
}

export default function TranscribeWorkerClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whisperRef = useRef<any>(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
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
  }, []);

  function postToParent(message: Record<string, unknown>) {
    window.parent.postMessage(message, window.location.origin);
  }

  async function handleLoadModel(modelId: string) {
    try {
      setStatus("loading-model");

      const mod = await getWhisperModule();
      const modelManager = new mod.ModelManager();
      const modelData = await modelManager.loadModel(
        modelId,
        true,
        (progress: number) => {
          postToParent({ type: "model-progress", percent: progress });
        }
      );

      const whisper = new mod.WhisperWasmService();
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

      const mod = await getWhisperModule();
      const { audioData } = await mod.convertFromArrayBuffer(fileData);
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
