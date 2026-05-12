"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { COLORS } from "@/lib/chartColors";
import { ChartExportButton } from "@/components/admin/ChartExportButton";
import { TableExportButton } from "@/components/admin/TableExportButton";
import dynamic from "next/dynamic";
import type { EditingStatsResponse, ElementAnalysisCategory } from "@/types";
import { LoadingSpinner } from "./LoadingSpinner";
import { MiniActivityChart } from "./MiniActivityChart";
import {
  chartNumberFmt,
  chartTooltipFmt,
  formatDateTime,
  getProjectStatus,
  ROWS_PER_PAGE,
} from "./reportUtils";

const MappingHeatmap = dynamic(() => import("@/components/MappingHeatmap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-muted rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </div>
  ),
});

interface EditingTabProps {
  loading: boolean;
  error: string | null;
  data: EditingStatsResponse | null;
  heatmapPoints: [number, number, number][];
  heatmapLoading: boolean;
  heatmapSummary: { totalChangesets: number; totalChanges: number; usersWithData: number } | null;
  elementCategories: ElementAnalysisCategory[];
  elementLastUpdated: string | null;
  elementLoading: boolean;
  elementRefreshing: boolean;
  elementProgress: string | null;
  showRefreshModal: boolean;
  setShowRefreshModal: (v: boolean) => void;
  onStartAnalysis: () => void;
}

