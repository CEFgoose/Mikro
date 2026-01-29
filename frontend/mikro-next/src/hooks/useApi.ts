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
