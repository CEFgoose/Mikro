"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge } from "@/components/ui";
import { useAdminDashboardStats, useOrgTransactions, useUsersList, useOrgProjects, usePurgeTaskStats } from "@/hooks";
import { TimeTrackingWidget } from "@/components/widgets/TimeTrackingWidget";
import { AdminTimeManagement } from "@/components/widgets/AdminTimeManagement";
import Link from "next/link";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminDashboard() {
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useAdminDashboardStats();
  const { data: transactions, loading: transactionsLoading } = useOrgTransactions();
  const { data: users, loading: usersLoading } = useUsersList();
  const { data: projects } = useOrgProjects();
  const { mutate: purgeTaskStats, loading: purging } = usePurgeTaskStats();
  const [purgeConfirm, setPurgeConfirm] = useState(false);

  const handlePurgeTaskStats = async () => {
    if (!purgeConfirm) {
      setPurgeConfirm(true);
      return;
    }
    try {
      await purgeTaskStats({});
      setPurgeConfirm(false);
      refetchStats();
      alert("All task stats purged successfully");
    } catch (err) {
      alert("Failed to purge task stats: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Organization overview and management
        </p>
      </div>

      {/* Time Tracking Widget */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 3fr" }}>
        <TimeTrackingWidget
          projects={projects?.org_active_projects?.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name })) ?? []}
        />
        <AdminTimeManagement />
      </div>

      {statsError && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          Error loading dashboard: {statsError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
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
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.active_projects ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.inactive_projects ?? 0} inactive, {stats?.completed_projects ?? 0} completed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
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
                <div className="text-2xl font-bold">{users?.users?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  In organization
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
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
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.requests_total ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transactions?.requests?.length ?? 0} pending requests
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks This Month</CardTitle>
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
                  {stats?.total_contributions_for_month ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.month_contribution_change !== undefined && stats.month_contribution_change >= 0 ? "+" : ""}
                  {stats?.month_contribution_change ?? 0} from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mapped Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="text-3xl font-bold text-kaart-orange">
                {stats?.mapped_tasks ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Validated Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="text-3xl font-bold text-green-600">
                {stats?.validated_tasks ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Invalidated Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="text-3xl font-bold text-red-600">
                {stats?.invalidated_tasks ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Self-Validation Alert */}
      {stats?.self_validated_count != null && stats.self_validated_count > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">
              Self-Validation Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {stats.self_validated_count}
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
            <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              <div className="text-3xl font-bold">
                {formatCurrency(stats?.payable_total ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              <div className="text-3xl font-bold text-yellow-600">
                {formatCurrency(stats?.requests_total ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(stats?.payouts_total ?? 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Payment Requests</CardTitle>
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
                        {formatCurrency(request.amount_requested)}
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
            <CardTitle>Recent Payouts</CardTitle>
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
                        {formatCurrency(payment.amount_paid)}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/projects"
              className="inline-flex items-center rounded-lg bg-kaart-orange px-4 py-2 text-sm font-medium text-white hover:bg-kaart-orange-dark transition-colors"
            >
              Manage Projects
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              Manage Users
            </Link>
            <Link
              href="/admin/payments"
              className="inline-flex items-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              Process Payments
            </Link>
            <Link
              href="/admin/training"
              className="inline-flex items-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              Training Modules
            </Link>
            <Link
              href="/admin/checklists"
              className="inline-flex items-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              Checklists
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* DEV ONLY: Danger Zone */}
      <Card className="border-red-200 bg-red-50/50 mt-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-red-800">
            Dev Tools (Remove Before Production)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePurgeTaskStats}
              disabled={purging}
              className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                purgeConfirm
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              } disabled:opacity-50`}
            >
              {purging
                ? "Purging..."
                : purgeConfirm
                ? "Click Again to Confirm Purge"
                : "Purge All Task Stats"}
            </button>
            {purgeConfirm && (
              <button
                onClick={() => setPurgeConfirm(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
          <p className="text-xs text-red-600 mt-2">
            Deletes all tasks, user_tasks, validator_task_actions and resets all user/project task counts to 0.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