export function EditingTab({
  loading,
  error,
  data,
  heatmapPoints,
  heatmapLoading,
  heatmapSummary,
  elementCategories,
  elementLastUpdated,
  elementLoading,
  elementRefreshing,
  elementProgress,
  showRefreshModal,
  setShowRefreshModal,
  onStartAnalysis,
}: EditingTabProps) {
  const router = useRouter();
  const [projectsTablePage, setProjectsTablePage] = useState(1);
  const [contributorsTablePage, setContributorsTablePage] = useState(1);
  const editingTasksOverTimeRef = useRef<HTMLDivElement>(null);

  const overallProgress = data
    ? (() => {
        const totalTasks = data.projects.reduce((s, p) => s + p.total_tasks, 0);
        const totalMapped = data.projects.reduce((s, p) => s + p.tasks_mapped, 0);
        const pct = totalTasks > 0 ? Math.round((totalMapped / totalTasks) * 100) : 0;
        return { totalTasks, totalMapped, pct };
      })()
    : null;

  const donutData = overallProgress
    ? [
        { name: "Completed", value: overallProgress.pct },
        { name: "Remaining", value: 100 - overallProgress.pct },
      ]
    : [];

  if (loading && !data) return <LoadingSpinner />;

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-red-500">
          Failed to load editing stats: {error}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">
            Select a date range and click Refresh to load editing statistics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Hero Row: Donut + Heatmap + Changeset Totals ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Project Progress Donut */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Project Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div style={{ width: 180, height: 180, position: "relative" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell fill={COLORS.mapped} />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">
                  {overallProgress?.pct ?? 0}%
                </span>
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
            </div>
            <div className="text-center mt-2 space-y-1">
              <p className="text-sm text-muted-foreground">
                <Val>{formatNumber(overallProgress?.totalMapped)}</Val> /{" "}
                <Val>{formatNumber(overallProgress?.totalTasks)}</Val> tasks
              </p>
              <p className="text-sm font-medium">
                <Val>{formatNumber(data.summary.active_projects)}</Val> active projects
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Map of changeset centroids</CardTitle>
              {heatmapSummary && !heatmapLoading && (
                <span className="text-xs text-muted-foreground">
                  {heatmapSummary.usersWithData} users &middot;{" "}
                  <Val>{formatNumber(heatmapSummary.totalChangesets)}</Val> changesets
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {heatmapLoading ? (
              <div className="w-full h-48 flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kaart-orange" />
                <span className="text-sm text-muted-foreground">
                  Fetching changesets from OSM...
                </span>
              </div>
            ) : (
              <MappingHeatmap points={heatmapPoints} height="200px" />
            )}
          </CardContent>
        </Card>

        {/* Changeset Totals */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Changeset totals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed mt-2">
              During this time period, a total of{" "}
              <span className="font-bold text-foreground">
                <Val>{formatNumber(data.summary.total_mapped)}</Val>
              </span>{" "}
              tasks were mapped across{" "}
              <span className="font-bold text-foreground">
                <Val>{formatNumber(data.summary.active_projects)}</Val>
              </span>{" "}
              active projects, with{" "}
              <span className="font-bold text-foreground">
                <Val>{formatNumber(data.summary.total_validated)}</Val>
              </span>{" "}
              tasks validated and{" "}
              <span className="font-bold text-foreground">
                <Val>{formatNumber(data.summary.total_invalidated)}</Val>
              </span>{" "}
              invalidated.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-foreground">
                  <Val>{formatNumber(data.summary.total_mapped)}</Val>
                </p>
                <p className="text-xs text-muted-foreground">Tasks Mapped</p>
                {data.comparison?.summary &&
                  (() => {
                    const prev = data.comparison.summary.total_mapped;
                    const curr = data.summary.total_mapped;
                    const delta = prev > 0 ? ((curr - prev) / prev) * 100 : null;
                    return delta != null ? (
                      <p className={`text-xs font-medium mt-1 ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
                      </p>
                    ) : null;
                  })()}
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-foreground">
                  <Val>{formatNumber(data.summary.total_validated)}</Val>
                </p>
                <p className="text-xs text-muted-foreground">Validated</p>
                {data.comparison?.summary &&
                  (() => {
                    const prev = data.comparison.summary.total_validated;
                    const curr = data.summary.total_validated;
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
      </div>

      {/* Tasks Over Time Bar Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tasks Over Time</CardTitle>
          <ChartExportButton
            containerRef={editingTasksOverTimeRef}
            filename="editing-tasks-over-time"
          />
        </CardHeader>
        <CardContent>
          {data.tasks_over_time.length > 0 ? (
            <div ref={editingTasksOverTimeRef} style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={data.tasks_over_time}>
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
                  <Bar dataKey="mapped" name="Mapped" fill={COLORS.mapped} />
                  <Bar dataKey="validated" name="Validated" fill={COLORS.validated} />
                  <Bar dataKey="invalidated" name="Invalidated" fill={COLORS.invalidated} />
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

      {/* Detailed Project Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detailed Project Table ({data.projects.length})</CardTitle>
          <TableExportButton
            rows={data.projects as unknown as Array<Record<string, unknown>>}
            columns={[
              { key: "name", label: "Project" },
              { key: "total_tasks", label: "Total Tasks" },
              { key: "mapped_tasks", label: "Mapped" },
              { key: "validated_tasks", label: "Validated" },
              { key: "invalidated_tasks", label: "Invalidated" },
              { key: "mapping_rate_per_task", label: "Mapping Rate" },
              { key: "validation_rate_per_task", label: "Validation Rate" },
            ]}
            filename="editing-projects"
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 500 }}>
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Project Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Progress</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">% Validated</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Time per Task</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Map Rate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Val Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {data.projects
                  .slice((projectsTablePage - 1) * ROWS_PER_PAGE, projectsTablePage * ROWS_PER_PAGE)
                  .map((proj) => {
                    const status = getProjectStatus(proj);
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
                                title={proj.url?.includes("maproulette") ? "Open in MapRoulette" : "Open in Tasking Manager"}
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden" style={{ minWidth: 80 }}>
                              <div
                                className="h-full bg-kaart-orange rounded-full transition-all"
                                style={{ width: `${Math.min(proj.percent_mapped, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {Math.min(proj.percent_mapped, 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden" style={{ minWidth: 60 }}>
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${Math.min(proj.percent_validated, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {Math.min(proj.percent_validated, 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {proj.avg_time_per_task
                            ? proj.avg_time_per_task >= 3600
                              ? `${Math.floor(proj.avg_time_per_task / 3600)}h ${Math.floor((proj.avg_time_per_task % 3600) / 60)}m`
                              : proj.avg_time_per_task >= 60
                                ? `${Math.floor(proj.avg_time_per_task / 60)}m`
                                : `${proj.avg_time_per_task}s`
                            : "—"}
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
                Showing {(projectsTablePage - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(projectsTablePage * ROWS_PER_PAGE, data.projects.length)} of{" "}
                {data.projects.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={projectsTablePage === 1}
                  onClick={() => setProjectsTablePage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-2">
                  Page {projectsTablePage} of {Math.ceil(data.projects.length / ROWS_PER_PAGE)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={projectsTablePage === Math.ceil(data.projects.length / ROWS_PER_PAGE)}
                  onClick={() => setProjectsTablePage((p) => p + 1)}
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
              { key: "mapped", label: "Mapped" },
              { key: "validated", label: "Validated" },
              { key: "invalidated", label: "Invalidated" },
              { key: "hours", label: "Hours" },
            ]}
            filename="editing-top-contributors"
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 500 }}>
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">OSM Username</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Mapped</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Validated</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Invalidated</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {data.top_contributors
                  .slice(
                    (contributorsTablePage - 1) * ROWS_PER_PAGE,
                    contributorsTablePage * ROWS_PER_PAGE
                  )
                  .map((c) => (
                    <tr
                      key={c.osm_username}
                      className={c.user_id ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                      onClick={() =>
                        c.user_id && router.push(`/admin/users/${encodeURIComponent(c.user_id)}`)
                      }
                    >
                      <td className="px-6 py-4">
                        <span className={c.user_id ? "font-medium text-kaart-orange" : "font-medium text-foreground"}>
                          {c.user_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground">{c.osm_username}</td>
                      <td className="px-6 py-4 text-foreground">
                        <Val>{formatNumber(c.tasks_mapped)}</Val>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        <Val>{formatNumber(c.tasks_validated)}</Val>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        <Val>{formatNumber(c.tasks_invalidated)}</Val>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        <Val>{formatNumber(c.total_hours)}</Val>h
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {data.top_contributors.length > ROWS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-3 text-sm text-muted-foreground">
              <span>
                Showing {(contributorsTablePage - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(contributorsTablePage * ROWS_PER_PAGE, data.top_contributors.length)} of{" "}
                {data.top_contributors.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={contributorsTablePage === 1}
                  onClick={() => setContributorsTablePage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-2">
                  Page {contributorsTablePage} of{" "}
                  {Math.ceil(data.top_contributors.length / ROWS_PER_PAGE)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    contributorsTablePage ===
                    Math.ceil(data.top_contributors.length / ROWS_PER_PAGE)
                  }
                  onClick={() => setContributorsTablePage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editing Activity by Element Type */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Editing Activity by Element Type</h3>
            {elementLastUpdated && (
              <p className="text-xs text-muted-foreground">
                Last updated: {formatDateTime(elementLastUpdated)}
              </p>
            )}
            {!elementLastUpdated && !elementLoading && (
              <p className="text-xs text-muted-foreground">
                No cached data yet — click Refresh to run analysis
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {elementRefreshing && elementProgress && (
              <span className="text-xs text-muted-foreground">{elementProgress}</span>
            )}
            <button
              onClick={() => setShowRefreshModal(true)}
              disabled={elementRefreshing}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              {elementRefreshing ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-kaart-orange mr-2" />
                  Analyzing...
                </>
              ) : (
                "Refresh Analysis"
              )}
            </button>
          </div>
        </div>
        {elementLoading ? (
          <div className="flex items-center justify-center h-32 gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kaart-orange" />
            <span className="text-sm text-muted-foreground">Loading cached data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {elementCategories.map((chart) => (
              <MiniActivityChart key={chart.title} title={chart.title} data={chart.data} />
            ))}
          </div>
        )}
      </div>

      {/* Refresh Analysis Warning Modal */}
      {showRefreshModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Refresh Element Analysis
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will re-analyze all changesets from the OSM API for the last 4 weeks. The
              process runs in the background and typically takes 2-5 minutes depending on the
              number of active mappers and their changeset volume.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              This analysis also runs automatically every night at midnight MST.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRefreshModal(false)}
                className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onStartAnalysis}
                className="px-4 py-2 rounded-lg bg-kaart-orange text-white text-sm font-medium hover:bg-kaart-orange-dark transition-colors"
              >
                Start Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
