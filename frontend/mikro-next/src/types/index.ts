/**
 * Type definitions for Mikro application.
 * Updated to match backend API response formats.
 */

// User types
export interface User {
  id: string; // Auth0 sub (string, not number)
  name: string;
  email: string;
  role: "admin" | "validator" | "user";
  osm_username?: string;
  payment_email?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  country?: string;
  assigned_projects?: number;
  total_tasks_mapped?: number;
  total_tasks_validated?: number;
  total_tasks_invalidated?: number;
  awaiting_payment?: number;
  total_payout?: number;
  org_id?: string;
  first_login?: boolean;
  needs_onboarding?: boolean;
  joined?: string;
  requesting_payment?: boolean;
  validated_tasks_amounts?: number;
}

export interface UserListItem extends User {
  assigned?: "Yes" | "No";
}

// Project types
export interface Project {
  id: number;
  name: string;
  url: string;
  total_tasks: number;
  total_mapped?: number;
  total_validated?: number;
  total_invalidated?: number;
  mapping_rate_per_task: number;
  validation_rate_per_task: number;
  max_payment?: number;
  payment_due?: number;
  total_payout?: number;
  max_editors?: number;
  max_validators?: number;
  total_editors?: number;
  total_validators?: number;
  visibility?: boolean;
  status?: boolean;
  difficulty?: "Easy" | "Medium" | "Hard";
  completed?: boolean;
  // User-specific stats (for user/validator dashboards)
  tasks_mapped?: number;
  tasks_validated?: number;
  tasks_invalidated?: number;
  user_earnings?: number;
}

export interface ProjectsResponse {
  // Admin/Validator response format
  org_active_projects?: Project[];
  org_inactive_projects?: Project[];
  // Validator response: projects where user validated tasks but isn't assigned
  unassigned_validation_projects?: Project[];
  // User response format
  user_projects?: Project[];
  message: string;
  status: number;
}

// Task types
export interface Task {
  id: number;
  task_id: number;
  project_id: number;
  project_name?: string;
  project_url?: string;
  org_id?: string;
  mapping_rate?: number;
  validation_rate?: number;
  mapped?: boolean;
  validated?: boolean;
  invalidated?: boolean;
  paid_out?: boolean;
  mapped_by?: string;
  validated_by?: string;
  date_mapped?: string;
  date_validated?: string;
}

// Payment types
export interface PayRequest {
  id: number;
  user_id: string;
  user: string;
  osm_username: string;
  amount_requested: number;
  date_requested: string;
  payment_email?: string;
  task_ids?: number[];
  notes?: string;
}

export interface Payment {
  id: number;
  user_id: string;
  user: string;
  osm_username?: string;
  amount_paid: number;
  date_paid: string;
  payment_email?: string;
  payoneer_id?: string;
  task_ids?: number[];
  notes?: string;
}

export interface TransactionsResponse {
  requests: PayRequest[];
  payments: Payment[];
  message: string;
  status: number;
}

export interface UserPayableResponse {
  message: string;
  checklist_earnings: number;
  mapping_earnings: number;
  validation_earnings: number;
  payable_total: number;
  status: number;
}

// Training types
export interface Training {
  id: number;
  title: string;
  training_url: string;
  point_value: number;
  difficulty: "Easy" | "Medium" | "Hard";
  training_type?: "Mapping" | "Validation" | "Project" | "mapping" | "validation" | "project";
  project_id?: number;
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
  correct: boolean;
}

export interface TrainingsResponse {
  // Admin response format
  org_mapping_trainings?: Training[];
  org_validation_trainings?: Training[];
  org_project_trainings?: Training[];
  // User response format
  mapping_trainings?: Training[];
  validation_trainings?: Training[];
  project_trainings?: Training[];
  user_completed_trainings?: Training[];
  status: number;
}

// Checklist types
export interface Checklist {
  id: number;
  name: string;
  author?: string;
  description?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  active_status?: boolean;
  visibility?: boolean;
  completion_rate: number;
  validation_rate: number;
  due_date?: string;
  list_items?: ChecklistItem[];
  assigned_users?: number;
  assigned_user?: string;
  assigned_user_id?: number;
  status?: "active" | "inactive" | "pending" | "completed" | "confirmed" | "stale";
  user_name?: string;
  user_id?: string;
  comments?: ChecklistComment[];
}

export interface ChecklistItem {
  id?: number;
  number: number;
  action: string;
  link?: string;
  completed?: boolean;
  confirmed?: boolean;
  completion_date?: string;
  confirmation_date?: string;
}

export interface ChecklistComment {
  id: number;
  comment: string;
  author: string;
  role: string;
  date: string;
}

export interface UserChecklist extends Checklist {
  user_id: string;
  checklist_id: number;
  date_created: string;
  completed: boolean;
  confirmed: boolean;
  last_completion_date?: string;
  last_confirmation_date?: string;
  final_completion_date?: string;
  final_confirmation_date?: string;
  comments?: ChecklistComment[];
}

