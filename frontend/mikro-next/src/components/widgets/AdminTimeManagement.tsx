"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  useAdminActiveSessions,
  useAdminTimeHistory,
  useForceClockOut,
  useVoidTimeEntry,
  useEditTimeEntry,
  useAdminAddTimeEntry,
  useUsersList,
  useOrgProjects,
} from "@/hooks";
import type { TimeEntry } from "@/types";

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

/** Convert ISO string to datetime-local input value (local timezone) */
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

/** Convert datetime-local input value back to ISO string */
function fromDatetimeLocal(value: string): string {
  return new Date(value).toISOString();
}

const CATEGORY_OPTIONS = ["mapping", "validation", "review", "training", "other"];

export function AdminTimeManagement() {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [liveDurations, setLiveDurations] = useState<Record<number, string>>({});
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Add Entry modal state
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [addProjectId, setAddProjectId] = useState("");
  const [addCategory, setAddCategory] = useState("mapping");
  const [addClockIn, setAddClockIn] = useState("");
  const [addClockOut, setAddClockOut] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const { data: activeSessions, loading: sessionsLoading, refetch: refetchSessions } = useAdminActiveSessions();
  const { data: historyData, loading: historyLoading, refetch: refetchHistory } = useAdminTimeHistory();
  const { mutate: forceClockOut, loading: forcingClockOut } = useForceClockOut();
  const { mutate: voidEntry, loading: voiding } = useVoidTimeEntry();
  const { mutate: editEntry, loading: editing } = useEditTimeEntry();
  const { mutate: addTimeEntry, loading: addingEntry } = useAdminAddTimeEntry();
  const { data: usersData } = useUsersList();
  const { data: projectsData } = useOrgProjects();

  const users = usersData?.users || [];
  const projects = projectsData?.org_active_projects || [];

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

  const handleOpenEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditClockIn(entry.clockIn ? toDatetimeLocal(entry.clockIn) : "");
    setEditClockOut(entry.clockOut ? toDatetimeLocal(entry.clockOut) : "");
    setEditCategory(entry.category.toLowerCase());
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    setEditError(null);

    if (!editClockIn) {
      setEditError("Clock in time is required");
      return;
    }

    try {
      await editEntry({
        entry_id: editingEntry.id,
        clockIn: fromDatetimeLocal(editClockIn),
        clockOut: editClockOut ? fromDatetimeLocal(editClockOut) : undefined,
        category: editCategory,
      });
      setEditingEntry(null);
      await refetchHistory();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update entry");
    }
  };

  const handleOpenAddEntry = () => {
    setAddUserId("");
    setAddProjectId("");
    setAddCategory("mapping");
    setAddClockIn("");
    setAddClockOut("");
    setAddNotes("");
    setAddError(null);
    setShowAddEntry(true);
  };

  const handleSaveAddEntry = async () => {
    setAddError(null);
    if (!addUserId) { setAddError("User is required"); return; }
    if (!addClockIn) { setAddError("Clock in time is required"); return; }
    if (!addClockOut) { setAddError("Clock out time is required"); return; }

    try {
      await addTimeEntry({
        userId: addUserId,
        projectId: addProjectId ? Number(addProjectId) : undefined,
        category: addCategory,
        clockIn: fromDatetimeLocal(addClockIn),
        clockOut: fromDatetimeLocal(addClockOut),
        notes: addNotes,
      });
      setShowAddEntry(false);
      await refetchHistory();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to create entry");
    }
  };

  const handleFillTestEntry = () => {
    const now = new Date();
    const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    setAddClockIn(toDatetimeLocal(eightHoursAgo.toISOString()));
    setAddClockOut(toDatetimeLocal(now.toISOString()));
    setAddNotes("[DEV TEST ENTRY]");
  };

  return (
    <div className="h-full">
      <Card className="h-full">
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
            <div className="flex items-center gap-2">
              <div className="flex gap-1 rounded-lg bg-secondary p-1">
                <button
                  onClick={() => setActiveTab("active")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeTab === "active"
                      ? "bg-background text-foreground shadow font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Active Sessions ({sessions.length})
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeTab === "history"
                      ? "bg-background text-foreground shadow font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  History
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={handleOpenAddEntry}>
                + Add Entry
              </Button>
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
              <div className="overflow-auto max-h-[384px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background z-10">
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
              <div className="overflow-auto max-h-[384px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background z-10">
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
                          {entry.notes?.startsWith("[ADJUSTMENT REQUESTED]") && (
                            <Badge variant="warning" className="ml-1 text-xs">adjust</Badge>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {entry.status !== "voided" && (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEdit(entry)}
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

      {/* Edit Entry Modal */}
      <Modal
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        title="Edit Time Entry"
        description={editingEntry ? `${editingEntry.userName} — ${editingEntry.projectName}` : ""}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEdit}
              isLoading={editing}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {editingEntry && (
          <div className="space-y-4">
            {editError && (
              <p className="text-sm text-red-600">{editError}</p>
            )}

            {editingEntry.notes?.startsWith("[ADJUSTMENT REQUESTED]") && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3">
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  User Requested Adjustment
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  {editingEntry.notes.replace("[ADJUSTMENT REQUESTED] ", "")}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Clock In</label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={editClockIn}
                onChange={(e) => setEditClockIn(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Clock Out</label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={editClockOut}
                onChange={(e) => setEditClockOut(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Entry Modal */}
      <Modal
        isOpen={showAddEntry}
        onClose={() => setShowAddEntry(false)}
        title="Add Time Entry"
        description="Manually create a time entry for a user"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddEntry(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveAddEntry}
              isLoading={addingEntry}
            >
              Create Entry
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {addError && (
            <p className="text-sm text-red-600">{addError}</p>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">User</label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
            >
              <option value="">Select a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Project (optional)</label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={addProjectId}
              onChange={(e) => setAddProjectId(e.target.value)}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Clock In</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={addClockIn}
              onChange={(e) => setAddClockIn(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Clock Out</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={addClockOut}
              onChange={(e) => setAddClockOut(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handleFillTestEntry}
            className="w-full text-xs text-yellow-700 dark:text-yellow-400 border border-dashed border-yellow-400 rounded-md py-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 transition-colors"
          >
            Fill 8-Hour Test Entry (now - 8h → now)
          </button>

          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={2}
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              placeholder="Reason for manual entry..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
