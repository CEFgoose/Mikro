"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "@/components/ui";
import {
  type WorkerMessage,
  type WorkerResponse,
  type TranscriptionSegment,
  MODEL_OPTIONS,
  formatTimestamp,
  ACCEPTED_MIME_TYPES,
} from "@/lib/transcribe";

// ── Types ──────────────────────────────────────────────────────────────

type ModelStatus = "not-loaded" | "downloading" | "ready";
type Mode = "record" | "upload";
type TranscriptionStatus = "idle" | "transcribing" | "done";

// ── Component ──────────────────────────────────────────────────────────

export default function TranscribePage() {
  // Iframe
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Model state
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0].id);
  const [modelStatus, setModelStatus] = useState<ModelStatus>("not-loaded");
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Mode
  const [mode, setMode] = useState<Mode>("record");

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Upload state
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Transcription state
  const [transcriptionStatus, setTranscriptionStatus] =
    useState<TranscriptionStatus>("idle");
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [fullText, setFullText] = useState("");
  const [transcribeDurationMs, setTranscribeDurationMs] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Iframe message handling ────────────────────────────────────────

  useEffect(() => {
    const KNOWN_TYPES = new Set([
      "model-progress", "model-ready", "transcription-started",
      "transcription-segment", "transcription-complete", "error",
    ]);

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const msg = event.data;
      if (!msg || typeof msg !== "object" || !KNOWN_TYPES.has(msg.type)) return;

      switch (msg.type) {
        case "model-progress":
          setDownloadProgress(msg.percent);
          break;
        case "model-ready":
          setModelStatus("ready");
          setDownloadProgress(100);
          break;
        case "transcription-started":
          setTranscriptionStatus("transcribing");
          setSegments([]);
          setFullText("");
          setError(null);
          break;
        case "transcription-segment":
          setSegments((prev) => [...prev, msg.segment]);
          break;
        case "transcription-complete":
          setTranscriptionStatus("done");
          setSegments(msg.segments);
          setFullText(msg.text);
          setTranscribeDurationMs(msg.transcribeDurationMs);
          break;
        case "error":
          setError(typeof msg.message === "string" ? msg.message : JSON.stringify(msg.message));
          setTranscriptionStatus("idle");
          setModelStatus((prev) =>
            prev === "downloading" ? "not-loaded" : prev
          );
          break;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // ── Send to iframe ─────────────────────────────────────────────────

  const postToWorker = useCallback(
    (message: WorkerMessage) => {
      iframeRef.current?.contentWindow?.postMessage(
        message,
        window.location.origin
      );
    },
    []
  );

  // ── Model loading ──────────────────────────────────────────────────

  const handleLoadModel = () => {
    setModelStatus("downloading");
    setDownloadProgress(0);
    setError(null);
    postToWorker({ type: "load-model", modelId: selectedModel });
  };

  // ── Recording ──────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const arrayBuffer = await blob.arrayBuffer();
        setTranscriptionStatus("transcribing");
        postToWorker({
          type: "transcribe-file",
          fileData: arrayBuffer,
          fileName: "recording.webm",
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      setError(
        "Microphone access denied. Please allow microphone access and try again."
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ── File upload ────────────────────────────────────────────────────

  const handleFile = async (file: File) => {
    setError(null);
    const arrayBuffer = await file.arrayBuffer();
    setTranscriptionStatus("transcribing");
    postToWorker({
      type: "transcribe-file",
      fileData: arrayBuffer,
      fileName: file.name,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    console.log("[transcribe] Drop event, modelStatus:", modelStatus, "files:", e.dataTransfer.files.length);
    if (modelStatus !== "ready") return;
    const file = e.dataTransfer.files[0];
    if (file) {
      console.log("[transcribe] Processing dropped file:", file.name, file.type, file.size);
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  // ── Copy to clipboard ─────────────────────────────────────────────

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render helpers ─────────────────────────────────────────────────

  const modelOption = MODEL_OPTIONS.find((m) => m.id === selectedModel);

  const statusBadge = () => {
    switch (modelStatus) {
      case "not-loaded":
        return <Badge variant="outline">Not Loaded</Badge>;
      case "downloading":
        return <Badge variant="warning">Downloading...</Badge>;
      case "ready":
        return <Badge variant="success">Ready</Badge>;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div
      style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); }}
    >
      {/* Hidden iframe worker */}
      <iframe
        src="/transcribe-worker"
        style={{ display: "none" }}
        ref={iframeRef}
      />

      {/* Page title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#004e89"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#1a1a1a" }}>
          Transcribe
        </h1>
        <Badge variant="outline" style={{ fontSize: 11 }}>
          Experimental
        </Badge>
      </div>

      {/* ── Model Section ─────────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader>
          <CardTitle style={{ fontSize: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Whisper Model</span>
              {statusBadge()}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 6,
                  color: "#555",
                }}
              >
                Select Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={modelStatus === "downloading"}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  backgroundColor: "#fff",
                  cursor:
                    modelStatus === "downloading" ? "not-allowed" : "pointer",
                }}
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {m.size} ({m.description})
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleLoadModel}
              disabled={
                modelStatus === "downloading" || modelStatus === "ready"
              }
              style={{
                backgroundColor:
                  modelStatus === "ready" ? "#16a34a" : "#004e89",
                color: "#fff",
              }}
            >
              {modelStatus === "ready"
                ? "Loaded"
                : modelStatus === "downloading"
                  ? "Downloading..."
                  : "Load Model"}
            </Button>
          </div>

          {/* Progress bar */}
          {modelStatus === "downloading" && (
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  width: "100%",
                  height: 8,
                  backgroundColor: "#e5e7eb",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${downloadProgress}%`,
                    height: "100%",
                    backgroundColor: "#004e89",
                    borderRadius: 4,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "#888",
                  marginTop: 4,
                  textAlign: "right",
                }}
              >
                {downloadProgress.toFixed(0)}%
              </p>
            </div>
          )}

          {modelOption && (
            <p
              style={{
                fontSize: 12,
                color: "#888",
                marginTop: 10,
              }}
            >
              Model runs entirely in your browser via WebAssembly. No audio is
              sent to any server.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Mode Tabs ─────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader>
          <CardTitle style={{ fontSize: 18 }}>Input</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tab buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <Button
              onClick={() => setMode("record")}
              variant={mode === "record" ? "primary" : "outline"}
              style={
                mode === "record"
                  ? { backgroundColor: "#004e89", color: "#fff" }
                  : {}
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: 6 }}
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              Record
            </Button>
            <Button
              onClick={() => setMode("upload")}
              variant={mode === "upload" ? "primary" : "outline"}
              style={
                mode === "upload"
                  ? { backgroundColor: "#004e89", color: "#fff" }
                  : {}
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: 6 }}
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" x2="12" y1="3" y2="15" />
              </svg>
              Upload
            </Button>
          </div>

          {/* ── Record Mode ───────────────────────────────────────── */}
          {mode === "record" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "32px 0",
              }}
            >
              {/* Mic button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={modelStatus !== "ready"}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: isRecording ? "#dc2626" : "#004e89",
                  color: "#fff",
                  cursor:
                    modelStatus !== "ready" ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: modelStatus !== "ready" ? 0.4 : 1,
                  transition: "background-color 0.2s, transform 0.1s",
                  animation: isRecording
                    ? "pulse-recording 1.5s ease-in-out infinite"
                    : "none",
                  boxShadow: isRecording
                    ? "0 0 0 8px rgba(220, 38, 38, 0.2)"
                    : "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {isRecording ? (
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                )}
              </button>

              {/* Recording timer */}
              {isRecording && (
                <p
                  style={{
                    marginTop: 16,
                    fontSize: 20,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: "#dc2626",
                  }}
                >
                  {formatTimestamp(recordingTime)}
                </p>
              )}

              <p
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: "#888",
                }}
              >
                {modelStatus !== "ready"
                  ? "Load a model first to start recording"
                  : isRecording
                    ? "Click to stop recording"
                    : "Click to start recording"}
              </p>

              {/* Pulse animation keyframes */}
              <style>{`
                @keyframes pulse-recording {
                  0%, 100% { transform: scale(1); box-shadow: 0 0 0 8px rgba(220, 38, 38, 0.2); }
                  50% { transform: scale(1.04); box-shadow: 0 0 0 14px rgba(220, 38, 38, 0.1); }
                }
              `}</style>
            </div>
          )}

          {/* ── Upload Mode ───────────────────────────────────────── */}
          {mode === "upload" && (
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => {
                  console.log("[transcribe] Drop zone clicked, modelStatus:", modelStatus, "fileInputRef:", !!fileInputRef.current);
                  if (modelStatus === "ready") fileInputRef.current?.click();
                }}
                style={{
                  border: `2px dashed ${dragOver ? "#004e89" : "#d1d5db"}`,
                  borderRadius: 12,
                  padding: "48px 24px",
                  textAlign: "center",
                  cursor: modelStatus !== "ready" ? "not-allowed" : "pointer",
                  backgroundColor: dragOver ? "#f0f7ff" : "#fafafa",
                  transition: "all 0.2s",
                  opacity: modelStatus !== "ready" ? 0.4 : 1,
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#999"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ margin: "0 auto 12px" }}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#333",
                    margin: "0 0 6px",
                  }}
                >
                  Drop an audio or video file here, or click to browse
                </p>
                <p style={{ fontSize: 12, color: "#999", margin: 0 }}>
                  Supported: MP3, M4A, WAV, MP4, WebM, OGG
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_MIME_TYPES}
                onChange={handleFileInput}
                style={{ display: "none" }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Error ─────────────────────────────────────────────────── */}
      {error && (
        <Card style={{ marginBottom: 20, borderColor: "#fca5a5" }}>
          <CardContent>
            <p style={{ color: "#dc2626", margin: "12px 0 0", fontSize: 14 }}>
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Transcribing spinner ──────────────────────────────────── */}
      {transcriptionStatus === "transcribing" && (
        <Card style={{ marginBottom: 20 }}>
          <CardContent>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "20px 0",
                justifyContent: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#004e89"
                strokeWidth="2"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span style={{ fontSize: 15, fontWeight: 500, color: "#555" }}>
                Transcribing...
              </span>
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>

            {/* Live segments as they arrive */}
            {segments.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  maxHeight: 200,
                  overflowY: "auto",
                  fontSize: 13,
                  color: "#666",
                  fontFamily: "monospace",
                  lineHeight: 1.8,
                }}
              >
                {segments.map((seg, i) => (
                  <div key={i}>
                    <span style={{ color: "#004e89", fontWeight: 600 }}>
                      [{formatTimestamp(seg.timeStart)} &rarr;{" "}
                      {formatTimestamp(seg.timeEnd)}]
                    </span>{" "}
                    {seg.text}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Results ───────────────────────────────────────────────── */}
      {transcriptionStatus === "done" && segments.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <CardHeader>
            <CardTitle style={{ fontSize: 18 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>Results</span>
                <Badge variant="outline" style={{ fontSize: 11 }}>
                  {(transcribeDurationMs / 1000).toFixed(1)}s
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Segments */}
            <div
              style={{
                maxHeight: 400,
                overflowY: "auto",
                marginBottom: 20,
                fontFamily: "monospace",
                fontSize: 13,
                lineHeight: 1.9,
                backgroundColor: "#f9fafb",
                borderRadius: 8,
                padding: 16,
                border: "1px solid #e5e7eb",
              }}
            >
              {segments.map((seg, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <span style={{ color: "#004e89", fontWeight: 600 }}>
                    [{formatTimestamp(seg.timeStart)} &rarr;{" "}
                    {formatTimestamp(seg.timeEnd)}]
                  </span>{" "}
                  {seg.text}
                </div>
              ))}
            </div>

            {/* Full text */}
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 6,
                color: "#555",
              }}
            >
              Full Text
            </label>
            <textarea
              readOnly
              value={fullText}
              style={{
                width: "100%",
                minHeight: 120,
                padding: 12,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
                lineHeight: 1.6,
                resize: "vertical",
                fontFamily: "inherit",
                backgroundColor: "#fff",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 12,
              }}
            >
              <Button
                onClick={handleCopy}
                style={{
                  backgroundColor: copied ? "#16a34a" : "#ff6b35",
                  color: "#fff",
                }}
              >
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
