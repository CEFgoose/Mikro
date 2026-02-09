"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  useAdminActiveSessions,
  useAdminTimeHistory,
  useForceClockOut,
  useVoidTimeEntry,
  useEditTimeEntry,
} from "@/hooks";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatLiveDuration(clockIn: string): string {
  const now = new Date();
  const start = new Date(clockIn);
  const seconds = Math.floor((now.getTime() - start.getTime()) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function AdminTimeManagement() {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [liveDurations, setLiveDurations] = useState<Record<number, string>>({});

  const { data: activeSessions, loading: sessionsLoading, refetch: refetchSessions } = useAdminActiveSessions();
  const { data: historyData, loading: historyLoading, refetch: refetchHistory } = useAdminTimeHistory();
  const { mutate: forceClockOut, loading: forcingClockOut } = useForceClockOut();
  const { mutate: voidEntry, loading: voiding } = useVoidTimeEntry();
  const { mutate: editEntry, loading: editing } = useEditTimeEntry();

  const sessions = activeSessions?.sessions || [];
  const historyEntries = historyData?.entries || [];

  // Live duration ticker for active sessions
  useEffect(() => {
    if (activeTab !== "active" || sessions.length === 0) return;

    const interval = setInterval(() => {
      const durations: Record<number, string> = {};
      for (const session of sessions) {
        if (session.clockIn) {
          durations[session.id] = formatLiveDuration(session.clockIn);
        }
      }
      setLiveDurations(durations);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTab, sessions]);

  const handleForceClockOut = async (id: number) => {
    try {
      await forceClockOut({ session_id: id });
      await refetchSessions();
      await refetchHistory();
    } catch (err) {
      console.error("Force clock out failed:", err);
    }
  };

  const handleVoidEntry = async (id: number) => {
    try {
      await voidEntry({ entry_id: id });
      await refetchHistory();
    } catch (err) {
      console.error("Void entry failed:", err);
    }
  };

  const handleEditEntry = (id: number) => {
    // TODO: open edit modal - for now just log
    console.log("Edit time entry:", id);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <svg
                className="w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Time Management
            </CardTitle>
            <div className="flex gap-1 rounded-lg bg-secondary p-1">
              <button
                onClick={() => setActiveTab("active")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === "active"
                    ? "bg-white dark:bg-gray-800 shadow font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Active Sessions ({sessions.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === "history"
                    ? "bg-white dark:bg-gray-800 shadow font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                History
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "active" ? (
            sessionsLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Loading active sessions...
              </p>
            ) : sessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">User</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Project</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Category</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Clocked In</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Duration</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((entry) => (
                      <tr key={entry.id} className="border-b border-border last:border-0">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="font-medium">{entry.userName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">{entry.projectName}</td>
                        <td className="py-3 px-3">
                          <Badge variant="secondary">{entry.category}</Badge>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {entry.clockIn ? formatDateTime(entry.clockIn) : "—"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-green-600 font-medium">
                            {liveDurations[entry.id] || entry.duration || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleForceClockOut(entry.id)}
                            disabled={forcingClockOut}
                          >
                            Force Clock Out
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No users are currently clocked in.
              </p>
            )
          ) : (
            historyLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Loading history...
              </p>
            ) : historyEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">User</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Project</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Category</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Clock In</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Clock Out</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Duration</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className={`border-b border-border last:border-0 ${
                          entry.status === "voided" ? "opacity-50" : ""
                        }`}
                      >
                        <td className="py-3 px-3 font-medium">{entry.userName}</td>
                        <td className="py-3 px-3">{entry.projectName}</td>
                        <td className="py-3 px-3">
                          <Badge variant="secondary">{entry.category}</Badge>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {entry.clockIn ? formatDateTime(entry.clockIn) : "—"}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {entry.clockOut ? formatDateTime(entry.clockOut) : "—"}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono">{entry.duration || "—"}</span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              entry.status === "completed"
                                ? "success"
                                : entry.status === "voided"
                                ? "destructive"
                                : "warning"
                            }
                          >
                            {entry.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          {entry.status !== "voided" && (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditEntry(entry.id)}
                                disabled={editing}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVoidEntry(entry.id)}
                                disabled={voiding}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Void
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No time entries yet.
              </p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
