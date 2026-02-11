"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  AdminDashboardStats,
  UserDashboardStats,
  UsersResponse,
  ProjectsResponse,
  TransactionsResponse,
  TrainingsResponse,
  ChecklistsResponse,
  UserPayableResponse,
  UserDetailsResponse,
  TimeTrackingSessionResponse,
  TimeTrackingHistoryResponse,
  TimeTrackingActiveSessionsResponse,
  UserProfileResponse,
  UserStatsDateResponse,
  ChangesetsResponse,
  ActivityChartResponse,
  TaskHistoryResponse,
  TeamsResponse,
  TeamMembersResponse,
  ProjectTeamsResponse,
} from "@/types";

/**
 * Generic hook for fetching data from the backend API
 */
export function useApiCall<T>(
  endpoint: string,
  options?: {
    immediate?: boolean;
    body?: Record<string, unknown>;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options?.immediate !== false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (overrideBody?: Record<string, unknown>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/backend${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(overrideBody || options?.body || {}),
        });

        const result = await response.json();

        if (result.status === 200 || response.ok) {
          setData(result);
          return result as T;
        } else {
          const errorMsg = result.message || "An error occurred";
          setError(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, options?.body]
  );

  useEffect(() => {
    if (options?.immediate !== false) {
      fetchData().catch(() => {});
    }
  }, [fetchData, options?.immediate]);

  return { data, loading, error, refetch: fetchData };
}

// Admin Dashboard Stats
export function useAdminDashboardStats() {
  return useApiCall<AdminDashboardStats>("/project/fetch_admin_dash_stats");
}

// User Dashboard Stats
export function useUserDashboardStats() {
  return useApiCall<UserDashboardStats>("/project/fetch_user_dash_stats");
}

// Validator Dashboard Stats
export function useValidatorDashboardStats() {
  return useApiCall<UserDashboardStats>("/project/fetch_validator_dash_stats");
}

// Users List (Admin)
export function useUsersList() {
  return useApiCall<UsersResponse>("/user/fetch_users");
}

// Projects List (Admin)
export function useOrgProjects() {
  return useApiCall<ProjectsResponse>("/project/fetch_org_projects");
}

// User's Projects
export function useUserProjects() {
  return useApiCall<ProjectsResponse>("/project/fetch_user_projects");
}

// Validator's Projects
export function useValidatorProjects() {
  return useApiCall<ProjectsResponse>("/project/fetch_validator_projects");
}

// Transactions (Admin)
export function useOrgTransactions() {
  return useApiCall<TransactionsResponse>("/transaction/fetch_org_transactions");
}

// User Transactions
export function useUserTransactions() {
  return useApiCall<TransactionsResponse>("/transaction/fetch_user_transactions");
}

// User Payable Amount
export function useUserPayable() {
  return useApiCall<UserPayableResponse>("/transaction/fetch_user_payable");
}

// Trainings (Admin)
export function useOrgTrainings() {
  return useApiCall<TrainingsResponse>("/training/fetch_org_trainings");
}

// User Trainings
export function useUserTrainings() {
  return useApiCall<TrainingsResponse>("/training/fetch_user_trainings");
}

// Checklists (Admin)
export function useAdminChecklists() {
  return useApiCall<ChecklistsResponse>("/checklist/fetch_admin_checklists");
}

// User Checklists
export function useUserChecklists() {
  return useApiCall<ChecklistsResponse>("/checklist/fetch_user_checklists");
}

// Validator Checklists
export function useValidatorChecklists() {
  return useApiCall<ChecklistsResponse>("/checklist/fetch_validator_checklists");
}

// User Details
export function useUserDetails() {
  return useApiCall<UserDetailsResponse>("/user/fetch_user_details");
}

/**
 * Hook for API mutations (POST with custom body)
 */
export function useApiMutation<TResponse = { message: string; status: number }>(
  endpoint: string
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (body: Record<string, unknown>): Promise<TResponse> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/backend${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const result = await response.json();

        if (result.status === 200 || response.ok) {
          return result as TResponse;
        } else {
          const errorMsg = result.message || "An error occurred";
          setError(errorMsg);
          throw new Error(errorMsg);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  return { mutate, loading, error };
}

// Common mutations
export function useUpdateUserDetails() {
  return useApiMutation("/user/update_user_details");
}

export function useSubmitPaymentRequest() {
  return useApiMutation("/transaction/submit_payment_request");
}

export function useProcessPaymentRequest() {
  return useApiMutation("/transaction/process_payment_request");
}

export function useRejectPaymentRequest() {
  return useApiMutation("/transaction/delete_transaction");
}

export function useDeletePayment() {
  return useApiMutation("/transaction/delete_transaction");
}

export interface PaymentRequestTaskDetail {
  task_id: number;
  internal_id: number;
  mapped_by: string;
  validated_by: string;
  mapping_rate: number;
  validation_rate: number;
  validated: boolean;
  invalidated: boolean;
  is_mapping_earning: boolean;
  is_validation_earning: boolean;
  self_validated?: boolean;
}

export interface PaymentRequestProjectDetail {
  project_id: number;
  project_name: string;
  project_url: string | null;
  tasks: PaymentRequestTaskDetail[];
  mapping_count: number;
  validation_count: number;
  mapping_earnings: number;
  validation_earnings: number;
  self_validated_count?: number;
}

export interface PaymentRequestDetailsResponse {
  message: string;
  request_id: number;
  user_name: string;
  osm_username: string;
  amount_requested: number;
  date_requested: string;
  payment_email: string;
  notes: string | null;
  projects: PaymentRequestProjectDetail[];
  summary: {
    total_tasks: number;
    total_projects: number;
    mapping_earnings: number;
    validation_earnings: number;
    total_earnings: number;
    self_validated_count?: number;
  };
  status: number;
}

export function useFetchPaymentRequestDetails() {
  return useApiMutation<PaymentRequestDetailsResponse>("/transaction/fetch_payment_request_details");
}

export function useCompleteTraining() {
  return useApiMutation("/training/complete_training");
}

export function useCreateProject() {
  return useApiMutation("/project/create_project");
}

export function useUpdateProject() {
  return useApiMutation("/project/update_project");
}

export function useDeleteProject() {
  return useApiMutation("/project/delete_project");
}

export function useFetchProjectUsers() {
  return useApiMutation<{ users: Array<{ id: string; name: string; email: string; assigned: string }> }>("/user/fetch_project_users");
}

export function useAssignUser() {
  return useApiMutation("/user/assign_user");
}

export function useUnassignUser() {
  return useApiMutation("/user/unassign_user");
}

export function useModifyUserRole() {
  return useApiMutation("/user/modify_users");
}

export function useRemoveUser() {
  return useApiMutation("/user/remove_users");
}

// Task sync - pulls latest task data from TM4
export function useSyncUserTasks() {
  return useApiMutation("/task/update_user_tasks");
}

export function useAdminSyncAllTasks() {
  return useApiMutation("/task/admin_update_all_user_tasks");
}

export function useCreateTraining() {
  return useApiMutation("/training/create_training");
}

export function useDeleteTraining() {
  return useApiMutation("/training/delete_training");
}

export function useCreateChecklist() {
  return useApiMutation("/checklist/create_checklist");
}

export function useDeleteChecklist() {
  return useApiMutation("/checklist/delete_checklist");
}

export function useStartChecklist() {
  return useApiMutation("/checklist/start_checklist");
}

export function useCompleteChecklistItem() {
  return useApiMutation("/checklist/complete_list_item");
}

export function useConfirmChecklistItem() {
  return useApiMutation("/checklist/confirm_list_item");
}

export function useUpdateTraining() {
  return useApiMutation("/training/update_training");
}

export function useUpdateChecklist() {
  return useApiMutation("/checklist/update_checklist");
}

export function useSubmitChecklist() {
  return useApiMutation("/checklist/submit_checklist");
}

export function useConfirmChecklist() {
  return useApiMutation("/checklist/confirm_checklist");
}

export function useSubmitTrainingQuiz() {
  return useApiMutation<{ score: number; passed: boolean; status: number }>(
    "/training/submit_quiz"
  );
}

export function useAddChecklistComment() {
  return useApiMutation("/checklist/add_comment");
}

export function useAssignUserChecklist() {
  return useApiMutation("/checklist/assign_user_checklist");
}

export function useUnassignUserChecklist() {
  return useApiMutation("/checklist/unassign_user_checklist");
}

export function useFetchChecklistUsers() {
  return useApiMutation<{
    users: Array<{
      id: string;
      name: string;
      role: string;
      assigned: string;
    }>;
    status: number;
  }>("/checklist/fetch_checklist_users");
}

// DEV ONLY: Purge all task stats
export function usePurgeTaskStats() {
  return useApiMutation<{
    message: string;
    users_reset: number;
    projects_reset: number;
    status: number;
  }>("/task/purge_all_task_stats");
}

// DEV ONLY: Purge all checklists
export function usePurgeChecklists() {
  return useApiMutation<{
    message: string;
    checklists_deleted: number;
    users_reset: number;
    status: number;
  }>("/checklist/purge_all_checklists");
}

// DEV ONLY: Purge all trainings
export function usePurgeTrainings() {
  return useApiMutation<{
    message: string;
    trainings_deleted: number;
    users_reset: number;
    status: number;
  }>("/training/purge_all_trainings");
}

// Archive a transaction (soft delete)
export function useArchiveTransaction() {
  return useApiMutation("/transaction/archive_transaction");
}

// Fetch archived transactions
export function useFetchArchivedTransactions() {
  return useApiMutation<{
    message: string;
    archived_requests: Array<{
      id: number;
      amount_requested: number;
      user: string;
      osm_username: string;
      user_id: number;
      payment_email: string;
      task_ids: number[];
      date_requested: string;
      notes: string | null;
      archived_date: string | null;
    }>;
    archived_payments: Array<{
      id: number;
      payoneer_id: string;
      amount_paid: number;
      user: string;
      osm_username: string;
      user_id: number;
      payment_email: string;
      task_ids: number[];
      date_paid: string;
      notes: string | null;
      archived_date: string | null;
    }>;
    status: number;
  }>("/transaction/fetch_archived_transactions");
}

// DEV ONLY: Purge all transactions
export function usePurgeTransactions() {
  return useApiMutation<{
    message: string;
    requests_deleted: number;
    payments_deleted: number;
    users_reset: number;
    status: number;
  }>("/transaction/purge_all_transactions");
}

// DEV ONLY: Purge all projects
export function usePurgeProjects() {
  return useApiMutation<{
    message: string;
    projects_deleted: number;
    tasks_deleted: number;
    users_reset: number;
    status: number;
  }>("/project/purge_all_projects");
}

// DEV ONLY: Purge all users (except initiating admin)
export function usePurgeUsers() {
  return useApiMutation<{
    message: string;
    users_deleted: number;
    admin_preserved: number;
    status: number;
  }>("/user/purge_all_users");
}

// ─── Time Tracking ───────────────────────────────────────────

// User: clock in
export function useClockIn() {
  return useApiMutation<TimeTrackingSessionResponse>("/timetracking/clock_in");
}

// User: clock out
export function useClockOut() {
  return useApiMutation<TimeTrackingSessionResponse>("/timetracking/clock_out");
}

// User: get active session (fires on mount)
export function useActiveTimeSession() {
  return useApiCall<TimeTrackingSessionResponse>("/timetracking/my_active_session");
}

// User: get history
export function useMyTimeHistory() {
  return useApiCall<TimeTrackingHistoryResponse>("/timetracking/my_history");
}

// Admin: get all active sessions
export function useAdminActiveSessions() {
  return useApiCall<TimeTrackingActiveSessionsResponse>("/timetracking/active_sessions");
}

// Admin: get history for org
export function useAdminTimeHistory() {
  return useApiCall<TimeTrackingHistoryResponse>("/timetracking/history");
}

// Admin: force clock out
export function useForceClockOut() {
  return useApiMutation<TimeTrackingSessionResponse>("/timetracking/force_clock_out");
}

// Admin: void entry
export function useVoidTimeEntry() {
  return useApiMutation<{ message: string; status: number; entry: TimeTrackingSessionResponse }>("/timetracking/void_entry");
}

// Admin: edit entry
export function useEditTimeEntry() {
  return useApiMutation<{ message: string; status: number; entry: TimeTrackingSessionResponse }>("/timetracking/edit_entry");
}

// User: request adjustment to a time entry
export function useRequestTimeAdjustment() {
  return useApiMutation<{ message: string; status: number }>("/timetracking/request_adjustment");
}

// Admin: add new time entry
export function useAdminAddTimeEntry() {
  return useApiMutation<{ message: string; status: number; entry: TimeTrackingSessionResponse }>("/timetracking/admin_add_entry");
}

// Admin: add 8-hour test entry (dev only)
export function useAdminAddTestEntry() {
  return useApiMutation<{ message: string; status: number; entry: TimeTrackingSessionResponse }>("/timetracking/admin_add_test_entry");
}

// Admin: fetch full user profile by ID
export function useFetchUserProfile() {
  return useApiMutation<UserProfileResponse>("/user/fetch_user_profile_by_id");
}

// Admin: fetch date-filtered user stats
export function useFetchUserStatsByDate() {
  return useApiMutation<UserStatsDateResponse>("/user/fetch_user_stats_by_date");
}

// DEV ONLY: Purge all time entries
export function usePurgeTimeEntries() {
  return useApiMutation<{
    message: string;
    entries_deleted: number;
    status: number;
  }>("/timetracking/purge_all_time_entries");
}

// Admin: fetch OSM changesets for a user
export function useFetchUserChangesets() {
  return useApiMutation<ChangesetsResponse>("/user/fetch_user_changesets");
}

// Admin: fetch daily activity chart data for a user
export function useFetchUserActivityChart() {
  return useApiMutation<ActivityChartResponse>("/user/fetch_user_activity_chart");
}

// Admin: fetch task-level history for a user
export function useFetchUserTaskHistory() {
  return useApiMutation<TaskHistoryResponse>("/user/fetch_user_task_history");
}

// ─── Teams ─────────────────────────────────────────────────

export function useFetchTeams() {
  return useApiCall<TeamsResponse>("/team/fetch_teams");
}

export function useCreateTeam() {
  return useApiMutation("/team/create_team");
}

export function useUpdateTeam() {
  return useApiMutation("/team/update_team");
}

export function useDeleteTeam() {
  return useApiMutation("/team/delete_team");
}

export function useFetchTeamMembers() {
  return useApiMutation<TeamMembersResponse>("/team/fetch_team_members");
}

export function useAssignTeamMember() {
  return useApiMutation("/team/assign_team_member");
}

export function useUnassignTeamMember() {
  return useApiMutation("/team/unassign_team_member");
}

export function useFetchProjectTeams() {
  return useApiMutation<ProjectTeamsResponse>("/team/fetch_project_teams");
}

export function useAssignTeamToProject() {
  return useApiMutation<{ message: string; assigned: number; skipped: number; status: number }>(
    "/team/assign_team_to_project"
  );
}

export function useUnassignTeamFromProject() {
  return useApiMutation<{ message: string; removed: number; status: number }>(
    "/team/unassign_team_from_project"
  );
}
