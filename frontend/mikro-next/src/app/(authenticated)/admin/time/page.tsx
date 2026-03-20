"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Skeleton,
  Modal,
} from "@/components/ui";
import { useToastActions } from "@/components/ui";
import { FilterBar } from "@/components/filters";
import { useFilters } from "@/hooks";
import {
  useAdminTimeHistory,
  useAdminActiveSessions,
  useEditTimeEntry,
  useVoidTimeEntry,
  useAdminAddTimeEntry,
  useForceClockOut,
  useExportTimeEntries,
  useFetchFilterOptions,
  useUsersList,
  useOrgProjects,
} from "@/hooks/useApi";
import { formatNumber } from "@/lib/utils";
import type { TimeEntry } from "@/types";

// --- Date range presets ---

type DatePreset =
  | "this_week"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "all_time";

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  this_week: "This Week",
  this_month: "This Month",
  last_month: "Last Month",
  last_3_months: "Last 3 Months",
  all_time: "All Time",
};

function getDateRange(preset: DatePreset): {
  startDate: string | null;
  endDate: string | null;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "this_week": {
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek);
      return { startDate: start.toISOString().split("T")[0], endDate: null };
    }
    case "this_month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: start.toISOString().split("T")[0], endDate: null };
    }
    case "last_month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      };
    }
    case "last_3_months": {
      const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      return { startDate: start.toISOString().split("T")[0], endDate: null };
    }
    case "all_time":
      return { startDate: null, endDate: null };
  }
}

// --- Category options ---

const CATEGORIES = [
  "All",
  "Mapping",
  "Validation",
  "Review",
  "Training",
  "Other",
] as const;

const CATEGORY_OPTIONS = [
  "mapping",
  "validation",
  "review",
  "training",
  "other",
];

// --- Formatting helpers ---

function formatDateDisplay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "--";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
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

