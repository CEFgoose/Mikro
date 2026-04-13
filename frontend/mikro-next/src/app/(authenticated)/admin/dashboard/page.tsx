"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge, Button, useToastActions, Tooltip, Val } from "@/components/ui";
import { useAdminDashboardStats, useOrgTransactions, useUsersList, useOrgProjects, useAdminSyncAllTasks, useCheckSyncStatus, useAdminTimeHistory, useAdminActiveSessions } from "@/hooks";
import { TimeTrackingWidget } from "@/components/widgets/TimeTrackingWidget";
import { AdminTimeManagement } from "@/components/widgets/AdminTimeManagement";
import { formatNumber, formatCurrency } from "@/lib/utils";
import Link from "next/link";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// --- Lower dashboard section (deferred) ---
// This component manages its own data fetching so it doesn't block the time section above.

function DashboardStats() {
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useAdminDashboardStats();
  const { data: transactions, loading: transactionsLoading } = useOrgTransactions();
  const { data: users, loading: usersLoading } = useUsersList();
  const { data: timeHistory, loading: timeHistoryLoading } = useAdminTimeHistory();
  const { data: activeSessions } = useAdminActiveSessions();
  const { mutate: syncAllTasks } = useAdminSyncAllTasks();
  const { mutate: checkSyncStatus } = useCheckSyncStatus();
  const toast = useToastActions();

  // Snapshot timestamp — records when this data was loaded
  const [snapshotTime] = useState(() => new Date());

  // Time management quick stats
  const timeStats = useMemo(() => {
    const entries = timeHistory?.entries || [];
    const sessions = activeSessions?.sessions || [];
    const now = new Date();

    // This week (Sunday start)
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);

    const thisWeekEntries = entries.filter(
      (e) => e.clockIn && new Date(e.clockIn) >= weekStart && e.status === "completed"
    );
    const weekHours = Math.round(
      thisWeekEntries.reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0) / 3600 * 10
    ) / 10;

    // Pending adjustment requests
    const pendingAdjustments = entries.filter(
      (e) => e.notes?.startsWith("[ADJUSTMENT REQUESTED]") && e.status === "completed"
    ).length;

    // Suspicious long sessions: active sessions running 10+ hours
    const longRunning = sessions.filter((s) => {
      if (!s.clockIn) return false;
      const elapsed = (now.getTime() - new Date(s.clockIn).getTime()) / 1000;
      return elapsed > 10 * 3600; // 10+ hours
    }).length;

    // Active session count
    const activeCount = sessions.length;

    return { weekHours, pendingAdjustments, longRunning, activeCount };
  }, [timeHistory, activeSessions]);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    setSyncing(true);

    pollRef.current = setInterval(async () => {
      try {
        const result = await checkSyncStatus({});
        if (result.sync_status === "running" || result.sync_status === "queued") {
          setSyncProgress(result.progress || "Syncing...");
        } else if (result.sync_status === "completed") {
          stopPolling();
          setSyncing(false);
          setSyncProgress(null);
          toast.success("Task sync complete");
          refetchStats();
        } else if (result.sync_status === "failed") {
          stopPolling();
          setSyncing(false);
          setSyncProgress(null);
          toast.error(result.error || "Sync failed");
        }
      } catch {
        stopPolling();
        setSyncing(false);
        setSyncProgress(null);
      }
    }, 5000);
  }, [checkSyncStatus, stopPolling, toast, refetchStats]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleSyncAllTasks = async () => {
    try {
      const result = await syncAllTasks({});
      setSyncing(true);
      setSyncProgress(result.message || "Queued...");
      startPolling();
    } catch {
      toast.error("Failed to start sync");
    }
  };


  return (
    <>
      {/* Sync button */}
      <div className="flex items-center justify-end gap-3">
        {syncing && syncProgress && (
          <span className="text-sm text-muted-foreground">{syncProgress}</span>
        )}
        <Tooltip content="Pull latest task data from Tasking Manager and MapRoulette" position="bottom">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAllTasks}
            disabled={syncing}
          >
            {syncing ? "Syncing..." : "Sync All Tasks"}
          </Button>
        </Tooltip>
      </div>

      {statsError && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          Error loading dashboard: {statsError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Tooltip content="Projects currently active across Tasking Manager and MapRoulette" position="bottom">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            </Tooltip>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold"><Val>{formatNumber(stats?.active_projects)}</Val></div>
                <p className="text-xs text-muted-foreground">
                  <Val>{formatNumber(stats?.inactive_projects)}</Val> inactive, <Val>{formatNumber(stats?.completed_projects)}</Val> completed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Tooltip content="Total registered users in your organization" position="bottom">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </Tooltip>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold"><Val>{formatNumber(users?.users?.length ?? 0)}</Val></div>
                <p className="text-xs text-muted-foreground">
                  In organization
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Tooltip content="Total mapping and validation tasks completed this calendar month" position="bottom">
              <CardTitle className="text-sm font-medium">Tasks This Month</CardTitle>
            </Tooltip>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  <Val>{formatNumber(stats?.total_contributions_for_month)}</Val>
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.month_contribution_change !== undefined && stats.month_contribution_change >= 0 ? "+" : ""}
                  <Val>{formatNumber(stats?.month_contribution_change)}</Val> from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Management Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Tooltip content="Total hours logged by all users this week (Sunday to now)" position="bottom">
              <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
            </Tooltip>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </CardHeader>
          <CardContent>
            {timeHistoryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{timeStats.weekHours}h</div>
                <p className="text-xs text-muted-foreground">
                  {timeStats.activeCount} {timeStats.activeCount === 1 ? "user" : "users"} currently clocked in
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Tooltip content="Time entries where a user has requested an adjustment that hasn't been resolved yet" position="bottom">
              <CardTitle className="text-sm font-medium">Pending Adjustments</CardTitle>
            </Tooltip>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </CardHeader>
          <CardContent>
            {timeHistoryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${timeStats.pendingAdjustments > 0 ? "text-yellow-600" : "text-muted-foreground"}`}>
                  <Val>{formatNumber(timeStats.pendingAdjustments)}</Val>
                </div>
                <p className="text-xs text-muted-foreground">
                  {timeStats.pendingAdjustments > 0 ? "Awaiting admin review" : "No pending requests"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Tooltip content="Active clock-ins running longer than 10 hours — may indicate a user forgot to clock out" position="bottom">
              <CardTitle className="text-sm font-medium">Long-Running Sessions</CardTitle>
            </Tooltip>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </CardHeader>
          <CardContent>
            {timeHistoryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${timeStats.longRunning > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                  <Val>{formatNumber(timeStats.longRunning)}</Val>
                </div>
                <p className="text-xs text-muted-foreground">
                  {timeStats.longRunning > 0 ? "Sessions over 10 hours — review needed" : "No suspicious sessions"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Snapshot notice */}
      <p className="text-xs text-muted-foreground text-right">
        Stats as of {snapshotTime.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
      </p>

      {/* Task Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <Tooltip content="Total tasks marked as mapped across all projects since tracking began" position="bottom">
              <CardTitle className="text-sm font-medium">Mapped Tasks (All Time)</CardTitle>
            </Tooltip>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="text-3xl font-bold text-kaart-orange">
                <Val>{formatNumber(stats?.mapped_tasks)}</Val>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Tooltip content="Tasks reviewed and approved by a validator since tracking began" position="bottom">
              <CardTitle className="text-sm font-medium">Validated Tasks (All Time)</CardTitle>
            </Tooltip>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="text-3xl font-bold text-green-600">
                <Val>{formatNumber(stats?.validated_tasks)}</Val>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Tooltip content="Tasks sent back for rework after validation review since tracking began" position="bottom">
              <CardTitle className="text-sm font-medium">Invalidated Tasks (All Time)</CardTitle>
            </Tooltip>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="text-3xl font-bold text-red-600">
                <Val>{formatNumber(stats?.invalidated_tasks)}</Val>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Self-Validation Alert */}
      {stats?.self_validated_count != null && stats.self_validated_count > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <Tooltip content="Tasks where the same user both mapped and validated — flagged as not payable to prevent abuse" position="bottom">
              <CardTitle className="text-sm font-medium text-yellow-800">
                Self-Validation Alerts
              </CardTitle>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              <Val>{formatNumber(stats.self_validated_count)}</Val>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Tasks flagged as self-validated (not payable)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <Tooltip content="Total amount owed to all users based on completed tasks and payment rates" position="bottom">
              <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
            </Tooltip>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              <div className="text-3xl font-bold">
                <Val>{formatCurrency(stats?.payable_total)}</Val>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Tooltip content="Payment requests submitted by users awaiting admin approval" position="bottom">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            </Tooltip>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold text-yellow-600">
                  <Val>{formatCurrency(stats?.requests_total)}</Val>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Val>{formatNumber(transactions?.requests?.length ?? 0)}</Val> pending requests
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Tooltip content="Total amount already paid out to users" position="bottom">
              <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            </Tooltip>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              <div className="text-3xl font-bold text-green-600">
                <Val>{formatCurrency(stats?.payouts_total)}</Val>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Tooltip content="Most recent payment requests from users — click View All to manage" position="bottom">
              <CardTitle>Recent Payment Requests</CardTitle>
            </Tooltip>
            <Link
              href="/admin/payments"
              className="text-sm text-kaart-orange hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : transactions?.requests && transactions.requests.length > 0 ? (
              <div className="space-y-4">
                {transactions.requests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{request.user}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.osm_username} • {formatDate(request.date_requested)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        <Val>{formatCurrency(request.amount_requested)}</Val>
                      </p>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No pending payment requests.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <Tooltip content="Most recent completed payments to users" position="bottom">
              <CardTitle>Recent Payouts</CardTitle>
            </Tooltip>
            <Link
              href="/admin/payments"
              className="text-sm text-kaart-orange hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : transactions?.payments && transactions.payments.length > 0 ? (
              <div className="space-y-4">
                {transactions.payments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{payment.user}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.osm_username} • {formatDate(payment.date_paid)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        <Val>{formatCurrency(payment.amount_paid)}</Val>
                      </p>
                      <Badge variant="success">Paid</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent payouts to display.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

    </>
  );
}

// --- Main page component ---
// Only the time section loads here; everything else is deferred to DashboardStats.

export default function AdminDashboard() {
  const { data: projects } = useOrgProjects();
  const [showStats, setShowStats] = useState(false);

  // Defer lower sections until after the time section has painted
  useEffect(() => {
    const id = requestAnimationFrame(() => setShowStats(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Organization overview and management
        </p>
      </div>

      {/* Time Tracking — loads first */}
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <TimeTrackingWidget
            projects={projects?.org_active_projects?.map((p: { id: number; name: string; short_name?: string }) => ({ id: p.id, name: p.name, short_name: p.short_name })) ?? []}
          />
        </div>
        <div className="lg:col-span-3">
          <AdminTimeManagement />
        </div>
      </div>

      {/* Lower sections — deferred */}
      {showStats ? (
        <DashboardStats />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
