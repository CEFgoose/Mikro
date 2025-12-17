/**
 * Type definitions for Mikro application.
 */

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "validator" | "user";
  osm_username?: string;
  payment_email?: string;
  assigned_projects?: number;
  total_tasks_mapped?: number;
  total_tasks_validated?: number;
  total_tasks_invalidated?: number;
  awaiting_payment?: number;
  total_payout?: number;
  org_id?: number;
  first_login?: boolean;
}

export interface Project {
  id: number;
  name: string;
  url: string;
  total_tasks: number;
  tasks_mapped?: number;
  tasks_validated?: number;
  tasks_invalidated?: number;
  mapping_rate_per_task: number;
  validation_rate_per_task: number;
  max_payment?: number;
  max_editors?: number;
  max_validators?: number;
  visibility?: boolean;
  status?: boolean;
  difficulty?: "Easy" | "Medium" | "Hard";
  user_earnings?: number;
}

export interface Task {
  id: number;
  project_id: number;
  project_name: string;
  project_url: string;
  mapped_by?: string;
  validated_by?: string;
  status?: string;
}

export interface PayRequest {
  id: number;
  user_id: number;
  user_name: string;
  amount: number;
  date_requested: string;
  payment_email?: string;
  task_ids?: number[];
  status?: string;
}

export interface Payment {
  id: number;
  user_id: number;
  user_name: string;
  osm_username?: string;
  amount_paid: number;
  date_paid: string;
  payment_email?: string;
  payoneer_id?: string;
  task_ids?: number[];
  notes?: string;
}

export interface Training {
  id: number;
  title: string;
  training_url: string;
  point_value: number;
  difficulty: "Easy" | "Medium" | "Hard";
  training_type: "Mapping" | "Validation" | "Project";
  questions?: TrainingQuestion[];
}

export interface TrainingQuestion {
  id: number;
  question: string;
  answers: TrainingAnswer[];
}

export interface TrainingAnswer {
  id: number;
  answer: string;
  is_correct: boolean;
}

export interface Checklist {
  id: number;
  name: string;
  description?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  active_status: boolean;
  visibility?: boolean;
  completion_rate: number;
  validation_rate: number;
  due_date?: string;
  list_items: ChecklistItem[];
  comments?: ChecklistComment[];
  assigned_user?: string;
  assigned_user_id?: number;
}

export interface ChecklistItem {
  id?: number;
  number: number;
  action: string;
  link?: string;
  completed?: boolean;
  confirmed?: boolean;
}

export interface ChecklistComment {
  id: number;
  comment: string;
  author: string;
  created_at: string;
}

export interface DashboardStats {
  tasksMapped: number;
  tasksValidated: number;
  tasksInvalidated: number;
  payableTotal: number;
  requestsTotal: number;
  paidTotal: number;
  activeProjectsCount: number;
  inactiveProjectsCount: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  status: number;
}