function secondsToHours(seconds: number): number {
  return Math.round((seconds / 3600) * 10) / 10;
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

// --- Constants ---

const PAGE_SIZE = 50;

// --- Page component ---

export default function AdminTimePage() {
  const toast = useToastActions();

  // Filters
  const [datePreset, setDatePreset] = useState<DatePreset>("this_month");
  const [category, setCategory] = useState<string>("All");
  const [userSearch, setUserSearch] = useState("");
  const { activeFilters, setActiveFilters, filtersBody } = useFilters();

  // Sorting
  const [sortKey, setSortKey] = useState<string>("clockIn");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(0);

  // Active sessions collapsible
  const [sessionsExpanded, setSessionsExpanded] = useState(true);

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Live durations for active sessions
  const [liveDurations, setLiveDurations] = useState<Record<number, string>>(
    {}
  );

  // Edit modal state
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Void confirmation state
  const [voidingEntryId, setVoidingEntryId] = useState<number | null>(null);

  // Add entry modal state
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [addProjectId, setAddProjectId] = useState("");
  const [addCategory, setAddCategory] = useState("mapping");
  const [addClockIn, setAddClockIn] = useState("");
  const [addClockOut, setAddClockOut] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  // Data fetching
  const {
    data: historyData,
    loading: historyLoading,
    refetch: refetchHistory,
  } = useAdminTimeHistory();
  const {
    data: sessionsData,
    loading: sessionsLoading,
    refetch: refetchSessions,
  } = useAdminActiveSessions();
  const { mutate: editEntry, loading: editing } = useEditTimeEntry();
  const { mutate: voidEntry, loading: voiding } = useVoidTimeEntry();
  const { mutate: addTimeEntry, loading: addingEntry } =
    useAdminAddTimeEntry();
  const { mutate: forceClockOut, loading: forcingClockOut } =
    useForceClockOut();
  const { exportEntries, loading: exporting } = useExportTimeEntries();
  const { data: filterOptions, loading: filterOptionsLoading } =
    useFetchFilterOptions();
  const { data: usersData } = useUsersList();
  const { data: projectsData } = useOrgProjects();

  const users = usersData?.users || [];
  const projects = projectsData?.org_active_projects || [];
  const sessions = sessionsData?.sessions || [];
  const allEntries: TimeEntry[] = historyData?.entries || [];

  // Close export dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportRef.current &&
        !exportRef.current.contains(event.target as Node)
      ) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build filter body and refetch when filters change
  const fetchWithFilters = useCallback(() => {
    const { startDate, endDate } = getDateRange(datePreset);
    const body: Record<string, unknown> = {};
    if (startDate) body.startDate = startDate;
    if (endDate) body.endDate = endDate;
    if (category !== "All") body.category = category.toLowerCase();
    if (filtersBody) body.filters = filtersBody;
    body.limit = 500;
    body.offset = 0;
    refetchHistory(body).catch(() => {});
  }, [datePreset, category, filtersBody, refetchHistory]);

  useEffect(() => {
    fetchWithFilters();
  }, [fetchWithFilters]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [datePreset, category, filtersBody, userSearch]);

  // Live duration ticker for active sessions
  useEffect(() => {
    if (sessions.length === 0) return;

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
  }, [sessions]);

  // Client-side filtering (fallback if backend doesn't filter)
  const filteredEntries = useMemo(() => {
    let entries = allEntries;

    const { startDate, endDate } = getDateRange(datePreset);
    if (startDate) {
      const start = new Date(startDate);
      entries = entries.filter(
        (e) => e.clockIn && new Date(e.clockIn) >= start
      );
    }
    if (endDate) {
      const end = new Date(endDate);
      entries = entries.filter((e) => e.clockIn && new Date(e.clockIn) < end);
    }

    if (category !== "All") {
      entries = entries.filter(
        (e) => e.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (userSearch.trim()) {
      const search = userSearch.trim().toLowerCase();
      entries = entries.filter(
        (e) => e.userName?.toLowerCase().includes(search)
      );
    }

    return entries;
  }, [allEntries, datePreset, category, userSearch]);

  // Filter active sessions by category and user search
  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    if (category !== "All") {
      filtered = filtered.filter(
        (s) => s.category?.toLowerCase() === category.toLowerCase()
      );
    }
    if (userSearch.trim()) {
      const search = userSearch.trim().toLowerCase();
      filtered = filtered.filter(
        (s) => s.userName?.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [sessions, category, userSearch]);

  // Stat computations
  const stats = useMemo(() => {
    const totalSeconds = filteredEntries.reduce(
      (sum, e) => sum + (e.durationSeconds ?? 0),
      0
    );

    const pendingAdjustments = filteredEntries.filter((e) =>
      e.notes?.startsWith("[ADJUSTMENT REQUESTED]")
    ).length;

    const voidedEntries = filteredEntries.filter(
      (e) => e.status === "voided"
    ).length;

    return {
      totalHours: secondsToHours(totalSeconds),
      activeSessions: filteredSessions.length,
      pendingAdjustments,
      voidedEntries,
    };
  }, [filteredEntries, filteredSessions]);

  // Sort handler
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "clockIn" ? "desc" : "asc");
    }
    setPage(0);
  };

  // Sorted entries
  const sortedEntries = useMemo(() => {
    const entries = [...filteredEntries];
    const dir = sortDir === "asc" ? 1 : -1;

    entries.sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortKey) {
        case "userName":
          aVal = (a.userName || "").toLowerCase();
          bVal = (b.userName || "").toLowerCase();
          break;
        case "projectName":
          aVal = (a.projectName || "").toLowerCase();
          bVal = (b.projectName || "").toLowerCase();
          break;
        case "category":
          aVal = (a.category || "").toLowerCase();
          bVal = (b.category || "").toLowerCase();
          break;
        case "clockIn":
          aVal = a.clockIn || "";
          bVal = b.clockIn || "";
          break;
        case "clockOut":
          aVal = a.clockOut || "";
          bVal = b.clockOut || "";
          break;
        case "duration":
          aVal = a.durationSeconds ?? 0;
          bVal = b.durationSeconds ?? 0;
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });

    return entries;
  }, [filteredEntries, sortKey, sortDir]);

  // Pagination
  const totalEntries = sortedEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  const pagedEntries = sortedEntries.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );
  const showingFrom = totalEntries === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalEntries);

  // --- Handlers ---

  const handleForceClockOut = async (id: number) => {
    try {
      await forceClockOut({ session_id: id });
      toast.success("User has been clocked out");
      await refetchSessions();
      await refetchHistory();
    } catch {
      toast.error("Failed to force clock out");
    }
  };

  const handleOpenEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditClockIn(entry.clockIn ? toDatetimeLocal(entry.clockIn) : "");
    setEditClockOut(entry.clockOut ? toDatetimeLocal(entry.clockOut) : "");
    setEditCategory(entry.category?.toLowerCase() || "mapping");
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
      toast.success("Time entry updated");
      fetchWithFilters();
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update entry"
      );
    }
  };

  const handleVoidEntry = async (id: number) => {
    try {
      await voidEntry({ entry_id: id });
      setVoidingEntryId(null);
      toast.success("Time entry voided");
      fetchWithFilters();
    } catch {
      toast.error("Failed to void entry");
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
    if (!addUserId) {
      setAddError("User is required");
      return;
    }
    if (!addClockIn) {
      setAddError("Clock in time is required");
      return;
    }
    if (!addClockOut) {
      setAddError("Clock out time is required");
      return;
    }

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
      toast.success("Time entry created");
      fetchWithFilters();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Failed to create entry"
      );
    }
  };

  const handleExport = async (format: "csv" | "json" | "pdf") => {
    setExportOpen(false);
    const { startDate, endDate } = getDateRange(datePreset);
    try {
      await exportEntries({
        startDate: startDate ?? undefined,
        endDate: endDate ?? undefined,
        category: category !== "All" ? category.toLowerCase() : undefined,
        filters: filtersBody,
        format,
      });
      toast.success("Report downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  // Loading state
  if (historyLoading && !historyData) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Time Management
          </h1>
          <p className="text-muted-foreground" style={{ marginTop: 8 }}>
            Manage time entries, active sessions, and exports
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleOpenAddEntry}>
          + Add Entry
        </Button>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(4, 1fr)",
        }}
      >
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
              Total Hours
            </p>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#ff6b35" }}>
              {formatNumber(stats.totalHours)}h
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              For filtered period
            </p>
          </div>
        </Card>

        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
              Active Sessions
            </p>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: stats.activeSessions > 0 ? "#16a34a" : "#6b7280",
              }}
            >
              {formatNumber(stats.activeSessions)}
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              {stats.activeSessions > 0
                ? "Currently clocked in"
                : "No active sessions"}
            </p>
          </div>
        </Card>

        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
              Pending Adjustments
            </p>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: stats.pendingAdjustments > 0 ? "#ca8a04" : "#16a34a",
              }}
            >
              {formatNumber(stats.pendingAdjustments)}
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              {stats.pendingAdjustments > 0
                ? "Awaiting review"
                : "No pending requests"}
            </p>
          </div>
        </Card>

        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
              Voided Entries
            </p>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: stats.voidedEntries > 0 ? "#dc2626" : "#6b7280",
              }}
            >
              {formatNumber(stats.voidedEntries)}
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              In filtered period
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* User search */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="text"
            placeholder="Search user..."
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-44"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </div>

        <FilterBar
          dimensions={
            filterOptions?.dimensions
              ? Object.entries(filterOptions.dimensions).map(
                  ([key, values]) => ({
                    key,
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                    options: Array.isArray(values)
                      ? values.map((v) =>
                          typeof v === "string"
                            ? { value: v, label: v }
                            : {
                                value: String(
                                  v.id ?? v.value ?? v.name
                                ),
                                label: v.name,
                              }
                        )
                      : [],
                  })
                )
              : []
          }
          activeFilters={activeFilters}
          onChange={setActiveFilters}
          loading={filterOptionsLoading}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label className="text-sm font-medium text-muted-foreground">
            Category:
          </label>
          <select
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label className="text-sm font-medium text-muted-foreground">
              Date Range:
            </label>
            <select
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
            >
              {Object.entries(DATE_PRESET_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Export dropdown */}
          <div ref={exportRef} className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(!exportOpen)}
              disabled={exporting}
              isLoading={exporting}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
            </Button>

            {exportOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-44 rounded-lg border border-border bg-card shadow-md">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => handleExport("csv")}
                    className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    Download CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("json")}
                    className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    Download JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("pdf")}
                    className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Sessions (collapsible) */}
      {filteredSessions.length > 0 && (
        <Card style={{ padding: 0 }}>
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
            onClick={() => setSessionsExpanded(!sessionsExpanded)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <h2 className="text-base font-semibold">
                Active Sessions ({filteredSessions.length})
              </h2>
            </div>
            <svg
              className={`w-5 h-5 text-muted-foreground transition-transform ${sessionsExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {sessionsExpanded && (
            <CardContent style={{ padding: 0, borderTop: "1px solid var(--border)" }}>
              {sessionsLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Loading active sessions...
                </p>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                          User
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                          Project
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                          Category
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                          Clocked In
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                          Live Duration
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessions.map((session) => (
                        <tr
                          key={session.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                              <span className="font-medium">
                                {session.userName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            {session.projectName || "--"}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="secondary">
                              {session.category}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {session.clockIn
                              ? formatDateTime(session.clockIn)
                              : "--"}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-green-600 font-medium">
                              {liveDurations[session.id] ||
                                session.duration ||
                                "--"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleForceClockOut(session.id)}
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
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* History Table */}
      <Card style={{ padding: 0 }}>
        <CardContent style={{ padding: 0 }}>
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  { key: "userName", label: "User" },
                  { key: "projectName", label: "Project" },
                  { key: "category", label: "Category" },
                  { key: "clockIn", label: "Clock In" },
                  { key: "clockOut", label: "Clock Out" },
                  { key: "duration", label: "Duration" },
                  { key: "status", label: "Status" },
                ].map((col) => (
                  <TableHead
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d={sortDir === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                        </svg>
                      )}
                    </span>
                  </TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedEntries.map((entry) => {
                const isVoided = entry.status === "voided";
                const hasPendingAdjustment = entry.notes?.startsWith(
                  "[ADJUSTMENT REQUESTED]"
                );
                const wasAdjusted = entry.notes?.startsWith("[ADJUSTED]");

                return (
                  <TableRow
                    key={entry.id}
                    className={isVoided ? "opacity-50" : ""}
                  >
                    <TableCell
                      className={`font-medium ${isVoided ? "line-through" : ""}`}
                    >
                      {entry.userName || "--"}
                    </TableCell>
                    <TableCell className={isVoided ? "line-through" : ""}>
                      {entry.projectName || "--"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {entry.category || "--"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-muted-foreground ${isVoided ? "line-through" : ""}`}
                    >
                      {entry.clockIn ? formatDateTime(entry.clockIn) : "--"}
                    </TableCell>
                    <TableCell
                      className={`text-muted-foreground ${isVoided ? "line-through" : ""}`}
                    >
                      {entry.clockOut ? formatDateTime(entry.clockOut) : "--"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-mono ${isVoided ? "line-through" : ""}`}
                      >
                        {formatDuration(entry.durationSeconds)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
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
                        {hasPendingAdjustment && (
                          <Badge
                            variant="destructive"
                            className="ml-1 text-xs uppercase"
                          >
                            Adjust
                          </Badge>
                        )}
                        {wasAdjusted && (
                          <Badge
                            className="ml-1 text-xs uppercase bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          >
                            Adjusted
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {!isVoided && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(entry)}
                            disabled={editing}
                            className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Edit entry"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          {voidingEntryId === entry.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleVoidEntry(entry.id)}
                                disabled={voiding}
                                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              >
                                {voiding ? "..." : "Confirm"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setVoidingEntryId(null)}
                                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setVoidingEntryId(entry.id)}
                              className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title="Void entry"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Empty state */}
              {pagedEntries.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "32px 16px",
                      color: "#6b7280",
                    }}
                  >
                    No time entries found for the selected filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalEntries > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p className="text-sm text-muted-foreground">
            Showing {formatNumber(showingFrom)}-{formatNumber(showingTo)} of{" "}
            {formatNumber(totalEntries)}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      <Modal
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        title="Edit Time Entry"
        description={
          editingEntry
            ? `${editingEntry.userName} -- ${editingEntry.projectName || "No project"}`
            : ""
        }
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
              <label className="block text-sm font-medium mb-1">
                Clock In
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={editClockIn}
                onChange={(e) => setEditClockIn(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Clock Out
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={editClockOut}
                onChange={(e) => setEditClockOut(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Category
              </label>
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
          {addError && <p className="text-sm text-red-600">{addError}</p>}

          <div>
            <label className="block text-sm font-medium mb-1">User</label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
            >
              <option value="">Select a user...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Project (optional)
            </label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={addProjectId}
              onChange={(e) => setAddProjectId(e.target.value)}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
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

          <div>
            <label className="block text-sm font-medium mb-1">
              Notes (optional)
            </label>
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
