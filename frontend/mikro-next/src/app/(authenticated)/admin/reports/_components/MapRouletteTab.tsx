"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button, Val } from "@/components/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { MR_COLORS } from "@/lib/chartColors";
import { ChartExportButton } from "@/components/admin/ChartExportButton";
import { TableExportButton } from "@/components/admin/TableExportButton";
import type { EditingStatsResponse } from "@/types";
import { LoadingSpinner } from "./LoadingSpinner";
import { StatCard } from "./StatCard";
import { chartNumberFmt, chartTooltipFmt, getProjectStatus, ROWS_PER_PAGE } from "./reportUtils";

interface MapRouletteTabProps {
  loading: boolean;
  error: string | null;
  data: EditingStatsResponse | null;
}

export function MapRouletteTab({ loading, error, data }: MapRouletteTabProps) {
  const router = useRouter();
  const [mrProjectsPage, setMrProjectsPage] = useState(1);
  const [mrContributorsPage, setMrContributorsPage] = useState(1);
  const mrTasksOverTimeRef = useRef<HTMLDivElement>(null);

  if (loading && !data) return <LoadingSpinner />;

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-red-500">
          Failed to load MapRoulette stats: {error}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">
            No MapRoulette data available for this period. Select a date range and click Refresh
            to load MapRoulette statistics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Fixed"
          value={formatNumber(data.summary.mr_status_summary?.["1"] ?? 0).text}
        />
        <StatCard
          label="Already Fixed"
          value={formatNumber(data.summary.mr_status_summary?.["5"] ?? 0).text}
        />
        <StatCard
          label="Not an Issue"
          value={formatNumber(data.summary.mr_status_summary?.["2"] ?? 0).text}
        />
        <StatCard
          label="Can't Complete"
          value={formatNumber(data.summary.mr_status_summary?.["6"] ?? 0).text}
        />
        <StatCard
          label="Skipped"
          value={formatNumber(data.summary.mr_status_summary?.["3"] ?? 0).text}
        />
        <StatCard
          label="Reviewed"
          value={formatNumber(data.summary.total_validated).text}
        />
      </div>

      {/* Tasks Over Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tasks Over Time</CardTitle>
          <ChartExportButton containerRef={mrTasksOverTimeRef} filename="mr-tasks-over-time" />
        </CardHeader>
        <CardContent>
          {data.mr_status_over_time && data.mr_status_over_time.length > 0 ? (
            <div ref={mrTasksOverTimeRef} style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={data.mr_status_over_time}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: string) =>
                      new Date(v + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={chartNumberFmt} />
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
                  <Legend />
                  <Bar dataKey="fixed" name="Fixed" stackId="status" fill={MR_COLORS.fixed} stroke="#ffffff" strokeWidth={0.5} />
                  <Bar dataKey="already_fixed" name="Already Fixed" stackId="status" fill={MR_COLORS.already_fixed} stroke="#ffffff" strokeWidth={0.5} />
                  <Bar dataKey="false_positive" name="Not an Issue" stackId="status" fill={MR_COLORS.false_positive} stroke="#ffffff" strokeWidth={0.5} />
                  <Bar dataKey="cant_complete" name="Can't Complete" stackId="status" fill={MR_COLORS.cant_complete} stroke="#ffffff" strokeWidth={0.5} />
                  <Bar dataKey="skipped" name="Skipped" stackId="status" fill={MR_COLORS.skipped} stroke="#ffffff" strokeWidth={0.5} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No MapRoulette task data for this period.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Challenges Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Challenges ({data.projects.length})</CardTitle>
          <TableExportButton
            rows={data.projects as unknown as Array<Record<string, unknown>>}
            columns={[
              { key: "name", label: "Challenge" },
              { key: "total_tasks", label: "Total Tasks" },
              { key: "mapped_tasks", label: "Mapped" },
              { key: "validated_tasks", label: "Validated" },
              { key: "invalidated_tasks", label: "Invalidated" },
              { key: "mapping_rate_per_task", label: "Mapping Rate" },
              { key: "validation_rate_per_task", label: "Validation Rate" },
            ]}
            filename="mr-challenges"
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 500 }}>
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Challenge Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Fixed</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Already Fixed</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Not an Issue</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Can&#39;t Complete</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Skipped</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Fix Rate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Val Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {data.projects
                  .slice((mrProjectsPage - 1) * ROWS_PER_PAGE, mrProjectsPage * ROWS_PER_PAGE)
                  .map((proj) => {
                    const status = getProjectStatus(proj);
                    const bd = proj.mr_status_breakdown || {};
                    return (
                      <tr key={proj.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/projects/${proj.id}`}
                              className="font-medium text-kaart-orange hover:underline"
                              title="View project details"
                            >
                              {proj.name}
                            </Link>
                            {proj.url && (
                              <a
                                href={proj.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground"
                                title="Open in MapRoulette"
                              >
                                ↗
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-foreground">
                          <Val>{formatNumber(bd["1"] || 0)}</Val>
                        </td>
                        <td className="px-6 py-4 text-right text-foreground">
                          <Val>{formatNumber(bd["5"] || 0)}</Val>
                        </td>
                        <td className="px-6 py-4 text-right text-foreground">
                          <Val>{formatNumber(bd["2"] || 0)}</Val>
                        </td>
                        <td className="px-6 py-4 text-right text-foreground">
                          <Val>{formatNumber(bd["6"] || 0)}</Val>
                        </td>
                        <td className="px-6 py-4 text-right text-foreground">
                          <Val>{formatNumber(bd["3"] || 0)}</Val>
                        </td>
                        <td className="px-6 py-4 text-foreground">
                          <Val>{formatCurrency(proj.mapping_rate)}</Val>
                        </td>
                        <td className="px-6 py-4 text-foreground">
                          <Val>{formatCurrency(proj.validation_rate)}</Val>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {data.projects.length > ROWS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-3 text-sm text-muted-foreground">
              <span>
                Showing {(mrProjectsPage - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(mrProjectsPage * ROWS_PER_PAGE, data.projects.length)} of{" "}
                {data.projects.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={mrProjectsPage === 1}
                  onClick={() => setMrProjectsPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-2">
                  Page {mrProjectsPage} of {Math.ceil(data.projects.length / ROWS_PER_PAGE)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={mrProjectsPage === Math.ceil(data.projects.length / ROWS_PER_PAGE)}
                  onClick={() => setMrProjectsPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Contributors Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Contributors</CardTitle>
          <TableExportButton
            rows={data.top_contributors as unknown as Array<Record<string, unknown>>}
            columns={[
              { key: "name", label: "Name" },
              { key: "osm_username", label: "OSM Username" },
              { key: "fixed", label: "Fixed" },
              { key: "already_fixed", label: "Already Fixed" },
              { key: "false_positive", label: "Not an Issue" },
              { key: "cant_complete", label: "Can't Complete" },
              { key: "skipped", label: "Skipped" },
              { key: "total_contributions", label: "Total" },
            ]}
            filename="mr-top-contributors"
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 500 }}>
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">OSM Username</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Fixed</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Already Fixed</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Not an Issue</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Can&#39;t Complete</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Skipped</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {data.top_contributors
                  .slice(
                    (mrContributorsPage - 1) * ROWS_PER_PAGE,
                    mrContributorsPage * ROWS_PER_PAGE
                  )
                  .map((c) => {
                    const bd = c.mr_status_breakdown || {};
                    return (
                      <tr
                        key={c.osm_username}
                        className={c.user_id ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                        onClick={() =>
                          c.user_id &&
                          router.push(`/admin/users/${encodeURIComponent(c.user_id)}`)
                        }
                      >
                        <td className="px-6 py-4">
                          <span className={c.user_id ? "font-medium text-kaart-orange" : "font-medium text-foreground"}>
                            {c.user_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-foreground">{c.osm_username}</td>
                        <td className="px-6 py-4 text-right text-foreground">
                          <Val>{formatNumber(bd["1"] || 0)}</Val>
                        </td>
                        <td className="px-6 py-4 text-right text-foreground">
                          <Val>{formatNumber(bd["5"] || 0)}</Val>
                        </td>
                        <td className="px-6 py-4 text-right text-foreground">
                          <Val>{formatNumber(bd["2"] || 0)}</Val>
                        </td>
                        <td className="px-6 py-4 text-right text-foreground">
                          <Val>{formatNumber(bd["6"] || 0)}</Val>
                        </td>
                        <td className="px-6 py-4 text-right text-foreground">
                          <Val>{formatNumber(bd["3"] || 0)}</Val>
                        </td>
                        <td className="px-6 py-4 text-foreground">
                          <Val>{formatNumber(c.total_hours)}</Val>h
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {data.top_contributors.length > ROWS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-3 text-sm text-muted-foreground">
              <span>
                Showing {(mrContributorsPage - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(mrContributorsPage * ROWS_PER_PAGE, data.top_contributors.length)} of{" "}
                {data.top_contributors.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={mrContributorsPage === 1}
                  onClick={() => setMrContributorsPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-2">
                  Page {mrContributorsPage} of{" "}
                  {Math.ceil(data.top_contributors.length / ROWS_PER_PAGE)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    mrContributorsPage ===
                    Math.ceil(data.top_contributors.length / ROWS_PER_PAGE)
                  }
                  onClick={() => setMrContributorsPage((p) => p + 1)}
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
