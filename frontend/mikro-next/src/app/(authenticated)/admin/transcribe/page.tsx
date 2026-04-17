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
  type TranscriptionSegment,
  formatTimestamp,
  ACCEPTED_MIME_TYPES,
} from "@/lib/transcribe";

type TranscriptionStatus = "idle" | "uploading" | "transcribing" | "done";
type Mode = "record" | "upload";

interface RecentJob {
  jobId: string;
  jobStatus: string;
  fileName: string;
  segments: TranscriptionSegment[];
  text: string;
  duration: number;
  progress: number;
  error: string | null;
  createdAt: string | null;
  completedAt: string | null;
}

export default function TranscribePage() {
  // Recording state
  const [mode, setMode] = useState<Mode>("upload");
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
  const [jobId, setJobId] = useState<string | null>(null);
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [fullText, setFullText] = useState("");
  const [transcribeDurationMs, setTranscribeDurationMs] = useState(0);
  const [segmentCount, setSegmentCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Recent jobs
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);

  // Load recent jobs on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/backend/transcribe/recent", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.jobs) {
          setRecentJobs(data.jobs);

          // If there's an active job (queued or transcribing), resume polling it
          const active = data.jobs.find(
            (j: RecentJob) => j.jobStatus === "queued" || j.jobStatus === "transcribing"
          );
          if (active) {
            setJobId(active.jobId);
            setFileName(active.fileName);
            setTranscriptionStatus("transcribing");
            setSegmentCount(active.progress || 0);
            if (active.segments?.length) {
              setSegments(active.segments);
            }
          }
        }
      } catch {
        // Ignore — recent jobs are optional
      }
    })();
  }, []);

  // Poll for transcription status
  useEffect(() => {
    if (!jobId || transcriptionStatus !== "transcribing") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/backend/transcribe/result?jobId=${jobId}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (data.jobStatus === "done") {
          setTranscriptionStatus("done");
          setSegments(data.segments || []);
          setFullText(data.text || "");
          setTranscribeDurationMs(Math.round((data.duration || 0) * 1000));
          setJobId(null);
        } else if (data.jobStatus === "error") {
          setError(data.error || "Transcription failed");
          setTranscriptionStatus("idle");
          setJobId(null);
        } else {
          setSegmentCount(data.progress || 0);
          if (data.segments?.length > segments.length) {
            setSegments(data.segments);
          }
        }
      } catch {
        // Ignore polling errors, will retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, transcriptionStatus, segments.length]);

  // Upload file to backend
  const uploadFile = useCallback(async (file: File | Blob, name: string) => {
    setError(null);
    setFileName(name);
    setTranscriptionStatus("uploading");
    setSegments([]);
    setFullText("");
    setSegmentCount(0);

    try {
      const formData = new FormData();
      formData.append("file", file, name);

      const res = await fetch("/backend/transcribe/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        setError(`Upload failed (${res.status}): ${text.slice(0, 200)}`);
        setTranscriptionStatus("idle");
        return;
      }

      const data = await res.json();
      if (data.status !== 200) {
        setError(data.message || "Upload failed");
        setTranscriptionStatus("idle");
        return;
      }

      setJobId(data.jobId);
      setTranscriptionStatus("transcribing");
    } catch (err) {
      setError(`Failed to upload file: ${err instanceof Error ? err.message : String(err)}`);
      setTranscriptionStatus("idle");
    }
  }, []);

  // Recording
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        uploadFile(blob, "recording.webm");
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      setError("Microphone access denied.");
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

  // File handling
  const handleFile = (file: File) => {
    uploadFile(file, file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadPreviousJob = (job: RecentJob) => {
    setSegments(job.segments || []);
    setFullText(job.text || "");
    setTranscribeDurationMs(Math.round((job.duration || 0) * 1000));
    setFileName(job.fileName);
    setTranscriptionStatus("done");
    setError(null);
  };

  const isBusy = transcriptionStatus === "uploading" || transcriptionStatus === "transcribing";

  return (
    <div
      style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      {/* Page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#004e89" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#1a1a1a" }}>Transcribe</h1>
        <Badge variant="outline" style={{ fontSize: 11 }}>Experimental</Badge>
      </div>

      <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
        Upload an audio file or record directly. Transcription runs on the server using Whisper — you can navigate away and come back for results.
      </p>

      {/* Mode tabs + input */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader>
          <CardTitle style={{ fontSize: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Audio Input</span>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  onClick={() => setMode("record")}
                  variant={mode === "record" ? "primary" : "outline"}
                  style={mode === "record" ? { backgroundColor: "#004e89", color: "#fff" } : {}}
                >
                  Record
                </Button>
                <Button
                  onClick={() => setMode("upload")}
                  variant={mode === "upload" ? "primary" : "outline"}
                  style={mode === "upload" ? { backgroundColor: "#004e89", color: "#fff" } : {}}
                >
                  Upload
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mode === "record" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0" }}>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isBusy}
                style={{
                  width: 96, height: 96, borderRadius: "50%", border: "none",
                  backgroundColor: isRecording ? "#dc2626" : "#004e89",
                  color: "#fff", cursor: isBusy ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: isBusy ? 0.4 : 1, transition: "background-color 0.2s",
                  animation: isRecording ? "pulse-recording 1.5s ease-in-out infinite" : "none",
                  boxShadow: isRecording ? "0 0 0 8px rgba(220, 38, 38, 0.2)" : "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {isRecording ? (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                )}
              </button>
              {isRecording && (
                <p style={{ marginTop: 16, fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "#dc2626" }}>
                  {formatTimestamp(recordingTime)}
                </p>
              )}
              <p style={{ marginTop: 12, fontSize: 13, color: "#888" }}>
                {isBusy ? "Processing..." : isRecording ? "Click to stop recording" : "Click to start recording"}
              </p>
              <style>{`@keyframes pulse-recording { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }`}</style>
            </div>
          ) : (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !isBusy && fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "#004e89" : "#d1d5db"}`,
                  borderRadius: 12, padding: "48px 24px", textAlign: "center",
                  cursor: isBusy ? "not-allowed" : "pointer",
                  backgroundColor: dragOver ? "#f0f7ff" : "#fafafa",
                  transition: "all 0.2s", opacity: isBusy ? 0.4 : 1,
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px" }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <p style={{ fontSize: 15, fontWeight: 500, color: "#333", margin: "0 0 6px" }}>
                  {fileName && isBusy ? `Processing: ${fileName}` : "Drop an audio file here, or click to browse"}
                </p>
                <p style={{ fontSize: 12, color: "#999", margin: 0 }}>
                  Supports MP3, M4A, WAV, MP4, WebM, OGG — any length
                </p>
              </div>
              <input ref={fileInputRef} type="file" accept={ACCEPTED_MIME_TYPES} onChange={handleFileInput} style={{ display: "none" }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card style={{ marginBottom: 20, borderColor: "#fca5a5" }}>
          <CardContent>
            <p style={{ color: "#dc2626", margin: "12px 0 0", fontSize: 14 }}>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {(transcriptionStatus === "uploading" || transcriptionStatus === "transcribing") && (
        <Card style={{ marginBottom: 20 }}>
          <CardContent>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004e89" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span style={{ fontSize: 15, fontWeight: 500, color: "#555" }}>
                {transcriptionStatus === "uploading"
                  ? "Uploading..."
                  : `Transcribing${segmentCount > 0 ? ` (${segmentCount} segments so far)` : ""}... You can navigate away — results will be here when you come back.`}
              </span>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>

            {/* Live segments as they arrive */}
            {segments.length > 0 && (
              <div style={{ marginTop: 8, maxHeight: 200, overflowY: "auto", fontSize: 13, color: "#666", fontFamily: "monospace", lineHeight: 1.8 }}>
                {segments.map((seg, i) => (
                  <div key={i}>
                    <span style={{ color: "#004e89", fontWeight: 600 }}>
                      [{formatTimestamp(seg.timeStart)} &rarr; {formatTimestamp(seg.timeEnd)}]
                    </span>{" "}
                    {seg.text}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {transcriptionStatus === "done" && segments.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <CardHeader>
            <CardTitle style={{ fontSize: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Results{fileName ? ` — ${fileName}` : ""}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Badge variant="outline" style={{ fontSize: 11 }}>
                    {segments.length} segment{segments.length !== 1 ? "s" : ""}
                  </Badge>
                  {transcribeDurationMs > 0 && (
                    <Badge variant="outline" style={{ fontSize: 11 }}>
                      {(transcribeDurationMs / 1000 / 60).toFixed(1)} min audio
                    </Badge>
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{
              maxHeight: 400, overflowY: "auto", marginBottom: 20, fontFamily: "monospace",
              fontSize: 13, lineHeight: 1.9, backgroundColor: "#f9fafb", borderRadius: 8,
              padding: 16, border: "1px solid #e5e7eb",
            }}>
              {segments.map((seg, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <span style={{ color: "#004e89", fontWeight: 600 }}>
                    [{formatTimestamp(seg.timeStart)} &rarr; {formatTimestamp(seg.timeEnd)}]
                  </span>{" "}
                  {seg.text}
                </div>
              ))}
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#555" }}>Full Text</label>
            <textarea
              readOnly
              value={fullText}
              style={{
                width: "100%", minHeight: 120, padding: 12, borderRadius: 8,
                border: "1px solid #d1d5db", fontSize: 14, lineHeight: 1.6,
                resize: "vertical", fontFamily: "inherit", backgroundColor: "#fff",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <Button
                onClick={handleCopy}
                style={{ backgroundColor: copied ? "#16a34a" : "#ff6b35", color: "#fff" }}
              >
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transcriptions */}
      {recentJobs.length > 0 && transcriptionStatus !== "done" && (
        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: 16 }}>Recent Transcriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentJobs
                .filter((j) => j.jobStatus === "done")
                .slice(0, 5)
                .map((job) => (
                  <div
                    key={job.jobId}
                    onClick={() => loadPreviousJob(job)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb",
                      cursor: "pointer", transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                  >
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#333" }}>
                        {job.fileName || "Untitled"}
                      </span>
                      <span style={{ fontSize: 12, color: "#999", marginLeft: 12 }}>
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Badge variant="outline" style={{ fontSize: 10 }}>
                        {job.segments?.length || 0} segments
                      </Badge>
                      {job.duration > 0 && (
                        <Badge variant="outline" style={{ fontSize: 10 }}>
                          {(job.duration / 60).toFixed(1)} min
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
