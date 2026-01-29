"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge, Button } from "@/components/ui";
import { useUserDashboardStats, useUserProjects, useUserPayable, useSubmitPaymentRequest, useSyncUserTasks } from "@/hooks";
import { useToastActions } from "@/components/ui";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function UserDashboard() {
  const { user } = useUser();
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useUserDashboardStats();
  const { data: projects, loading: projectsLoading } = useUserProjects();
  const { data: payable, loading: payableLoading, refetch: refetchPayable } = useUserPayable();
  const { mutate: submitPayment, loading: submittingPayment } = useSubmitPaymentRequest();
  const { mutate: syncTasks, loading: syncing } = useSyncUserTasks();
  const toast = useToastActions();
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);
  const hasSynced = useRef(false);

  // Sync tasks from TM4 on first load
  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;
      syncTasks({}).then(() => {
        // Refresh stats and payable data after sync
        refetchStats();
        refetchPayable();
      }).catch(() => {
        // Silently fail - sync errors shouldn't block the dashboard
        console.log("Task sync skipped or failed");
      });
    }
  }, []);

  // Show error as toast instead of inline
  useEffect(() => {
    if (statsError) {
      toast.error(`Dashboard: ${statsError}`);
    }
  }, [statsError]);

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
      await refetchStats();
    } catch {
      toast.error("Failed to submit payment request");
    } finally {
      setIsRequestingPayment(false);
    }
  };

  const activeProjects = projects?.user_projects?.length ?? 0;

  const handleManualSync = async () => {
    try {
      await syncTasks({});
      await refetchStats();
      await refetchPayable();
      toast.success("Tasks synced from TM4");
    } catch {
      toast.error("Failed to sync tasks");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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


      {/* Main Stats Cards */}
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(4, 1fr)" }} className="grid-stats">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Mapped</CardTitle>
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-kaart-orange">
                  {stats?.mapped_tasks ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.total_contributions_for_month ?? 0} this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Validated</CardTitle>
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {stats?.validated_tasks ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.invalidated_tasks ?? 0} invalidated
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
            <svg
              className={`h-4 w-4 ${(stats?.requests_total ?? 0) > 0 ? "text-yellow-500" : "text-muted-foreground"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            {payableLoading || statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(payable?.payable_total ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats?.requests_total ?? 0) > 0
                    ? "Request pending"
                    : "Available for payout"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
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

      {/* Earnings & Payments - Compact Row */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(5, 1fr)" }} className="grid-earnings">
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Mapping Earnings</p>
            {payableLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div style={{ fontSize: 20, fontWeight: 700, color: "#ff6b35" }}>
                {formatCurrency(payable?.mapping_earnings ?? 0)}
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
                {formatCurrency(payable?.validation_earnings ?? 0)}
              </div>
            )}
          </div>
        </Card>

        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Checklist Earnings</p>
            {payableLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div style={{ fontSize: 20, fontWeight: 700, color: "#9333ea" }}>
                {formatCurrency(payable?.checklist_earnings ?? 0)}
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
                {formatCurrency(stats?.payouts_total ?? 0)}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Projects */}
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(2, 1fr)" }} className="grid-projects">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Projects</CardTitle>
            <Link
              href="/user/projects"
              className="text-sm text-kaart-orange hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : projects?.org_active_projects && projects.org_active_projects.length > 0 ? (
              <div className="space-y-4">
                {projects.org_active_projects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        #{project.id} • {project.total_tasks} tasks
                      </p>
                    </div>
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
            ) : (payable?.payable_total ?? 0) > 0 ? (
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
                <p className="font-medium text-green-800 dark:text-green-200">
                  You have {formatCurrency(payable?.payable_total ?? 0)} available!
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
                Complete tasks to earn money. Your validated tasks will appear here.
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href="/user/projects"
                className="inline-flex items-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                View Projects
              </Link>
              <Link
                href="/user/payments"
                className="inline-flex items-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Payment History
              </Link>
              <Link
                href="/user/training"
                className="inline-flex items-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Training
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

      {/* Monthly Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  Contributions this month
                </p>
                <div className="text-4xl font-bold">
                  {stats?.total_contributions_for_month ?? 0}
                </div>
                <p className="text-sm mt-1">
                  {stats?.month_contribution_change !== undefined && stats.month_contribution_change >= 0 ? (
                    <span className="text-green-600">
                      +{stats.month_contribution_change} from last month
                    </span>
                  ) : (
                    <span className="text-red-600">
                      {stats?.month_contribution_change ?? 0} from last month
                    </span>
                  )}
                </p>
              </div>
              {stats?.weekly_contributions_array && stats.weekly_contributions_array.length > 0 && (
                <div className="flex items-end gap-1 h-16">
                  {stats.weekly_contributions_array.map((count, i) => (
                    <div
                      key={i}
                      className="w-8 bg-kaart-orange rounded-t"
                      style={{
                        height: `${Math.max(
                          10,
                          (count / Math.max(...stats.weekly_contributions_array)) * 100
                        )}%`,
                      }}
                      title={`Week ${i + 1}: ${count} tasks`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