export interface UserChecklistItem extends ChecklistItem {
  user_id: string;
  checklist_id: number;
}

export interface ChecklistsResponse {
  // Admin response format (all checklist types)
  checklists?: Checklist[];
  active_checklists?: Checklist[];
  inactive_checklists?: Checklist[];
  ready_for_confirmation?: Checklist[];
  confirmed_and_completed?: Checklist[];
  stale_started_checklists?: Checklist[];
  pending_checklists?: Checklist[];
  // User response format
  user_started_checklists?: Checklist[];
  user_completed_checklists?: Checklist[];
  user_confirmed_checklists?: Checklist[];
  user_available_checklists?: Checklist[];
  status: number;
}

// Dashboard Stats types
export interface AdminDashboardStats {
  month_contribution_change: number;
  total_contributions_for_month: number;
  weekly_contributions_array: number[];
  active_projects: number;
  inactive_projects: number;
  completed_projects: number;
  mapped_tasks: number;
  validated_tasks: number;
  invalidated_tasks: number;
  payable_total: number;
  requests_total: number;
  payouts_total: number;
  self_validated_count?: number;
  message: string;
  status: number;
}

export interface UserDashboardStats {
  month_contribution_change: number;
  total_contributions_for_month: number;
  weekly_contributions_array: number[];
  mapped_tasks: number;
  validated_tasks: number;
  invalidated_tasks: number;
  validator_validated: number;
  validator_invalidated: number;
  mapping_payable_total: number;
  validation_payable_total: number;
  payable_total: number;
  requests_total: number;
  payouts_total: number;
  message: string;
  status: number;
}

// Validator Dashboard Stats (snake_case to match backend API response)
export interface ValidatorDashboardStats {
  // Project counts
  active_projects: number;
  inactive_projects: number;
  completed_projects: number;
  // Mapped tasks (as mapper)
  tasks_mapped: number;
  mapped_tasks: number; // Legacy alias
  // Tasks validated by others (where user was mapper)
  tasks_validated: number;
  validated_tasks: number; // Legacy alias
  tasks_invalidated: number;
  invalidated_tasks: number; // Legacy alias
  // Validation work done BY this user (as validator)
  validator_validated: number;
  validator_invalidated: number;
  self_validated_count?: number;
  // Payment totals
  mapping_payable_total: number;
  validation_payable_total: number;
  calculated_validation_earnings: number;
  payable_total: number;
  paid_total: number;
  requests_total: number;
  payouts_total: number;
  // API response
  message: string;
  status: number;
}

// Time Tracking types
export interface TimeEntry {
  id: number;
  userId: string;
  userName: string;
  projectId: number | null;
  projectName: string;
  category: string;
  clockIn: string | null;
  clockOut: string | null;
  duration: string | null;
  durationSeconds: number | null;
  status: "active" | "completed" | "voided";
  changesetCount: number;
  changesCount: number;
  notes: string | null;
  voidedBy: string | null;
  voidedAt: string | null;
  editedBy: string | null;
  editedAt: string | null;
  forceClockedOutBy: string | null;
}

export interface TimeTrackingSessionResponse {
  status: number;
  session: TimeEntry | null;
  message?: string;
  session_id?: number;
  duration_seconds?: number;
}

export interface TimeTrackingHistoryResponse {
  status: number;
  entries: TimeEntry[];
}

export interface TimeTrackingActiveSessionsResponse {
  status: number;
  sessions: TimeEntry[];
}

// User Profile types
export interface UserProjectBreakdown {
  id: number;
  name: string;
  url: string;
  tasks_mapped: number;
  tasks_validated: number;
  tasks_invalidated: number;
  mapping_earnings: number;
  validation_earnings: number;
}

export interface UserProfileData {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  payment_email: string;
  osm_username: string;
  role: string;
  city: string;
  country: string;
  joined: string;
  total_tasks_mapped: number;
  total_tasks_validated: number;
  total_tasks_invalidated: number;
  validator_tasks_validated: number;
  validator_tasks_invalidated: number;
  mapping_payable_total: number;
  validation_payable_total: number;
  checklist_payable_total: number;
  payable_total: number;
  requested_total: number;
  paid_total: number;
  total_checklists_completed: number;
  validator_total_checklists_confirmed: number;
  mapper_level: number;
  mapper_points: number;
  validator_points: number;
  projects: UserProjectBreakdown[];
  time_entries: TimeEntry[];
}

export interface UserProfileResponse {
  user: UserProfileData;
  status: number;
}

export interface UserStatsDateProjectBreakdown {
  id: number;
  name: string;
  total_hours: number;
  entries_count: number;
}

export interface UserStatsDateResponse {
  stats: {
    startDate: string;
    endDate: string;
    total_hours: number;
    entries_count: number;
    time_entries: TimeEntry[];
    projects: UserStatsDateProjectBreakdown[];
    tasks_mapped: number;
    tasks_validated: number;
    tasks_invalidated: number;
    validator_validated: number;
    mapping_earnings: number;
    validation_earnings: number;
  };
  status: number;
}

