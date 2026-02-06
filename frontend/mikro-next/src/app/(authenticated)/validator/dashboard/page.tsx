"use client";

import { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge, Button } from "@/components/ui";
import { useToastActions } from "@/components/ui";
import { TimeTrackingWidget } from "@/components/widgets/TimeTrackingWidget";
import { useSyncUserTasks, useValidatorProjects, useUserPayable, useSubmitPaymentRequest } from "@/hooks";
import { ValidatorDashboardStats, Project } from "@/types";
import Link from "next/link";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function ValidatorDashboard() {
  const { user, isLoading: userLoading } = useUser();
  const { data: projectsData, loading: projectsLoading, refetch: refetchProjects } = useValidatorProjects();
  const { data: payable, loading: payableLoading, refetch: refetchPayable } = useUserPayable();
  const { mutate: submitPayment, loading: submittingPayment } = useSubmitPaymentRequest();
  const [stats, setStats] = useState<ValidatorDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const { mutate: syncTasks, loading: syncing } = useSyncUserTasks();
  const toast = useToastActions();
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);

  // Combine assigned projects with unassigned projects where user has validations
  const projects: Project[] = [
    ...(projectsData?.org_active_projects || []),
    ...(projectsData?.unassigned_validation_projects || []),
  ];

  const activeProjects = projects.length;

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (statsError) {
      toast.error(`Dashboard: ${statsError}`);
    }
  }, [statsError]);

  const fetchStats = async () => {
    try {
      setStatsError(null);
      const statsRes = await fetch("/backend/project/fetch_validator_dash_stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        setStatsError("Failed to load stats");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      setStatsError("Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleManualSync = async () => {
    try {
      await syncTasks({});
      await Promise.all([fetchStats(), refetchProjects(), refetchPayable()]);
      toast.success("Tasks synced from TM4");
    } catch {
      toast.error("Failed to sync tasks");
    }
  };

  const handleRequestPayment = async () => {
    if (!payable || payable.payable_total <= 0) {
      toast.error("No payable amount available");
      return;
    }

    setIsRequestingPayment(true);
    try {
      await submitPayment({ notes: "" });
      toast.success("Payment request submitted successfully");
      await refetchPayable();
      await fetchStats();
    } catch {
      toast.error("Failed to submit payment request");
    } finally {
      setIsRequestingPayment(false);
    }
  };

  const goToSource = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validator Dashboard</h1>
          <p className="text-muted-foreground" style={{ marginTop: 8 }}>
            Welcome back, {user?.name || user?.email}!
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualSync}
          disabled={syncing}
        >
          {syncing ? "Syncing..." : "Sync Tasks"}
        </Button>
      </div>

      {/* Time Tracking Widget */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 3fr" }} className="grid-time-tracking">
        <TimeTrackingWidget
          projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          onClockIn={(projectId, category) => {
            console.log("Clocked in:", projectId, category);
            // TODO: API integration
          }}
          onClockOut={() => {
            console.log("Clocked out");
            // TODO: API integration
          }}
        />
        <Card>
          <CardContent style={{ padding: "16px 24px" }}>
            <p className="text-sm text-muted-foreground">
              Track your work time by clocking in when you start a task and clocking out when you finish.
              Your time will be correlated with your OSM changesets for accurate reporting.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Self-Validation Warning */}
      {stats?.self_validated_count != null && stats.self_validated_count > 0 && (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Self-Validation Warning
            </p>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {stats.self_validated_count} task(s) you validated were mapped by you and are not eligible for payment.
          </p>
        </div>
      )}

      {/* Main Stats Cards - Mapping Work */}
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(4, 1fr)" }} className="grid-stats">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Mapped</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-kaart-orange">
                  {stats?.tasks_mapped ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your mapping contributions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Approved</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {stats?.tasks_validated ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.tasks_invalidated ?? 0} invalidated
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {(stats?.requests_total ?? 0) > 0 ? "Available Balance" : "Payable Total"}
            </CardTitle>
            <svg className={`h-4 w-4 ${(stats?.requests_total ?? 0) > 0 ? "text-yellow-500" : "text-muted-foreground"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            {payableLoading || statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(payable?.payable_total ?? stats?.payable_total ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats?.requests_total ?? 0) > 0 ? "Request pending" : "Available for payout"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeProjects}</div>
                <p className="text-xs text-muted-foreground">
                  Assigned to you
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Validation Work Stats - Unique to Validator Dashboard */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Validation Work</h2>
        <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(3, 1fr)" }} className="grid-stats">
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks You Validated</CardTitle>
              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.validator_validated ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tasks approved by you
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks You Invalidated</CardTitle>
              <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats?.validator_invalidated ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sent back for fixes
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Validation Earnings</CardTitle>
              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats?.calculated_validation_earnings ?? stats?.validation_payable_total ?? 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From validation work
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Earnings & Payments Row */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(4, 1fr)" }} className="grid-earnings">
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Mapping Earnings</p>
            {payableLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div style={{ fontSize: 20, fontWeight: 700, color: "#ff6b35" }}>
                {formatCurrency(payable?.mapping_earnings ?? stats?.mapping_payable_total ?? 0)}
              </div>
            )}
          </div>
        </Card>

        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Validation Earnings</p>
            {payableLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div style={{ fontSize: 20, fontWeight: 700, color: "#2563eb" }}>
                {formatCurrency(payable?.validation_earnings ?? stats?.validation_payable_total ?? 0)}
              </div>
            )}
          </div>
        </Card>

        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Pending Requests</p>
            {statsLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div style={{ fontSize: 20, fontWeight: 700, color: "#ca8a04" }}>
                {formatCurrency(stats?.requests_total ?? 0)}
              </div>
            )}
          </div>
        </Card>

        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Received</p>
            {statsLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>
                {formatCurrency(stats?.paid_total ?? stats?.payouts_total ?? 0)}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Projects and Quick Actions */}
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(2, 1fr)" }} className="grid-projects">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Projects</CardTitle>
            <Link href="/validator/projects" className="text-sm text-kaart-orange hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : projects.length > 0 ? (
              <div className="space-y-4">
                {projects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded"
                    onClick={() => goToSource(project.url)}
                  >
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        #{project.id} • {project.total_tasks} tasks
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(project as Project & { unassigned?: boolean }).unassigned && (
                        <Badge variant="outline" className="text-xs">Unassigned</Badge>
                      )}
                      <Badge
                        variant={
                          project.difficulty === "Easy"
                            ? "success"
                            : project.difficulty === "Medium"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {project.difficulty || "Unknown"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No projects assigned yet. Contact your admin to get started.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(stats?.requests_total ?? 0) > 0 ? (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Payment Request Pending
                  </p>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You have a pending request for {formatCurrency(stats?.requests_total ?? 0)}.
                  You can submit a new request after this one is processed.
                </p>
                {(payable?.payable_total ?? 0) > 0 && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                    Additional earnings: {formatCurrency(payable?.payable_total ?? 0)}
                  </p>
                )}
              </div>
            ) : (payable?.payable_total ?? stats?.payable_total ?? 0) > 0 ? (
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
                <p className="font-medium text-green-800 dark:text-green-200">
                  You have {formatCurrency(payable?.payable_total ?? stats?.payable_total ?? 0)} available!
                </p>
                <Button
                  variant="primary"
                  className="mt-3"
                  onClick={handleRequestPayment}
                  isLoading={isRequestingPayment || submittingPayment}
                  disabled={(payable?.payable_total ?? 0) <= 0}
                >
                  Request Payment
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete mapping and validation tasks to earn money. Your validated work will appear here.
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href="/validator/projects"
                className="inline-flex items-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                View Projects
              </Link>
              <Link
                href="/validator/payments"
                className="inline-flex items-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Payment History
              </Link>
              <Link
                href="/validator/checklists"
                className="inline-flex items-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Checklists
              </Link>
              <Link
                href="/account"
                className="inline-flex items-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Account Settings
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Assigned Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Project</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Map Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Val Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Total Tasks</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Your Mapped</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Your Validated</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Your Earnings</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onDoubleClick={() => goToSource(project.url)}
                  >
                    <td className="px-4 py-3 font-medium">{project.name}</td>
                    <td className="px-4 py-3">{formatCurrency(project.mapping_rate_per_task)}</td>
                    <td className="px-4 py-3">{formatCurrency(project.validation_rate_per_task)}</td>
                    <td className="px-4 py-3">{project.total_tasks}</td>
                    <td className="px-4 py-3">{project.tasks_mapped ?? 0}</td>
                    <td className="px-4 py-3">{project.tasks_validated ?? 0}</td>
                    <td className="px-4 py-3 text-kaart-orange font-medium">
                      {formatCurrency(project.user_earnings ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      {(project as Project & { unassigned?: boolean }).unassigned ? (
                        <Badge variant="outline">Unassigned</Badge>
                      ) : (
                        <Badge variant="success">Assigned</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No projects assigned. Contact an admin to be assigned to projects.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Double-click a project row to open it in the Tasking Manager.
      </p>
    </div>
  );
}
