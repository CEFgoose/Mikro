"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import {
  useFetchEditingStats,
  useFetchTimekeepingStats,
  useFetchTeams,
} from "@/hooks/useApi";
import type {
  EditingStatsResponse,
  TimekeepingStatsResponse,
} from "@/types";
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── Color Constants ─────────────────────────────────────────

const COLORS = {
  mapped: "#f97316",
  validated: "#3b82f6",
  invalidated: "#ef4444",
  hours: "#10b981",
  review: "#6366f1",
  training: "#f59e0b",
  other: "#9ca3af",
};

const CATEGORY_COLORS: Record<string, string> = {
  mapping: "#f97316",
  validation: "#3b82f6",
  review: "#6366f1",
  training: "#f59e0b",
  other: "#9ca3af",
};

// ─── Helper Components ───────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
    </div>
  );
}

// ─── Helper Functions ────────────────────────────────────────

function getDateRange(preset: "daily" | "weekly" | "monthly"): {
  start: string;
  end: string;
} {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start: string;
  switch (preset) {
    case "daily":
      start = end;
      break;
    case "weekly": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split("T")[0];
      break;
    }
    case "monthly": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      start = d.toISOString().split("T")[0];
      break;
    }
  }
  return { start, end };
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Main Page Component ─────────────────────────────────────

