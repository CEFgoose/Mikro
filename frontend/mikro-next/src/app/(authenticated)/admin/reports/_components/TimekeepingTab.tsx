"use client";

import { useState, useRef, Fragment } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Val,
} from "@/components/ui";
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
import { formatNumber } from "@/lib/utils";
import {
  COLORS,
  CATEGORY_COLORS,
  WEEKLY_TASK_COLORS,
  COMMUNITY_OUTREACH_COLORS,
} from "@/lib/chartColors";
import { ChartExportButton } from "@/components/admin/ChartExportButton";
import { TableExportButton } from "@/components/admin/TableExportButton";
import type { TimekeepingStatsResponse } from "@/types";
import { LoadingSpinner } from "./LoadingSpinner";
import { chartNumberFmt, chartTooltipFmt, ROWS_PER_PAGE, MOCK_COMMUNITY_OUTREACH } from "./reportUtils";

interface TimekeepingTabProps {
  loading: boolean;
  error: string | null;
  data: TimekeepingStatsResponse | null;
}

export function TimekeepingTab({ loading, error, data }: TimekeepingTabProps) {
  const [timeTrackingPage, setTimeTrackingPage] = useState(1);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const timekeepingHoursByCategoryRef = useRef<HTMLDivElement>(null);
  const timekeepingWeeklyActivityRef = useRef<HTMLDivElement>(null);
  const timekeepingWeeklyHoursRef = useRef<HTMLDivElement>(null);
  const timekeepingCommunityOutreachRef = useRef<HTMLDivElement>(null);

  if (loading && !data) return <LoadingSpinner />;

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-red-500">
          Failed to load timekeeping stats: {error}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">
            Select a date range and click Refresh to load timekeeping statistics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Row: Totals + Task Breakdown ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Team Hours + Summary Text */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Totals</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-1">Total Team Hours</p>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold">
                <Val>{formatNumber(data.summary.total_hours)}</Val>h
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  data.summary.weekly_rate_change_percent >= 0
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {data.summary.weekly_rate_change_percent >= 0 ? "+" : ""}
                {data.summary.weekly_rate_change_percent}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <Val>{formatNumber(data.summary.total_entries)}</Val> entries
            </p>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-foreground leading-relaxed">
                During this time period, a total of{" "}
                <span className="font-bold">
                  {formatNumber(data.summary.total_hours).text}{" "}
                </span>
                hours were logged. This is{" "}
                <span className="font-bold">100.0%</span> of the total hours logged.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">
                  <Val>{formatNumber(data.summary.total_changesets)}</Val>
                </p>
                <p className="text-xs text-muted-foreground">Changesets</p>
                {data.comparison?.summary &&
                  (() => {
                    const prev = data.comparison.summary.total_changesets;
                    const curr = data.summary.total_changesets;
                    const delta = prev > 0 ? ((curr - prev) / prev) * 100 : null;
                    return delta != null ? (
                      <p className={`text-xs font-medium mt-1 ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
                      </p>
                    ) : null;
                  })()}
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">
                  <Val>{formatNumber(data.summary.total_changes)}</Val>
                </p>
                <p className="text-xs text-muted-foreground">Changes</p>
                {data.comparison?.summary &&
                  (() => {
                    const prev = data.comparison.summary.total_changes;
                    const curr = data.summary.total_changes;
                    const delta = prev > 0 ? ((curr - prev) / prev) * 100 : null;
                    return delta != null ? (
                      <p className={`text-xs font-medium mt-1 ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
                      </p>
                    ) : null;
                  })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hours by Category — Horizontal BarChart */}
        <Card>
          <CardHeader className="pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Task</CardTitle>
            <ChartExportButton
              containerRef={timekeepingHoursByCategoryRef}
              filename="timekeeping-hours-by-category"
            />
          </CardHeader>
          <CardContent>
            {data.hours_by_category.length > 0 ? (
              <div
                ref={timekeepingHoursByCategoryRef}
                style={{
                  width: "100%",
                  height: Math.max(200, data.hours_by_category.length * 40),
                }}
              >
                <ResponsiveContainer>
                  <BarChart data={data.hours_by_category} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={chartNumberFmt} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      tick={{ fontSize: 10 }}
                      width={160}
                      tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
                    />
                    <Tooltip
                      formatter={(value) => [`${chartTooltipFmt(value as number)}h`, "Hours"]}
                    />
                    <Bar dataKey="hours" name="Hours">
                      {data.hours_by_category.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other}
                        />
                      ))}
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
      </div>

      {/* ── Middle Row: 3 Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Team Activity — ComposedChart */}
        <Card>
          <CardHeader className="pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Weekly Team Activity</CardTitle>
            <ChartExportButton
              containerRef={timekeepingWeeklyActivityRef}
              filename="timekeeping-weekly-activity"
            />
          </CardHeader>
          <CardContent>
            {data.weekly_activity.length > 0 ? (
              <div ref={timekeepingWeeklyActivityRef} style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <ComposedChart data={data.weekly_activity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: string) =>
                        new Date(v + "T00:00:00").toLocaleDateString("en-US", {
                          month: "numeric",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10 }}
                      tickFormatter={chartNumberFmt}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10 }}
                      tickFormatter={chartNumberFmt}
                    />
                    <Tooltip
                      labelFormatter={(v) =>
                        new Date(String(v) + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      }
                      formatter={chartTooltipFmt}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar yAxisId="left" dataKey="hours" name="Hours" fill={COLORS.hours} />
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
                No weekly activity data.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Task Hours — Stacked BarChart */}
        <Card>
          <CardHeader className="pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Weekly Task Hours by Category</CardTitle>
            <ChartExportButton
              containerRef={timekeepingWeeklyHoursRef}
              filename="timekeeping-weekly-hours"
            />
          </CardHeader>
          <CardContent>
            {data.weekly_category_hours?.length > 0 ? (
              <div ref={timekeepingWeeklyHoursRef} style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={data.weekly_category_hours.map((row) => ({
                      ...row,
                      week: new Date(row.week + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      }),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={chartNumberFmt}
                      label={{ value: "Hours", angle: -90, position: "insideLeft", style: { fontSize: 10 } }}
                    />
                    <Tooltip contentStyle={{ fontSize: 11 }} formatter={chartTooltipFmt} />
                    <Legend wrapperStyle={{ fontSize: 9 }} iconSize={8} />
                    {(data.weekly_category_names || []).map((cat, i) => (
                      <Bar
                        key={cat}
                        dataKey={cat}
                        stackId="a"
                        fill={WEEKLY_TASK_COLORS[i % WEEKLY_TASK_COLORS.length]}
                        stroke="#ffffff"
                        strokeWidth={0.5}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No category data for this period.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Community Outreach Trends — Stacked Bar + Lines (mock) */}
        <Card className="border-2 border-dashed border-yellow-400 relative">
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
              Sample Data
            </span>
          </div>
          <CardHeader className="pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Community Outreach Trends</CardTitle>
            <ChartExportButton
              containerRef={timekeepingCommunityOutreachRef}
              filename="timekeeping-community-outreach"
            />
          </CardHeader>
          <CardContent>
            <div ref={timekeepingCommunityOutreachRef} style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <ComposedChart data={MOCK_COMMUNITY_OUTREACH}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={chartNumberFmt} />
                  <Tooltip contentStyle={{ fontSize: 11 }} formatter={chartTooltipFmt} />
                  <Legend wrapperStyle={{ fontSize: 9 }} iconSize={8} />
                  {Object.entries(COMMUNITY_OUTREACH_COLORS).map(([cat, color]) => (
                    <Bar key={cat} dataKey={cat} stackId="a" fill={color} />
                  ))}
                  <Line
                    dataKey="newParticipants"
                    name="# of New Participants"
                    stroke="#1f2937"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    dataKey="returnParticipants"
                    name="# of Retained Participants"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    strokeDasharray="5 5"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-yellow-700 font-medium text-center mt-2 bg-yellow-50 rounded py-1">
              This chart uses sample data — not connected to a real data source yet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-User Time Tracking Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Time Tracking ({data.user_breakdown.length})</CardTitle>
          <TableExportButton
            rows={data.user_breakdown as unknown as Array<Record<string, unknown>>}
            columns={[
              { key: "name", label: "Name" },
              { key: "hours", label: "Hours" },
              { key: "entries", label: "Entries" },
              { key: "avg_session_minutes", label: "Avg Session (min)" },
            ]}
            filename="timekeeping-user-breakdown"
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 500 }}>
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground w-8"></th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Hours</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Records</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Changesets</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Changes</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">OSM usernames</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {data.user_breakdown
                  .slice((timeTrackingPage - 1) * ROWS_PER_PAGE, timeTrackingPage * ROWS_PER_PAGE)
                  .map((u) => {
                    const isExpanded = expandedUsers.has(u.user_id);
                    return (
                      <Fragment key={u.user_id}>
                        <tr
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            const next = new Set(expandedUsers);
                            if (isExpanded) next.delete(u.user_id);
                            else next.add(u.user_id);
                            setExpandedUsers(next);
                          }}
                        >
                          <td className="px-6 py-4 text-muted-foreground">
                            {isExpanded ? "▼" : "▶"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-kaart-orange/20 flex items-center justify-center text-kaart-orange text-xs font-bold">
                                {(u.user_name || "?")
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <span className="font-medium text-foreground">{u.user_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-foreground">
                            <Val>{formatNumber(u.total_hours)}</Val>h
                          </td>
                          <td className="px-6 py-4 text-foreground">
                            <Val>{formatNumber(u.entries_count)}</Val>
                          </td>
                          <td className="px-6 py-4 text-foreground">
                            <Val>{formatNumber(u.changeset_count)}</Val>
                          </td>
                          <td className="px-6 py-4 text-foreground">
                            <Val>{formatNumber(u.changes_count)}</Val>
                          </td>
                          <td className="px-6 py-4 text-foreground">
                            <Val>{u.osm_username}</Val>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="px-12 py-3 bg-muted/30">
                              <div className="flex flex-wrap gap-4">
                                {Object.entries(u.category_hours).map(([cat, hrs]) => (
                                  <div key={cat} className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor:
                                          CATEGORY_COLORS[cat] || CATEGORY_COLORS.other,
                                      }}
                                    />
                                    <span className="text-sm text-muted-foreground capitalize">
                                      {cat}:{" "}
                                      <span className="font-medium">{hrs}h</span>
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
          {data.user_breakdown.length > ROWS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-3 text-sm text-muted-foreground">
              <span>
                Showing {(timeTrackingPage - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(timeTrackingPage * ROWS_PER_PAGE, data.user_breakdown.length)} of{" "}
                {data.user_breakdown.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={timeTrackingPage === 1}
                  onClick={() => setTimeTrackingPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-2">
                  Page {timeTrackingPage} of{" "}
                  {Math.ceil(data.user_breakdown.length / ROWS_PER_PAGE)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    timeTrackingPage === Math.ceil(data.user_breakdown.length / ROWS_PER_PAGE)
                  }
                  onClick={() => setTimeTrackingPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
