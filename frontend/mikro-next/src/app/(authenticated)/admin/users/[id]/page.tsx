"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useFetchUserProfile, useFetchUserStatsByDate } from "@/hooks/useApi";
import type { UserProfileData, TimeEntry, UserStatsDateProjectBreakdown } from "@/types";

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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
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

  const { mutate: fetchProfile, loading: profileLoading, error: profileError } = useFetchUserProfile();
  const { mutate: fetchStats, loading: statsLoading } = useFetchUserStatsByDate();

  const [user, setUser] = useState<UserProfileData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<UserStatsDateProjectBreakdown[]>([]);
  const [filteredTotalHours, setFilteredTotalHours] = useState(0);
  const [filteredEntriesCount, setFilteredEntriesCount] = useState(0);
  const [dateLabel, setDateLabel] = useState("");

  // Load profile on mount
  useEffect(() => {
    if (userId) {
      fetchProfile({ userId }).then((res) => {
        if (res?.user) setUser(res.user);
      }).catch(() => {}).finally(() => setPageLoading(false));
    }
  }, [userId, fetchProfile]);

  const loadDateStats = useCallback(async (startDate: string, endDate: string) => {
    try {
      const res = await fetchStats({ userId, startDate, endDate });
      if (res?.stats) {
        setFilteredEntries(res.stats.time_entries || []);
        setFilteredProjects(res.stats.projects || []);
        setFilteredTotalHours(res.stats.total_hours || 0);
        setFilteredEntriesCount(res.stats.entries_count || 0);
        setDateLabel(`${formatDate(res.stats.startDate)} - ${formatDate(res.stats.endDate)}`);
      }
    } catch {
      // Error handled by hook
    }
  }, [userId, fetchStats]);

  // Load date-filtered stats when preset changes
  useEffect(() => {
    if (!userId || datePreset === "custom") return;
    const { start, end } = getDateRange(datePreset);
    loadDateStats(start, end);
  }, [userId, datePreset, loadDateStats]);

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      loadDateStats(customStart, customEnd);
    }
  };

  const initials = useMemo(() => {
    if (!user) return "?";
    const first = user.first_name?.[0] || "";
    const last = user.last_name?.[0] || "";
    return (first + last).toUpperCase() || user.full_name?.[0]?.toUpperCase() || "?";
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
        <Link href="/admin/users" className="text-kaart-orange hover:underline text-sm">
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

  return (
    <div className="space-y-6">
      {/* Section 1: Header */}
      <Card>
        <CardContent className="p-6">
          <Link href="/admin/users" className="text-kaart-orange hover:underline text-sm mb-4 inline-block">
            &larr; Back to Users
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-kaart-orange/20 flex items-center justify-center text-kaart-orange text-xl font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{user.full_name || `${user.first_name} ${user.last_name}`}</h1>
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
              </div>
              <p className="text-muted-foreground mt-1">{user.email}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                {user.osm_username && (
                  <span>OSM: <span className="font-medium text-foreground">{user.osm_username}</span></span>
                )}
                {user.osm_username && locationParts && <span className="text-gray-300">|</span>}
                {locationParts && <span>{locationParts}</span>}
              </div>
              {user.joined && (
                <p className="text-sm text-muted-foreground mt-1">
                  Joined: {formatDate(user.joined)}
                </p>
              )}
              {user.payment_email && (
                <p className="text-sm text-muted-foreground mt-1">
                  Payment email: <span className="font-medium text-foreground">{user.payment_email}</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Task Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tasks Mapped" value={user.total_tasks_mapped ?? 0} />
        <StatCard label="Tasks Validated" value={user.total_tasks_validated ?? 0} />
        <StatCard label="Tasks Invalidated" value={user.total_tasks_invalidated ?? 0} />
        <StatCard label="Total Earnings" value={`$${(user.payable_total ?? 0).toFixed(2)}`} />
      </div>

      {/* Section 3: Validator Stats (conditional) */}
      {isValidator && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Validated by User" value={user.validator_tasks_validated ?? 0} />
          <StatCard label="Invalidated by User" value={user.validator_tasks_invalidated ?? 0} />
          <StatCard label="Checklists Completed" value={user.total_checklists_completed ?? 0} />
          <StatCard label="Checklists Confirmed" value={user.validator_total_checklists_confirmed ?? 0} />
        </div>
      )}

      {/* Section 4: Payment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Mapping</p>
              <p className="text-lg font-semibold">${(user.mapping_payable_total ?? 0).toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Validation</p>
              <p className="text-lg font-semibold">${(user.validation_payable_total ?? 0).toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Checklists</p>
              <p className="text-lg font-semibold">${(user.checklist_payable_total ?? 0).toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Payable</p>
              <p className="text-lg font-semibold text-green-600">${(user.payable_total ?? 0).toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Requested</p>
              <p className="text-lg font-semibold text-yellow-600">${(user.requested_total ?? 0).toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-lg font-semibold text-blue-600">${(user.paid_total ?? 0).toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Project Contributions */}
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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Project</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mapped</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Validated</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Invalidated</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Earnings</th>
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
                          <span className="font-medium text-gray-900">{proj.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{proj.tasks_mapped}</td>
                      <td className="px-6 py-4 text-gray-700">{proj.tasks_validated}</td>
                      <td className="px-6 py-4 text-gray-700">{proj.tasks_invalidated}</td>
                      <td className="px-6 py-4 text-gray-700">
                        ${(proj.mapping_earnings + proj.validation_earnings).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Divider */}
      <hr className="border-gray-200" />

      {/* Section 6: Time Tracking with Date Range */}
      <Card>
        <CardHeader>
          <CardTitle>Time Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date range controls */}
          <div className="flex flex-wrap items-center gap-2">
            {(["daily", "weekly", "monthly", "custom"] as DatePreset[]).map((preset) => (
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
            ))}
          </div>

          {/* Custom date inputs */}
          {datePreset === "custom" && (
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-sm text-muted-foreground">From</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 border border-input rounded-lg text-sm"
              />
              <label className="text-sm text-muted-foreground">To</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 border border-input rounded-lg text-sm"
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

          {/* Summary */}
          {dateLabel && (
            <div className="text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">{filteredTotalHours.toFixed(1)} hours</span> across{" "}
                <span className="font-medium text-foreground">{filteredEntriesCount} sessions</span>
              </p>
              <p>Showing: {dateLabel}</p>
            </div>
          )}

          {statsLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kaart-orange" />
              Loading...
            </div>
          )}

          {/* Time entries table */}
          {filteredEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Project</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Category</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Clock In</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Clock Out</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Duration</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className={entry.status === "voided" ? "opacity-50" : ""}>
                      <td className="px-4 py-2">{formatDate(entry.clockIn)}</td>
                      <td className="px-4 py-2">{entry.projectName || "-"}</td>
                      <td className="px-4 py-2">{entry.category || "-"}</td>
                      <td className="px-4 py-2">{formatDateTime(entry.clockIn)}</td>
                      <td className="px-4 py-2">{formatDateTime(entry.clockOut)}</td>
                      <td className="px-4 py-2 font-mono">{formatDuration(entry.durationSeconds)}</td>
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
            !statsLoading && dateLabel && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No time entries found for this period.
              </p>
            )
          )}

          {/* Per-project hours breakdown */}
          {filteredProjects.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Per-project hours</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Project</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Hours</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Sessions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {filteredProjects.map((proj) => (
                      <tr key={proj.id}>
                        <td className="px-4 py-2 font-medium">{proj.name}</td>
                        <td className="px-4 py-2">{proj.total_hours.toFixed(1)}h</td>
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
    </div>
  );
}