export default function AdminReportsPage() {
  const router = useRouter();

  // ── State ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("editing");
  const [datePreset, setDatePreset] = useState<
    "daily" | "weekly" | "monthly" | "custom"
  >("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [teamFilter, setTeamFilter] = useState<number | null>(null);
  const [snapshotTime, setSnapshotTime] = useState<string | null>(null);
  const [editingData, setEditingData] =
    useState<EditingStatsResponse | null>(null);
  const [timekeepingData, setTimekeepingData] =
    useState<TimekeepingStatsResponse | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(
    new Set()
  );

  // ── Hooks ────────────────────────────────────────────────
  const { mutate: fetchEditing, loading: editingLoading, error: editingError } =
    useFetchEditingStats();
  const { mutate: fetchTimekeeping, loading: timekeepingLoading, error: timekeepingError } =
    useFetchTimekeepingStats();
  const { data: teamsData } = useFetchTeams();

  // ── Data Fetching ────────────────────────────────────────
  const fetchData = useCallback(async () => {
    let startDate: string, endDate: string;
    if (datePreset === "custom") {
      if (!customStart || !customEnd) return;
      startDate = customStart;
      endDate = customEnd;
    } else {
      const range = getDateRange(datePreset);
      startDate = range.start;
      endDate = range.end;
    }

    const params = { startDate, endDate, teamId: teamFilter };

    try {
      if (activeTab === "editing") {
        const res = await fetchEditing(params);
        if (res?.status === 200) {
          setEditingData(res);
          setSnapshotTime(res.snapshot_timestamp);
        }
      } else if (activeTab === "timekeeping") {
        const res = await fetchTimekeeping(params);
        if (res?.status === 200) {
          setTimekeepingData(res);
          setSnapshotTime(res.snapshot_timestamp);
        }
      }
    } catch {
      // API errors are handled by the hook's error state
    }
  }, [
    datePreset,
    customStart,
    customEnd,
    teamFilter,
    activeTab,
    fetchEditing,
    fetchTimekeeping,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Organization-wide analytics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          {snapshotTime && (
            <span className="text-xs text-muted-foreground">
              Snapshot: {formatDateTime(snapshotTime)}
            </span>
          )}
          <button
            onClick={() => fetchData()}
            disabled={editingLoading || timekeepingLoading}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-kaart-orange text-white text-sm font-medium hover:bg-kaart-orange-dark transition-colors disabled:opacity-50"
          >
            {editingLoading || timekeepingLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {/* CONTROLS ROW */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Date range picker */}
            <div className="flex items-center gap-2">
              {(["daily", "weekly", "monthly", "custom"] as const).map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => setDatePreset(preset)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      datePreset === preset
                        ? "bg-kaart-orange text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </button>
                )
              )}
            </div>

            {datePreset === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 border border-input rounded-lg text-sm"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 border border-input rounded-lg text-sm"
                />
              </div>
            )}

            {/* Team filter */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Team:</span>
              <select
                value={teamFilter ?? ""}
                onChange={(e) =>
                  setTeamFilter(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="px-3 py-1.5 border border-input rounded-lg text-sm bg-background"
              >
                <option value="">All Teams</option>
                {teamsData?.teams?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABS */}
      <Tabs defaultValue="editing" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="editing">Editing</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="timekeeping">Timekeeping</TabsTrigger>
        </TabsList>

        {/* ═══════ EDITING TAB ═══════ */}
        <TabsContent value="editing">
          {editingLoading ? (
            <LoadingSpinner />
          ) : editingError ? (
            <Card>
              <CardContent className="p-8 text-center text-red-500">
                Failed to load editing stats: {editingError}
              </CardContent>
            </Card>
          ) : editingData ? (
            <div className="space-y-6">
              {/* Summary Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Tasks Mapped"
                  value={editingData.summary.total_mapped}
                />
                <StatCard
                  label="Tasks Validated"
                  value={editingData.summary.total_validated}
                />
                <StatCard
                  label="Tasks Invalidated"
                  value={editingData.summary.total_invalidated}
                />
                <StatCard
                  label="Active Projects"
                  value={editingData.summary.active_projects}
                  sub={`${editingData.summary.completed_projects} completed`}
                />
              </div>

              {/* Tasks Over Time Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Tasks Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {editingData.tasks_over_time.length > 0 ? (
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={editingData.tasks_over_time}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="week"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v: string) =>
                              new Date(
                                v + "T00:00:00"
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            }
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            labelFormatter={(v) =>
                              new Date(
                                String(v) + "T00:00:00"
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            }
                          />
                          <Legend />
                          <Bar
                            dataKey="mapped"
                            name="Mapped"
                            fill={COLORS.mapped}
                          />
                          <Bar
                            dataKey="validated"
                            name="Validated"
                            fill={COLORS.validated}
                          />
                          <Bar
                            dataKey="invalidated"
                            name="Invalidated"
                            fill={COLORS.invalidated}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No task data for this period.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Project Progress Table */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Project Progress ({editingData.projects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Project
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Progress
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Mapped
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Validated
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            % Validated
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Map Rate
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Val Rate
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-white">
                        {editingData.projects.map((proj) => (
                          <tr key={proj.id}>
                            <td className="px-6 py-4">
                              {proj.url ? (
                                <a
                                  href={proj.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-kaart-orange hover:underline"
                                >
                                  {proj.name}
                                </a>
                              ) : (
                                <span className="font-medium text-gray-900">
                                  {proj.name}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"
                                  style={{ minWidth: 80 }}
                                >
                                  <div
                                    className="h-full bg-kaart-orange rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(proj.percent_mapped, 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-10 text-right">
                                  {proj.percent_mapped}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {proj.tasks_mapped}/{proj.total_tasks}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {proj.tasks_validated}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {proj.percent_validated}%
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              ${proj.mapping_rate.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              ${proj.validation_rate.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  proj.status
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {proj.status ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Top Contributors Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Contributors</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            OSM Username
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Mapped
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Validated
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Invalidated
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Hours
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-white">
                        {editingData.top_contributors.map((c) => (
                          <tr
                            key={c.osm_username}
                            className={
                              c.user_id
                                ? "cursor-pointer hover:bg-muted/50 transition-colors"
                                : ""
                            }
                            onClick={() =>
                              c.user_id &&
                              router.push(
                                `/admin/users/${encodeURIComponent(c.user_id)}`
                              )
                            }
                          >
                            <td className="px-6 py-4">
                              <span
                                className={
                                  c.user_id
                                    ? "font-medium text-kaart-orange"
                                    : "font-medium text-gray-900"
                                }
                              >
                                {c.user_name}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {c.osm_username}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {c.tasks_mapped}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {c.tasks_validated}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {c.tasks_invalidated}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {c.total_hours}h
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  Select a date range and click Refresh to load editing
                  statistics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════ COMMUNITY TAB ═══════ */}
        <TabsContent value="community">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-kaart-orange/20 flex items-center justify-center text-kaart-orange text-2xl mx-auto mb-4">
                <svg
                  style={{ width: 32, height: 32 }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Community Reports Coming Soon
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Community event tracking, interaction logs, and participant
                analytics will be available here once the community data
                models are implemented.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TIMEKEEPING TAB ═══════ */}
        <TabsContent value="timekeeping">
          {timekeepingLoading ? (
            <LoadingSpinner />
          ) : timekeepingError ? (
            <Card>
              <CardContent className="p-8 text-center text-red-500">
                Failed to load timekeeping stats: {timekeepingError}
              </CardContent>
            </Card>
          ) : timekeepingData ? (
            <div className="space-y-6">
              {/* Summary Card + Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="md:col-span-2">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                      Total Team Hours
                    </p>
                    <div className="flex items-baseline gap-3 mt-1">
                      <p className="text-3xl font-bold">
                        {timekeepingData.summary.total_hours.toLocaleString()}
                        h
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          timekeepingData.summary
                            .weekly_rate_change_percent >= 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {timekeepingData.summary
                          .weekly_rate_change_percent >= 0
                          ? "+"
                          : ""}
                        {
                          timekeepingData.summary
                            .weekly_rate_change_percent
                        }
                        %
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {timekeepingData.summary.total_entries.toLocaleString()}{" "}
                      entries across{" "}
                      {timekeepingData.summary.active_users} users
                    </p>
                  </CardContent>
                </Card>
                <StatCard
                  label="Total Changesets"
                  value={timekeepingData.summary.total_changesets.toLocaleString()}
                />
                <StatCard
                  label="Total Changes"
                  value={timekeepingData.summary.total_changes.toLocaleString()}
                />
              </div>

              {/* Hours by Category — Horizontal BarChart */}
              <Card>
                <CardHeader>
                  <CardTitle>Hours by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {timekeepingData.hours_by_category.length > 0 ? (
                    <div
                      style={{
                        width: "100%",
                        height: Math.max(
                          200,
                          timekeepingData.hours_by_category.length * 50
                        ),
                      }}
                    >
                      <ResponsiveContainer>
                        <BarChart
                          data={timekeepingData.hours_by_category}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            type="category"
                            dataKey="category"
                            tick={{ fontSize: 12 }}
                            width={100}
                            tickFormatter={(v: string) =>
                              v.charAt(0).toUpperCase() + v.slice(1)
                            }
                          />
                          <Tooltip
                            formatter={(value) => [
                              `${value}h`,
                              "Hours",
                            ]}
                          />
                          <Bar dataKey="hours" name="Hours">
                            {timekeepingData.hours_by_category.map(
                              (entry, index) => (
                                <Cell
                                  key={index}
                                  fill={
                                    CATEGORY_COLORS[entry.category] ||
                                    CATEGORY_COLORS.other
                                  }
                                />
                              )
                            )}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No time tracking data for this period.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Weekly Activity — ComposedChart */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {timekeepingData.weekly_activity.length > 0 ? (
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <ComposedChart
                          data={timekeepingData.weekly_activity}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="week"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v: string) =>
                              new Date(
                                v + "T00:00:00"
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            }
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip
                            labelFormatter={(v) =>
                              new Date(
                                String(v) + "T00:00:00"
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            }
                          />
                          <Legend />
                          <Bar
                            yAxisId="left"
                            dataKey="hours"
                            name="Hours"
                            fill={COLORS.hours}
                          />
                          <Line
                            yAxisId="right"
                            dataKey="changes_per_hour"
                            name="Changes/Hour"
                            stroke={COLORS.mapped}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                          <Line
                            yAxisId="right"
                            dataKey="changes_per_changeset"
                            name="Changes/Changeset"
                            stroke={COLORS.review}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No weekly activity data for this period.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Per-User Time Tracking Table */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Time Tracking by User (
                    {timekeepingData.user_breakdown.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 w-8"></th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            OSM Username
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Hours
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Records
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Changesets
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                            Changes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-white">
                        {timekeepingData.user_breakdown.map((u) => {
                          const isExpanded = expandedUsers.has(
                            u.user_id
                          );
                          return (
                            <Fragment key={u.user_id}>
                              <tr
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => {
                                  const next = new Set(expandedUsers);
                                  if (isExpanded)
                                    next.delete(u.user_id);
                                  else next.add(u.user_id);
                                  setExpandedUsers(next);
                                }}
                              >
                                <td className="px-6 py-4 text-gray-400">
                                  {isExpanded ? "\u25BC" : "\u25B6"}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                  {u.user_name}
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                  {u.osm_username || "\u2014"}
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                  {u.total_hours}h
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                  {u.entries_count}
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                  {u.changeset_count}
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                  {u.changes_count.toLocaleString()}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td
                                    colSpan={7}
                                    className="px-12 py-3 bg-muted/30"
                                  >
                                    <div className="flex flex-wrap gap-4">
                                      {Object.entries(
                                        u.category_hours
                                      ).map(([cat, hrs]) => (
                                        <div
                                          key={cat}
                                          className="flex items-center gap-2"
                                        >
                                          <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                              backgroundColor:
                                                CATEGORY_COLORS[
                                                  cat
                                                ] ||
                                                CATEGORY_COLORS.other,
                                            }}
                                          />
                                          <span className="text-sm text-gray-700 capitalize">
                                            {cat}:{" "}
                                            <span className="font-medium">
                                              {hrs}h
                                            </span>
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  Select a date range and click Refresh to load
                  timekeeping statistics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