// Team types
export interface Team {
  id: number;
  name: string;
  description: string | null;
  lead_id: string | null;
  lead_name: string | null;
  member_count: number;
  created_at: string;
}

export interface TeamsResponse {
  teams: Team[];
  status: number;
}

export interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  role: string;
  assigned: string;
}

export interface TeamMembersResponse {
  users: TeamMemberItem[];
  status: number;
}

export interface ProjectTeamItem {
  id: number;
  name: string;
  member_count: number;
  lead_name: string | null;
  assigned: string;
}

export interface ProjectTeamsResponse {
  teams: ProjectTeamItem[];
  status: number;
}

export interface TeamTrainingItem {
  id: number;
  title: string;
  training_type: string;
  difficulty: string;
  point_value: number;
  assigned: string;
}

export interface TeamTrainingsResponse {
  trainings: TeamTrainingItem[];
  status: number;
}

export interface TeamChecklistItem {
  id: number;
  name: string;
  description: string | null;
  difficulty: string;
  active_status: boolean;
  assigned: string;
}

export interface TeamChecklistsResponse {
  checklists: TeamChecklistItem[];
  status: number;
}

// Team Profile types
export interface TeamProfileMember {
  id: string;
  name: string;
  email?: string;
  role: string;
  osm_username: string | null;
  total_tasks_mapped: number;
  total_tasks_validated: number;
  total_tasks_invalidated?: number;
  payable_total?: number;
}

export interface TeamProfileProject {
  id: number;
  name: string;
  url: string;
  team_tasks_mapped: number;
  team_tasks_validated: number;
  team_earnings?: number;
}

export interface TeamProfileTraining {
  id: number;
  title: string;
  training_type: string;
  difficulty: string;
  point_value: number;
}

export interface TeamProfileChecklist {
  id: number;
  name: string;
  difficulty: string;
  active_status: boolean;
}

export interface TeamProfileData {
  team: {
    id: number;
    name: string;
    description: string | null;
    lead_id: string | null;
    lead_name: string | null;
    member_count: number;
    created_at: string;
  };
  members: TeamProfileMember[];
  aggregated_stats: {
    total_tasks_mapped: number;
    total_tasks_validated: number;
    total_tasks_invalidated: number;
    total_checklists_completed: number;
    mapping_payable_total?: number;
    validation_payable_total?: number;
    checklist_payable_total?: number;
    payable_total?: number;
    requested_total?: number;
    paid_total?: number;
  };
  projects: TeamProfileProject[];
  assigned_trainings: TeamProfileTraining[];
  assigned_checklists: TeamProfileChecklist[];
  status: number;
}

export interface UserTeamsResponse {
  teams: Array<{
    id: number;
    name: string;
    description: string | null;
    lead_name: string | null;
    member_count: number;
  }>;
  status: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface UsersResponse {
  users: User[];
  status: number;
}

export interface UserDetailsResponse {
  role: string;
  first_name: string;
  last_name: string;
  full_name: string;
  osm_username: string;
  city: string;
  country: string;
  email: string;
  payment_email: string;
  status: number;
}

export interface LoginResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  osm_username: string;
  payment_email: string;
  city: string;
  country: string;
  needs_onboarding: boolean;
  status: number;
}

export interface ElementCounts {
  nodes: number;
  ways: number;
  relations: number;
}

// OSM Changeset types
export interface Changeset {
  id: number;
  createdAt: string;
  closedAt: string;
  changesCount: number;
  added: number | null;
  modified: number | null;
  deleted: number | null;
  comment: string;
  hashtags: string[];
  source: string;
  imageryUsed: string;
  elements: ElementCounts | null;
  centroid: { lat: number; lon: number } | null;
}

export interface ChangesetSummary {
  totalChangesets: number;
  totalChanges: number;
  totalAdded: number;
  totalModified: number;
  totalDeleted: number;
  totalNodes: number;
  totalWays: number;
  totalRelations: number;
}

export interface ChangesetsResponse {
  changesets: Changeset[];
  summary: ChangesetSummary;
  hashtagSummary: Record<string, number>;
  heatmapPoints: [number, number, number][];
  message?: string;
  status: number;
}

// Activity Chart types
export interface ActivityDataPoint {
  date: string;
  tasksMapped: number;
  tasksValidated: number;
  hoursWorked: number;
}

export interface ActivityChartResponse {
  activity: ActivityDataPoint[];
  status: number;
}

// Task History types
export interface TaskHistoryEntry {
  taskId: number;
  projectId: number;
  projectName: string;
  action: "mapped" | "validated" | "invalidated";
  date: string | null;
  status: string;
  validatedBy?: string;
  mappedBy?: string;
  mappingRate?: number;
  validationRate?: number;
}

export interface TaskHistoryResponse {
  tasks: TaskHistoryEntry[];
  status: number;
}
