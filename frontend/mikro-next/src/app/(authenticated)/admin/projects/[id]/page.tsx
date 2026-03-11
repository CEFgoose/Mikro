"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@/components/ui";
import { useFetchProjectProfile } from "@/hooks/useApi";
import { formatNumber, formatCurrency } from "@/lib/utils";
import type { ProjectProfileResponse } from "@/types";

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

function ProgressBar({
  value,
  color = "bg-kaart-orange",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-12 text-right">
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "\u2014";
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m`;
  return `${seconds}s`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const MR_STATUS_LABELS: Record<number, string> = {
  1: "Fixed",
  2: "Not an Issue",
  3: "Skipped",
  5: "Already Fixed",
  6: "Can't Complete",
};

export default function AdminProjectProfilePage() {
  const params = useParams();
  const projectId = Number(params.id);

  const {
    mutate: fetchProfile,
    loading: profileLoading,
    error: profileError,
  } = useFetchProjectProfile();

  const [data, setData] = useState<ProjectProfileResponse | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProfile({ project_id: projectId })
        .then((res) => {
          if (res?.project) setData(res);
        })
        .catch(() => {})
        .finally(() => setPageLoading(false));
    }
  }, [projectId, fetchProfile]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
      </div>
    );
  }

  if (profileError && !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/projects"
          className="text-kaart-orange hover:underline text-sm"
        >
          &larr; Back to Projects
        </Link>
        <Card>
          <CardContent className="p-8 text-center text-red-500">
            Failed to load project profile: {profileError}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { project: proj } = data;
  const totalTasks = proj.total_tasks || 0;
  const pctMapped = totalTasks
    ? (proj.effective_mapped / totalTasks) * 100
    : 0;
  const pctValidated = totalTasks
    ? (proj.effective_validated / totalTasks) * 100
    : 0;
  const remaining = (proj.max_payment || 0) - (proj.total_payout || 0);
  const isMR = proj.source === "mr";

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <Link
          href="/admin/projects"
          className="text-kaart-orange hover:underline text-sm"
        >
          &larr; Back to Projects
        </Link>

        <div className="flex items-start justify-between mt-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{proj.name}</h1>
              <Badge variant={isMR ? "secondary" : "default"}>
                {isMR ? "MapRoulette" : "TM4"}
              </Badge>
              {proj.status ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
              <Badge variant="outline">{proj.difficulty || "Unknown"}</Badge>
            </div>
            {proj.created_by_name && (
              <p className="text-sm text-muted-foreground mt-1">
                Created by {proj.created_by_name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {proj.url && (
              <a
                href={proj.url}
                target="_blank"
                rel="noopener noreferrer"
                title={isMR ? "Open in MapRoulette" : "Open in Tasking Manager"}
              >
                <Button variant="outline" size="sm">
                  Open External &nearr;
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Section 1: Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={formatNumber(totalTasks)} />
        <StatCard
          label="Mapped"
          value={`${pctMapped.toFixed(1)}%`}
          sub={`${formatNumber(proj.effective_mapped)} / ${formatNumber(totalTasks)}`}
        />
        <StatCard
          label="Validated"
          value={`${pctValidated.toFixed(1)}%`}
          sub={`${formatNumber(proj.effective_validated)} / ${formatNumber(totalTasks)}`}
        />
        <StatCard
          label="Avg Time / Task"
          value={formatDuration(data.avg_time_per_task)}
        />
      </div>

      {/* Section 2: Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="text-xl font-semibold">
                {formatCurrency(proj.max_payment || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid Out</p>
              <p className="text-xl font-semibold text-green-600">
                {formatCurrency(proj.total_payout || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-xl font-semibold">
                {formatCurrency(remaining)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rates</p>
              <p className="text-sm">
                Map: <span className="font-medium">{formatCurrency(proj.mapping_rate_per_task || 0)}</span>
                {" / "}
                Val: <span className="font-medium">{formatCurrency(proj.validation_rate_per_task || 0)}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Task Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Task Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Mapped ({formatNumber(proj.effective_mapped)} / {formatNumber(totalTasks)})
              </p>
              <ProgressBar value={pctMapped} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Validated ({formatNumber(proj.effective_validated)} / {formatNumber(totalTasks)})
              </p>
              <ProgressBar value={pctValidated} color="bg-blue-500" />
            </div>
          </div>

          {/* MR Status Breakdown */}
          {isMR &&
            proj.mr_status_breakdown &&
            Object.keys(proj.mr_status_breakdown).length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">
                  MapRoulette Status Breakdown
                </p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(proj.mr_status_breakdown).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-md"
                      >
                        <span className="text-sm font-medium">
                          {MR_STATUS_LABELS[Number(status)] || `Status ${status}`}
                        </span>
                        <Badge variant="secondary">{formatNumber(count as number)}</Badge>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {proj.split_task_groups > 0 && (
            <p className="text-xs text-muted-foreground">
              {proj.split_task_groups} split task group(s) detected — counts
              reflect effective completions
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Assigned Users */}
      {data.assigned_users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Contributors ({data.assigned_users.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Role
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Mapped
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Validated
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Time Logged
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Earnings
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.assigned_users
                    .sort((a, b) => b.tasks_mapped - a.tasks_mapped)
                    .map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-kaart-orange hover:underline font-medium"
                            title="View user profile"
                          >
                            {user.name}
                          </Link>
                          {user.osm_username && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({user.osm_username})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{user.role}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(user.tasks_mapped)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(user.tasks_validated)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {formatDuration(user.time_logged_seconds)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(user.earnings)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 5: Assigned Teams */}
      {data.assigned_teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Teams ({data.assigned_teams.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {data.assigned_teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/admin/teams/${team.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  title="View team details"
                >
                  <span className="font-medium">{team.name}</span>
                  <Badge variant="secondary">
                    {team.member_count} member{team.member_count !== 1 ? "s" : ""}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 6: Time Tracking */}
      {data.time_summary.total_seconds > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Time Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">
                  {formatDuration(data.time_summary.total_seconds)}
                </p>
              </div>
              {Object.entries(data.time_summary.by_category).map(
                ([cat, secs]) => (
                  <div key={cat} className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground capitalize">
                      {cat}
                    </p>
                    <p className="text-lg font-bold">{formatDuration(secs)}</p>
                  </div>
                )
              )}
            </div>

            {/* Recent Time Entries */}
            {data.recent_time_entries.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Recent Entries</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">
                          User
                        </th>
                        <th className="px-4 py-2 text-left font-semibold">
                          Category
                        </th>
                        <th className="px-4 py-2 text-left font-semibold">
                          Clock In
                        </th>
                        <th className="px-4 py-2 text-left font-semibold">
                          Clock Out
                        </th>
                        <th className="px-4 py-2 text-right font-semibold">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.recent_time_entries.map((entry, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2">{entry.user_name}</td>
                          <td className="px-4 py-2 capitalize">
                            {entry.category}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {formatDateTime(entry.clock_in)}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {formatDateTime(entry.clock_out)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {formatDuration(entry.duration_seconds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 7: Trainings & Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trainings */}
        {data.assigned_trainings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Required Trainings ({data.assigned_trainings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {data.assigned_trainings.map((t) => (
                  <div
                    key={t.id}
                    className="px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.training_type} &middot; {t.difficulty}
                      </p>
                    </div>
                    <Badge variant="outline">{t.point_value} pts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Locations */}
        {data.assigned_locations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Locations ({data.assigned_locations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.assigned_locations.map((loc) => (
                  <Badge key={loc.id} variant="outline" className="text-sm py-1">
                    {loc.code} &mdash; {loc.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Section 8: Recent Tasks */}
      {data.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks (last 50)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">
                      Task ID
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Mapped By
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Validated By
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Date Mapped
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Date Validated
                    </th>
                    {isMR && (
                      <th className="px-4 py-2 text-left font-semibold">
                        MR Status
                      </th>
                    )}
                    <th className="px-4 py-2 text-center font-semibold">
                      Paid
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.tasks.map((task, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-mono">{task.task_id}</td>
                      <td className="px-4 py-2">{task.mapped_by || "\u2014"}</td>
                      <td className="px-4 py-2">
                        {task.validated_by || "\u2014"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {formatDate(task.date_mapped)}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {formatDate(task.date_validated)}
                      </td>
                      {isMR && (
                        <td className="px-4 py-2">
                          {task.mr_status
                            ? MR_STATUS_LABELS[task.mr_status] ||
                              `Status ${task.mr_status}`
                            : "\u2014"}
                        </td>
                      )}
                      <td className="px-4 py-2 text-center">
                        {task.paid_out ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
