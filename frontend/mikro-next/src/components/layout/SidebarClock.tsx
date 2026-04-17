"use client";

import { useState, useEffect, useCallback } from "react";
import { useActiveTimeSession, useClockIn, useClockOut, useUserProjects, useFetchMyTimeHistory } from "@/hooks";
import { TOPIC_OPTIONS, topicRequiresProject } from "@/lib/timeTracking";

function formatHoursMinutes(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "4px 6px",
  fontSize: 11,
  borderRadius: 4,
  border: "1px solid var(--border)",
  backgroundColor: "var(--background)",
  color: "var(--foreground)",
  outline: "none",
};

export function SidebarClock() {
  const { data: activeSession, loading: sessionLoading, refetch } = useActiveTimeSession();
  const { mutate: clockIn, loading: clockingIn } = useClockIn();
  const { mutate: clockOut, loading: clockingOut } = useClockOut();
  const { data: projects } = useUserProjects();

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [initialElapsed, setInitialElapsed] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [todaySeconds, setTodaySeconds] = useState(0);
  const { mutate: fetchHistory } = useFetchMyTimeHistory();

  const projectList: { id: number; name: string }[] =
    projects?.user_projects?.map((p: { id: number; name: string }) => ({
      id: p.id,
      name: p.name,
    })) ?? [];

  const needsProject = topicRequiresProject(selectedTopic);

  // Restore active session on mount / refetch
  useEffect(() => {
    if (activeSession?.session) {
      const serverElapsed = activeSession.session.elapsedSeconds ?? 0;
      setIsClockedIn(true);
      setInitialElapsed(serverElapsed);
      setTimerStartedAt(Date.now());
      setElapsedSeconds(serverElapsed);
      setShowConfirmation(false);
    } else if (activeSession && !activeSession.session) {
      setIsClockedIn(false);
      setTimerStartedAt(null);
      setInitialElapsed(0);
      setElapsedSeconds(0);
    }
  }, [activeSession]);

  // Listen for sync events from other clock components
  useEffect(() => {
    const handler = () => {
      refetch().catch(() => {});
    };
    window.addEventListener("clock-state-changed", handler);
    return () => window.removeEventListener("clock-state-changed", handler);
  }, [refetch]);

  // Fetch today's completed hours
  useEffect(() => {
    if (!isClockedIn) return;
    const fetchTodayTotal = async () => {
      try {
        const today = toDateStr(new Date());
        const result = await fetchHistory({ startDate: today, endDate: today, limit: 1000 });
        const total = (result?.entries || [])
          .filter((e: { status: string; durationSeconds: number | null }) => e.status === "completed")
          .reduce((sum: number, e: { durationSeconds: number | null }) => sum + (e.durationSeconds || 0), 0);
        setTodaySeconds(total);
      } catch { /* ignore */ }
    };
    fetchTodayTotal();
  }, [isClockedIn, fetchHistory]);

  // Timer — uses only client-side clock deltas, never compares against server time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isClockedIn && timerStartedAt !== null) {
      interval = setInterval(() => {
        const clientDelta = Math.floor((Date.now() - timerStartedAt) / 1000);
        setElapsedSeconds(initialElapsed + clientDelta);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, timerStartedAt, initialElapsed]);

  const handleClockIn = useCallback(async () => {
    if (!selectedTopic) return;
    if (needsProject && !selectedProject) return;
    try {
      await clockIn({
        project_id: selectedProject ? parseInt(selectedProject) : null,
        category: selectedTopic,
        task_name: selectedTopic === "project_creation" && projectDescription ? projectDescription : null,
      });
      setIsClockedIn(true);
      setInitialElapsed(0);
      setTimerStartedAt(Date.now());
      setElapsedSeconds(0);
      setSelectedTopic("");
      setSelectedProject("");
      setProjectDescription("");
      window.dispatchEvent(new Event("clock-state-changed"));
    } catch {
      // Silently handle — dashboard/time page will show full errors
    }
  }, [selectedTopic, selectedProject, needsProject, projectDescription, clockIn]);

  const handleClockOut = useCallback(async () => {
    try {
      await clockOut({});
      setIsClockedIn(false);
      setShowConfirmation(true);
      window.dispatchEvent(new Event("clock-state-changed"));
      setTimeout(() => {
        setShowConfirmation(false);
        setTimerStartedAt(null);
        setInitialElapsed(0);
        setElapsedSeconds(0);
      }, 3000);
    } catch {
      // Silently handle
    }
  }, [clockOut]);

  // Clear project/description when switching topics
  useEffect(() => {
    if (selectedTopic && !topicRequiresProject(selectedTopic)) {
      setSelectedProject("");
    }
    if (selectedTopic !== "project_creation") {
      setProjectDescription("");
    }
  }, [selectedTopic]);

  if (sessionLoading) {
    return (
      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)", textAlign: "center" }}>
          Loading...
        </div>
      </div>
    );
  }

  // Confirmation flash
  if (showConfirmation) {
    return (
      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <svg
            style={{ width: 16, height: 16, color: "#2563eb", flexShrink: 0 }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 500 }}>
            {formatElapsedTime(elapsedSeconds)}
          </span>
        </div>
      </div>
    );
  }

  // Clocked in — show timer + clock out
  if (isClockedIn) {
    return (
      <div
        style={{
          padding: "10px 12px",
          borderTop: "2px solid #22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.05)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 2 }}>
          <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
            Today: {formatHoursMinutes(todaySeconds + elapsedSeconds)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, justifyContent: "center" }}>
          <span style={{ position: "relative", display: "inline-flex", width: 7, height: 7 }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                opacity: 0.75,
                animation: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
              }}
            />
            <span
              style={{
                position: "relative",
                display: "inline-flex",
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
              }}
            />
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 16,
              fontWeight: 700,
              color: "#16a34a",
            }}
          >
            {formatElapsedTime(elapsedSeconds)}
          </span>
        </div>
        <button
          onClick={handleClockOut}
          disabled={clockingOut}
          style={{
            width: "100%",
            padding: "5px 0",
            fontSize: 11,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "#dc2626",
            border: "none",
            borderRadius: 5,
            cursor: clockingOut ? "not-allowed" : "pointer",
            opacity: clockingOut ? 0.6 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {clockingOut ? "..." : "Clock Out"}
        </button>
      </div>
    );
  }

  // Not clocked in — topic first, then conditional project
  const canClockIn = selectedTopic && (!needsProject || selectedProject) && !clockingIn;

  return (
    <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <select
          style={selectStyle}
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
        >
          <option value="">Topic...</option>
          {TOPIC_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {needsProject && (
          <select
            style={selectStyle}
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Project...</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id.toString()}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        {selectedTopic === "project_creation" && (
          <input
            type="text"
            style={{
              ...selectStyle,
              fontStyle: projectDescription ? "normal" : "italic",
            }}
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Project description (optional)"
          />
        )}
        <button
          onClick={handleClockIn}
          disabled={!canClockIn}
          style={{
            width: "100%",
            padding: "5px 0",
            fontSize: 11,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "#ff6b35",
            border: "none",
            borderRadius: 5,
            cursor: !canClockIn ? "not-allowed" : "pointer",
            opacity: !canClockIn ? 0.6 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {clockingIn ? "..." : "Clock In"}
        </button>
      </div>
    </div>
  );
}
