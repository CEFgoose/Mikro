"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import {
  useFetchUserProfile,
  useFetchUserStatsByDate,
  useFetchUserChangesets,
  useFetchUserActivityChart,
  useFetchUserTaskHistory,
} from "@/hooks/useApi";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  UserProfileData,
  TimeEntry,
  UserStatsDateProjectBreakdown,
  Changeset,
  ChangesetSummary,
  ActivityDataPoint,
  TaskHistoryEntry,
} from "@/types";

const MappingHeatmap = dynamic(() => import("@/components/MappingHeatmap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-muted rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </div>
  ),
});

type DatePreset = "daily" | "weekly" | "monthly" | "custom";

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getDateRange(preset: DatePreset): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start: string;
  switch (preset) {
    case "daily":
      start = end;
      break;
    case "weekly": {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      start = weekAgo.toISOString().split("T")[0];
      break;
    }
    case "monthly": {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      start = monthAgo.toISOString().split("T")[0];
      break;
    }
    default:
      start = end;
  }
  return { start, end };
}

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
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = decodeURIComponent(params.id as string);

  const {
    mutate: fetchProfile,
    loading: profileLoading,
    error: profileError,
  } = useFetchUserProfile();
  const { mutate: fetchStats, loading: statsLoading } =
    useFetchUserStatsByDate();
  const { mutate: fetchChangesets } = useFetchUserChangesets();
  const { mutate: fetchActivity } = useFetchUserActivityChart();
  const { mutate: fetchTaskHistory } = useFetchUserTaskHistory();

  const [user, setUser] = useState<UserProfileData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customStartTime, setCustomStartTime] = useState("00:00");
  const [customEndTime, setCustomEndTime] = useState("23:59");
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<
    UserStatsDateProjectBreakdown[]
  >([]);
  const [filteredTotalHours, setFilteredTotalHours] = useState(0);
  const [filteredEntriesCount, setFilteredEntriesCount] = useState(0);
  const [dateLabel, setDateLabel] = useState("");

  // Date-filtered task stats
  const [periodTaskStats, setPeriodTaskStats] = useState({
    tasks_mapped: 0,
    tasks_validated: 0,
    tasks_invalidated: 0,
    validator_validated: 0,
    mapping_earnings: 0,
    validation_earnings: 0,
  });

  // Changeset state
  const [changesets, setChangesets] = useState<Changeset[]>([]);
  const [changesetSummary, setChangesetSummary] =
    useState<ChangesetSummary | null>(null);
  const [hashtagSummary, setHashtagSummary] = useState<
    Record<string, number>
  >({});
  const [changesetsLoading, setChangesetsLoading] = useState(false);
  const [changesetsError, setChangesetsError] = useState<string | null>(null);
  const [showAllChangesets, setShowAllChangesets] = useState(false);

  // Activity chart state
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Task history state
  const [taskHistory, setTaskHistory] = useState<TaskHistoryEntry[]>([]);
  const [taskHistoryLoading, setTaskHistoryLoading] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Heatmap state
  const [heatmapPoints, setHeatmapPoints] = useState<
    [number, number, number][]
  >([]);

  // Load profile on mount
  useEffect(() => {
    if (userId) {
      fetchProfile({ userId })
        .then((res) => {
          if (res?.user) setUser(res.user);
        })
        .catch(() => {})
        .finally(() => setPageLoading(false));
    }
  }, [userId, fetchProfile]);

  const loadDateStats = useCallback(
    async (startDate: string, endDate: string) => {
      try {
        const res = await fetchStats({ userId, startDate, endDate });
        if (res?.stats) {
          setFilteredEntries(res.stats.time_entries || []);
          setFilteredProjects(res.stats.projects || []);
          setFilteredTotalHours(res.stats.total_hours || 0);
          setFilteredEntriesCount(res.stats.entries_count || 0);
          setDateLabel(
            `${formatDate(res.stats.startDate)} - ${formatDate(res.stats.endDate)}`
          );
          setPeriodTaskStats({
            tasks_mapped: res.stats.tasks_mapped || 0,
            tasks_validated: res.stats.tasks_validated || 0,
            tasks_invalidated: res.stats.tasks_invalidated || 0,
            validator_validated: res.stats.validator_validated || 0,
            mapping_earnings: res.stats.mapping_earnings || 0,
            validation_earnings: res.stats.validation_earnings || 0,
          });
        }
      } catch {
        // Error handled by hook
      }
    },
    [userId, fetchStats]
  );

  const loadChangesets = useCallback(
    async (startDate: string, endDate: string) => {
      setChangesetsLoading(true);
      setChangesetsError(null);
      try {
        const res = await fetchChangesets({ userId, startDate, endDate });
        if (res?.changesets) {
          setChangesets(res.changesets);
          setChangesetSummary(res.summary || null);
          setHashtagSummary(res.hashtagSummary || {});
          if (res.heatmapPoints) {
            setHeatmapPoints(res.heatmapPoints);
          }
        }
        if (res?.message && !res.changesets?.length) {
          setChangesetsError(res.message);
        }
      } catch {
        setChangesetsError("Failed to load changeset data");
      } finally {
        setChangesetsLoading(false);
      }
    },
    [userId, fetchChangesets]
  );

  const loadActivity = useCallback(
    async (startDate: string, endDate: string) => {
      setActivityLoading(true);
      try {
        const res = await fetchActivity({ userId, startDate, endDate });
        setActivityData(res?.activity || []);
      } catch {
        // handled
      } finally {
        setActivityLoading(false);
      }
    },
    [userId, fetchActivity]
  );

  const loadTaskHistory = useCallback(
    async (startDate: string, endDate: string) => {
      setTaskHistoryLoading(true);
      try {
        const res = await fetchTaskHistory({ userId, startDate, endDate });
        setTaskHistory(res?.tasks || []);
      } catch {
        // handled
      } finally {
        setTaskHistoryLoading(false);
      }
    },
    [userId, fetchTaskHistory]
  );

  // Load date-filtered stats + changesets + activity + history when preset changes
  useEffect(() => {
    if (!userId || datePreset === "custom") return;
    const { start, end } = getDateRange(datePreset);
    loadDateStats(start, end);
    loadChangesets(start, end);
    loadActivity(start, end);
    loadTaskHistory(start, end);
  }, [userId, datePreset, loadDateStats, loadChangesets, loadActivity, loadTaskHistory]);

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      const startDT = `${customStart}T${customStartTime}:00`;
      const endDT = `${customEnd}T${customEndTime}:00`;
      loadDateStats(startDT, endDT);
      loadChangesets(customStart, customEnd);
      loadActivity(customStart, customEnd);
      loadTaskHistory(customStart, customEnd);
    }
  };

  const exportChangesetsCSV = () => {
    const header =
      "Changeset ID,Date,Changes,Added,Modified,Deleted,Comment,Hashtags\n";
    const rows = changesets
      .map(
        (c) =>
          `${c.id},"${formatDateTime(c.createdAt)}",${c.changesCount},${c.added ?? ""},${c.modified ?? ""},${c.deleted ?? ""},"${(c.comment || "").replace(/"/g, '""')}","${c.hashtags.join("; ")}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${user?.osm_username || "user"}_changesets_${customStart || "all"}_${customEnd || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const initials = useMemo(() => {
    if (!user) return "?";
    const first = user.first_name?.[0] || "";
    const last = user.last_name?.[0] || "";
    return (
      (first + last).toUpperCase() ||
      user.full_name?.[0]?.toUpperCase() ||
      "?"
    );
  }, [user]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
      </div>
    );
  }

  if (profileError && !user) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/users"
          className="text-kaart-orange hover:underline text-sm"
        >
          &larr; Back to Users
        </Link>
        <Card>
          <CardContent className="p-8 text-center text-red-500">
            Failed to load user profile: {profileError}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  const isValidator = user.role === "validator" || user.role === "admin";
  const locationParts = [user.city, user.country].filter(Boolean).join(", ");
  const displayedChangesets = showAllChangesets
    ? changesets
    : changesets.slice(0, 10);
  const displayedHistory = showAllHistory
    ? taskHistory
    : taskHistory.slice(0, 20);
  const sortedHashtags = Object.entries(hashtagSummary).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="space-y-6">
      {/* Section 1: Header */}
      <Card>
        <CardContent className="p-6">
          <Link
            href="/admin/users"
            className="text-kaart-orange hover:underline text-sm mb-4 inline-block"
          >
            &larr; Back to Users
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-kaart-orange/20 flex items-center justify-center text-kaart-orange text-xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.full_name ||
                    `${user.first_name} ${user.last_name}`}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : user.role === "validator"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                  }`}
                >
                  {user.role}
                </span>
                {user.mapper_level != null && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Level {user.mapper_level}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1">{user.email}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                {user.osm_username && (
                  <a
                    href={`https://www.openstreetmap.org/user/${user.osm_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-kaart-orange hover:underline"
                  >
                    OSM: {user.osm_username}
                  </a>
                )}
                {user.osm_username && locationParts && (
                  <span className="text-gray-300">|</span>
                )}
                {locationParts && <span>{locationParts}</span>}
              </div>
              {user.joined && (
                <p className="text-sm text-muted-foreground mt-1">
                  Joined: {formatDate(user.joined)}
                </p>
              )}
              {user.payment_email && (
                <p className="text-sm text-muted-foreground mt-1">
                  Payment email:{" "}
                  <span className="font-medium text-foreground">
                    {user.payment_email}
                  </span>
                </p>
              )}
              {(user.mapper_points != null || user.validator_points != null) && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  {user.mapper_points != null && (
                    <span>Mapper pts: <span className="font-medium text-foreground">{user.mapper_points}</span></span>
                  )}
                  {user.validator_points != null && user.validator_points > 0 && (
                    <span>Validator pts: <span className="font-medium text-foreground">{user.validator_points}</span></span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: All-time Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tasks Mapped" value={user.total_tasks_mapped ?? 0} />
        <StatCard
          label="Tasks Validated"
          value={user.total_tasks_validated ?? 0}
        />
        <StatCard
          label="Tasks Invalidated"
          value={user.total_tasks_invalidated ?? 0}
        />
        <StatCard
          label="Total Earnings"
          value={`$${(user.payable_total ?? 0).toFixed(2)}`}
        />
      </div>

      {/* Section 3: Validator Stats (conditional) */}
      {isValidator && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Validated by User"
            value={user.validator_tasks_validated ?? 0}
          />
          <StatCard
            label="Invalidated by User"
            value={user.validator_tasks_invalidated ?? 0}
          />
          <StatCard
            label="Checklists Completed"
            value={user.total_checklists_completed ?? 0}
          />
          <StatCard
            label="Checklists Confirmed"
            value={user.validator_total_checklists_confirmed ?? 0}
          />
        </div>
      )}

      {/* Section 4: Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Mapping</p>
              <p className="text-lg font-semibold">
                ${(user.mapping_payable_total ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Validation</p>
              <p className="text-lg font-semibold">
                ${(user.validation_payable_total ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Checklists</p>
              <p className="text-lg font-semibold">
                ${(user.checklist_payable_total ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Payable</p>
              <p className="text-lg font-semibold text-green-600">
                ${(user.payable_total ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Requested</p>
              <p className="text-lg font-semibold text-yellow-600">
                ${(user.requested_total ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-lg font-semibold text-blue-600">
                ${(user.paid_total ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Projects */}
      {user.projects && user.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
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
                      Mapped
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Validated
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Invalidated
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Earnings
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {user.projects.map((proj) => (
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
                      <td className="px-6 py-4 text-gray-700">
                        {proj.tasks_mapped}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {proj.tasks_validated}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {proj.tasks_invalidated}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        $
                        {(
                          proj.mapping_earnings + proj.validation_earnings
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ DATE-FILTERED SECTION ═══════════ */}
      <div className="border-t-2 border-kaart-orange/30 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Date-Filtered Analysis
        </h2>

        {/* Date Range Picker */}
        <Card className="mb-6">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {(["daily", "weekly", "monthly", "custom"] as DatePreset[]).map(
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
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm text-muted-foreground">From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 border border-input rounded-lg text-sm"
                />
                <input
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="px-2 py-1.5 border border-input rounded-lg text-sm"
                />
                <label className="text-sm text-muted-foreground">To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 border border-input rounded-lg text-sm"
                />
                <input
                  type="time"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  className="px-2 py-1.5 border border-input rounded-lg text-sm"
                />
                <button
                  onClick={handleApplyCustom}
                  disabled={!customStart || !customEnd}
                  className="px-3 py-1.5 bg-kaart-orange text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            )}

            {dateLabel && (
              <p className="text-sm text-muted-foreground">
                Showing: {dateLabel}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Task Stats for Period */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard label="Mapped" value={periodTaskStats.tasks_mapped} />
          <StatCard label="Validated" value={periodTaskStats.tasks_validated} />
          <StatCard
            label="Invalidated"
            value={periodTaskStats.tasks_invalidated}
          />
          <StatCard
            label="Val. by User"
            value={periodTaskStats.validator_validated}
          />
          <StatCard
            label="Map Earnings"
            value={`$${periodTaskStats.mapping_earnings.toFixed(2)}`}
          />
          <StatCard
            label="Val Earnings"
            value={`$${periodTaskStats.validation_earnings.toFixed(2)}`}
          />
        </div>

        {/* Activity Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kaart-orange" />
                Loading activity data...
              </div>
            ) : activityData.length > 0 ? (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <ComposedChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: string) =>
                        new Date(v + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      labelFormatter={(v) =>
                        new Date(String(v) + "T00:00:00").toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      }
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="tasksMapped"
                      name="Tasks Mapped"
                      fill="#f97316"
                      stackId="tasks"
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="tasksValidated"
                      name="Tasks Validated"
                      fill="#3b82f6"
                      stackId="tasks"
                    />
                    <Line
                      yAxisId="right"
                      dataKey="hoursWorked"
                      name="Hours Worked"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              dateLabel && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activity data for this period.
                </p>
              )
            )}
          </CardContent>
        </Card>

        {/* Time Tracking */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Time Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dateLabel && (
              <div className="text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">
                    {filteredTotalHours.toFixed(1)} hours
                  </span>{" "}
                  across{" "}
                  <span className="font-medium text-foreground">
                    {filteredEntriesCount} sessions
                  </span>
                </p>
              </div>
            )}

            {statsLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kaart-orange" />
                Loading...
              </div>
            )}

            {filteredEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Project
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Category
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Clock In
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Clock Out
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Duration
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {filteredEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className={
                          entry.status === "voided" ? "opacity-50" : ""
                        }
                      >
                        <td className="px-4 py-2">
                          {formatDate(entry.clockIn)}
                        </td>
                        <td className="px-4 py-2">
                          {entry.projectName || "-"}
                        </td>
                        <td className="px-4 py-2">
                          {entry.category || "-"}
                        </td>
                        <td className="px-4 py-2">
                          {formatDateTime(entry.clockIn)}
                        </td>
                        <td className="px-4 py-2">
                          {formatDateTime(entry.clockOut)}
                        </td>
                        <td className="px-4 py-2 font-mono">
                          {formatDuration(entry.durationSeconds)}
                        </td>
                        <td className="px-4 py-2">
                          {entry.status === "completed" ? (
                            <span className="text-green-600">Completed</span>
                          ) : entry.status === "active" ? (
                            <span className="text-yellow-600">Active</span>
                          ) : (
                            <span className="text-red-500">Voided</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !statsLoading &&
              dateLabel && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No time entries found for this period.
                </p>
              )
            )}

            {filteredProjects.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Per-project hours
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Project
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Hours
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Sessions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {filteredProjects.map((proj) => (
                        <tr key={proj.id}>
                          <td className="px-4 py-2 font-medium">{proj.name}</td>
                          <td className="px-4 py-2">
                            {proj.total_hours.toFixed(1)}h
                          </td>
                          <td className="px-4 py-2">{proj.entries_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task History */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Task History</CardTitle>
              {taskHistory.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {taskHistory.length} tasks
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {taskHistoryLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kaart-orange" />
                Loading task history...
              </div>
            ) : taskHistory.length > 0 ? (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Task
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Project
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Action
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {displayedHistory.map((t, i) => (
                        <tr key={`${t.taskId}-${t.action}-${i}`}>
                          <td className="px-4 py-2 font-mono">#{t.taskId}</td>
                          <td className="px-4 py-2">{t.projectName}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                t.action === "mapped"
                                  ? "bg-orange-100 text-orange-800"
                                  : t.action === "validated"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {t.action}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {formatDateTime(t.date)}
                          </td>
                          <td className="px-4 py-2">{t.status}</td>
                          <td className="px-4 py-2 text-right font-mono">
                            ${(t.mappingRate || t.validationRate || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {taskHistory.length > 20 && (
                  <button
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="text-sm text-kaart-orange hover:underline"
                  >
                    {showAllHistory
                      ? `Show less (20 of ${taskHistory.length})`
                      : `Show all ${taskHistory.length} tasks`}
                  </button>
                )}
              </div>
            ) : (
              dateLabel && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No task history for this period.
                </p>
              )
            )}
          </CardContent>
        </Card>

        {/* Changeset Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Changeset Analysis</CardTitle>
              {changesets.length > 0 && (
                <button
                  onClick={exportChangesetsCSV}
                  className="px-3 py-1.5 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
                >
                  Export CSV
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {changesetsLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kaart-orange" />
                Loading changeset data from OSM...
              </div>
            )}

            {changesetsError && !changesetsLoading && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {changesetsError}
              </p>
            )}

            {/* Summary cards */}
            {changesetSummary && !changesetsLoading && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <StatCard
                  label="Changesets"
                  value={changesetSummary.totalChangesets}
                />
                <StatCard
                  label="Total Changes"
                  value={changesetSummary.totalChanges}
                />
                <StatCard
                  label="Added"
                  value={changesetSummary.totalAdded}
                  sub="+ created"
                />
                <StatCard
                  label="Modified"
                  value={changesetSummary.totalModified}
                  sub="~ edited"
                />
                <StatCard
                  label="Deleted"
                  value={changesetSummary.totalDeleted}
                  sub="- removed"
                />
                <StatCard
                  label="Nodes"
                  value={changesetSummary.totalNodes}
                  sub="points"
                />
                <StatCard
                  label="Ways"
                  value={changesetSummary.totalWays}
                  sub="lines/areas"
                />
                <StatCard
                  label="Relations"
                  value={changesetSummary.totalRelations}
                  sub="groups"
                />
              </div>
            )}

            {/* Changeset table */}
            {displayedChangesets.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Changeset
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Date
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          Changes
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          +Add
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          ~Mod
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          -Del
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Comment
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Hashtags
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {displayedChangesets.map((cs) => (
                        <tr key={cs.id}>
                          <td className="px-4 py-2">
                            <a
                              href={`https://www.openstreetmap.org/changeset/${cs.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-kaart-orange hover:underline font-mono"
                            >
                              {cs.id}
                            </a>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {formatDateTime(cs.createdAt)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {cs.changesCount}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-green-600">
                            {cs.added ?? "-"}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-yellow-600">
                            {cs.modified ?? "-"}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-red-500">
                            {cs.deleted ?? "-"}
                          </td>
                          <td className="px-4 py-2 max-w-xs truncate">
                            {cs.comment || "-"}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-wrap gap-1">
                              {cs.hashtags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {changesets.length > 10 && (
                  <button
                    onClick={() => setShowAllChangesets(!showAllChangesets)}
                    className="text-sm text-kaart-orange hover:underline"
                  >
                    {showAllChangesets
                      ? `Show less (10 of ${changesets.length})`
                      : `Show all ${changesets.length} changesets`}
                  </button>
                )}
              </>
            )}

            {!changesetsLoading &&
              !changesetsError &&
              changesets.length === 0 &&
              dateLabel && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No changesets found for this period.
                </p>
              )}

            {/* Hashtag summary */}
            {sortedHashtags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Hashtag Summary
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sortedHashtags.map(([tag, count]) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {tag}
                      <span className="font-bold">({count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geographic Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Geographic Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {changesetsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kaart-orange" />
                Loading geographic data...
              </div>
            ) : (
              <MappingHeatmap points={heatmapPoints} height="400px" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
