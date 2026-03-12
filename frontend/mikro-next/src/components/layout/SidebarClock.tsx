"use client";

import { useState, useEffect, useCallback } from "react";
import { useActiveTimeSession, useClockIn, useClockOut, useUserProjects } from "@/hooks";

function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const CATEGORIES = [
  { value: "mapping", label: "Mapping" },
  { value: "validation", label: "Validation" },
  { value: "review", label: "Review" },
  { value: "training", label: "Training" },
  { value: "other", label: "Other" },
];

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
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const projectList: { id: number; name: string }[] =
    projects?.user_projects?.map((p: { id: number; name: string }) => ({
      id: p.id,
      name: p.name,
    })) ?? [];

  // Restore active session on mount / refetch
  useEffect(() => {
    if (activeSession?.session) {
      setIsClockedIn(true);
      setClockInTime(new Date(activeSession.session.clockIn!));
      setShowConfirmation(false);
    } else if (activeSession && !activeSession.session) {
      setIsClockedIn(false);
      setClockInTime(null);
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

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isClockedIn && clockInTime) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - clockInTime.getTime()) / 1000);
        setElapsedSeconds(diff);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, clockInTime]);

  const handleClockIn = useCallback(async () => {
    if (!selectedProject || !selectedCategory) return;
    try {
      await clockIn({
        project_id: parseInt(selectedProject),
        category: selectedCategory,
      });
      setClockInTime(new Date());
      setIsClockedIn(true);
      setElapsedSeconds(0);
      setSelectedProject("");
      setSelectedCategory("");
      window.dispatchEvent(new Event("clock-state-changed"));
    } catch {
      // Silently handle — dashboard/time page will show full errors
    }
  }, [selectedProject, selectedCategory, clockIn]);

  const handleClockOut = useCallback(async () => {
    try {
      await clockOut({});
      setIsClockedIn(false);
      setShowConfirmation(true);
      window.dispatchEvent(new Event("clock-state-changed"));
      setTimeout(() => {
        setShowConfirmation(false);
        setClockInTime(null);
        setElapsedSeconds(0);
      }, 3000);
    } catch {
      // Silently handle
    }
  }, [clockOut]);

  if (sessionLoading) {
    return (
      <div style={{ padding: "12px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)", textAlign: "center" }}>
          Loading...
        </div>
      </div>
    );
  }

  // Confirmation flash
  if (showConfirmation) {
    return (
      <div style={{ padding: "12px", borderTop: "1px solid var(--border)" }}>
        <div style={{ textAlign: "center" }}>
          <svg
            style={{ width: 20, height: 20, margin: "0 auto 4px", color: "#2563eb" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 500 }}>
            Logged {formatElapsedTime(elapsedSeconds)}
          </div>
        </div>
      </div>
    );
  }

  // Clocked in — show timer + clock out
  if (isClockedIn) {
    return (
      <div
        style={{
          padding: "12px",
          borderTop: "2px solid #22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.05)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
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
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                }}
              />
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)" }}>
              Active
            </span>
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 700,
              color: "#16a34a",
              marginBottom: 8,
            }}
          >
            {formatElapsedTime(elapsedSeconds)}
          </div>
          <button
            onClick={handleClockOut}
            disabled={clockingOut}
            style={{
              width: "100%",
              padding: "6px 0",
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              backgroundColor: "#dc2626",
              border: "none",
              borderRadius: 6,
              cursor: clockingOut ? "not-allowed" : "pointer",
              opacity: clockingOut ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {clockingOut ? "..." : "Clock Out"}
          </button>
        </div>
      </div>
    );
  }

  // Not clocked in — show project/category selects + clock in button
  return (
    <div style={{ padding: "12px", borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)", textAlign: "center" }}>
          Not clocked in
        </div>
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
        <select
          style={selectStyle}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Category...</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleClockIn}
          disabled={!selectedProject || !selectedCategory || clockingIn}
          style={{
            width: "100%",
            padding: "6px 0",
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "#ff6b35",
            border: "none",
            borderRadius: 6,
            cursor: !selectedProject || !selectedCategory || clockingIn ? "not-allowed" : "pointer",
            opacity: !selectedProject || !selectedCategory || clockingIn ? 0.6 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {clockingIn ? "..." : "Clock In"}
        </button>
      </div>
    </div>
  );
}
