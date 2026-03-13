"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Modal,
  ConfirmDialog,
  Input,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Skeleton,
} from "@/components/ui";
import { useToastActions } from "@/components/ui";
import { FilterBar } from "@/components/filters";
import LocationsTab from "@/components/LocationsTab";
import ProjectTrainingsTab from "@/components/ProjectTrainingsTab";
import {
  useOrgProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useApiMutation,
  useFetchProjectUsers,
  useAssignUser,
  usePurgeProjects,
  useFetchProjectTeams,
  useAssignTeamToProject,
  useUnassignTeamFromProject,
  useSyncProject,
  useCheckSyncStatus,
  useFilters,
  useFetchFilterOptions,
} from "@/hooks";
import Link from "next/link";
import { formatNumber, formatCurrency, getProjectExternalUrl } from "@/lib/utils";
import type { Project, ProjectTeamItem } from "@/types";

interface ProjectUserItem {
  id: string;
  name: string;
  email: string;
  assigned: string;
}

interface ProjectFormData {
  url: string;
  source: "tm4" | "mr";
  mapping_rate: string;
  validation_rate: string;
  max_editors: string;
  max_validators: string;
  visibility: boolean;
  difficulty: string;
  status: boolean;
  payments_enabled: boolean;
}

const defaultFormData: ProjectFormData = {
  url: "",
  source: "tm4",
  mapping_rate: "0.10",
  validation_rate: "0.05",
  max_editors: "5",
  max_validators: "3",
  visibility: true,
  difficulty: "Medium",
  status: true,
  payments_enabled: true,
};

export default function AdminProjectsPage() {
  const { data: projects, loading, refetch } = useOrgProjects();
  const { activeFilters, setActiveFilters, filtersBody } = useFilters();
  const { data: filterOptions, loading: filterOptionsLoading } = useFetchFilterOptions();
  const { mutate: createProject, loading: creating } = useCreateProject();
  const { mutate: updateProject, loading: updating } = useUpdateProject();
  const { mutate: deleteProject, loading: deleting } = useDeleteProject();
  const { mutate: calculateBudget } = useApiMutation<{ calculation: string; status: number }>(
    "/project/calculate_budget"
  );
  const { mutate: fetchProjectUsers, loading: loadingUsers } = useFetchProjectUsers();
  const { mutate: toggleAssignUser, loading: assigning } = useAssignUser();
  const { mutate: purgeProjects, loading: purging } = usePurgeProjects();
  const { mutate: fetchProjectTeams, loading: loadingTeams } = useFetchProjectTeams();
  const { mutate: assignTeamToProject } = useAssignTeamToProject();
  const { mutate: unassignTeamFromProject } = useUnassignTeamFromProject();
  const { mutate: syncProject } = useSyncProject();
  const { mutate: checkSyncStatus } = useCheckSyncStatus();
  const [syncingProjectId, setSyncingProjectId] = useState<number | null>(null);
  const toast = useToastActions();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>(defaultFormData);
  const [budgetCalculation, setBudgetCalculation] = useState("");
  const [projectUsers, setProjectUsers] = useState<ProjectUserItem[]>([]);
  const [projectTeams, setProjectTeams] = useState<ProjectTeamItem[]>([]);
  const [editTab, setEditTab] = useState<"settings" | "users" | "teams" | "training" | "locations">("settings");
  const [showMyProjects, setShowMyProjects] = useState(false);
  const [newProjectId, setNewProjectId] = useState<number | null>(null);
  const [addTab, setAddTab] = useState<"details" | "locations" | "teams">("details");
  const [addProjectTeams, setAddProjectTeams] = useState<ProjectTeamItem[]>([]);

  // Re-fetch projects when filters or "my projects" toggle change
  useEffect(() => {
    if (refetch) {
      const body: Record<string, unknown> = {};
      if (filtersBody) body.filters = filtersBody;
      if (showMyProjects) body.created_by_me = true;
      refetch(Object.keys(body).length > 0 ? body : {});
    }
  }, [filtersBody, showMyProjects]);

  const activeProjects = projects?.org_active_projects ?? [];
  const inactiveProjects = projects?.org_inactive_projects ?? [];

  const handleInputChange = (field: keyof ProjectFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCalculateBudget = async () => {
    if (!formData.url) {
      toast.error("Please enter a project URL");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        url: formData.url,
        rate_type: true,
        mapping_rate: parseFloat(formData.mapping_rate),
        validation_rate: parseFloat(formData.validation_rate),
      };
      // Only include project_id if we're editing an existing project
      if (selectedProject?.id) {
        payload.project_id = selectedProject.id;
      }
      const result = await calculateBudget(payload);
      setBudgetCalculation(result.calculation || "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to calculate budget";
      toast.error(message);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.url) {
      toast.error("Please enter a project URL");
      return;
    }

    try {
      const result = await createProject({
        url: formData.url,
        source: formData.source,
        rate_type: true,
        mapping_rate: formData.payments_enabled ? parseFloat(formData.mapping_rate) : 0,
        validation_rate: formData.payments_enabled ? parseFloat(formData.validation_rate) : 0,
        max_editors: parseInt(formData.max_editors),
        max_validators: parseInt(formData.max_validators),
        visibility: formData.visibility,
        payments_enabled: formData.payments_enabled,
      });
      toast.success("Project created — you can now assign locations and teams");
      setNewProjectId(result.project_id);
      // Fetch teams for the new project
      try {
        const teamsResponse = await fetchProjectTeams({ projectId: result.project_id });
        setAddProjectTeams(teamsResponse?.teams ?? []);
      } catch {
        setAddProjectTeams([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      toast.error(message);
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;

    try {
      await updateProject({
        project_id: selectedProject.id,
        difficulty: formData.difficulty,
        rate_type: true,
        mapping_rate: formData.payments_enabled ? parseFloat(formData.mapping_rate) : 0,
        validation_rate: formData.payments_enabled ? parseFloat(formData.validation_rate) : 0,
        max_editors: parseInt(formData.max_editors),
        max_validators: parseInt(formData.max_validators),
        visibility: formData.visibility,
        project_status: formData.status,
        payments_enabled: formData.payments_enabled,
      });
      toast.success("Project updated successfully");
      setShowEditModal(false);
      setSelectedProject(null);
      refetch(filtersBody ? { filters: filtersBody } : {});
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update project";
      toast.error(message);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      await deleteProject({ project_id: selectedProject.id });
      toast.success("Project deleted successfully");
      setShowDeleteModal(false);
      setSelectedProject(null);
      refetch(filtersBody ? { filters: filtersBody } : {});
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete project";
      toast.error(message);
    }
  };

  const handleSyncProject = async (projectId: number, projectName: string) => {
    setSyncingProjectId(projectId);
    try {
      const result = await syncProject({ project_id: projectId });
      const jobId = result.job_id;
      if (!jobId) {
        toast.success(result.message || "Sync started");
        setSyncingProjectId(null);
        return;
      }
      // Poll for completion
      const poll = setInterval(async () => {
        try {
          const status = await checkSyncStatus({ job_id: jobId });
          if (status.sync_status === "completed") {
            clearInterval(poll);
            setSyncingProjectId(null);
            toast.success(status.progress || `${projectName} synced`);
            refetch(filtersBody ? { filters: filtersBody } : {});
          } else if (status.sync_status === "failed") {
            clearInterval(poll);
            setSyncingProjectId(null);
            toast.error(status.error || `Sync failed for ${projectName}`);
          }
        } catch {
          clearInterval(poll);
          setSyncingProjectId(null);
          toast.error("Failed to check sync status");
        }
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      toast.error(message);
      setSyncingProjectId(null);
    }
  };

  const openEditModal = async (project: Project) => {
    setSelectedProject(project);
    setFormData({
      url: project.url,
      source: project.source ?? "tm4",
      mapping_rate: project.mapping_rate_per_task.toString(),
      validation_rate: project.validation_rate_per_task.toString(),
      max_editors: project.max_editors?.toString() ?? "5",
      max_validators: project.max_validators?.toString() ?? "3",
      visibility: project.visibility ?? true,
      difficulty: project.difficulty ?? "Medium",
      status: project.status ?? true,
      payments_enabled: project.payments_enabled ?? true,
    });
    setEditTab("settings");
    setShowEditModal(true);
    // Fetch users and teams for this project
    try {
      const [usersResponse, teamsResponse] = await Promise.all([
        fetchProjectUsers({ project_id: project.id }),
        fetchProjectTeams({ projectId: project.id }),
      ]);
      setProjectUsers(usersResponse?.users ?? []);
      setProjectTeams(teamsResponse?.teams ?? []);
    } catch {
      console.error("Failed to fetch project data");
      setProjectUsers([]);
      setProjectTeams([]);
    }
  };

  const handleToggleUserAssignment = async (userId: string) => {
    if (!selectedProject) return;
    try {
      await toggleAssignUser({ project_id: selectedProject.id, user_id: userId });
      // Refresh the users list
      const response = await fetchProjectUsers({ project_id: selectedProject.id });
      setProjectUsers(response?.users ?? []);
      toast.success("User assignment updated");
    } catch {
      toast.error("Failed to update user assignment");
    }
  };

  const handleToggleTeamAssignment = async (teamId: number, currentStatus: string) => {
    if (!selectedProject) return;
    try {
      if (currentStatus === "Assigned") {
        const result = await unassignTeamFromProject({
          teamId,
          projectId: selectedProject.id,
        });
        toast.success(`Team removed — ${result.removed} user(s) unassigned`);
      } else {
        const result = await assignTeamToProject({
          teamId,
          projectId: selectedProject.id,
        });
        toast.success(
          `Team assigned — ${result.assigned} user(s) added${result.skipped ? `, ${result.skipped} already assigned` : ""}`
        );
      }
      // Refresh both teams and users lists
      const [usersResponse, teamsResponse] = await Promise.all([
        fetchProjectUsers({ project_id: selectedProject.id }),
        fetchProjectTeams({ projectId: selectedProject.id }),
      ]);
      setProjectUsers(usersResponse?.users ?? []);
      setProjectTeams(teamsResponse?.teams ?? []);
    } catch {
      toast.error("Failed to update team assignment");
    }
  };

  const handleToggleAddTeamAssignment = async (teamId: number, currentStatus: string) => {
    if (!newProjectId) return;
    try {
      if (currentStatus === "Assigned") {
        const result = await unassignTeamFromProject({ teamId, projectId: newProjectId });
        toast.success(`Team removed — ${result.removed} user(s) unassigned`);
      } else {
        const result = await assignTeamToProject({ teamId, projectId: newProjectId });
        toast.success(
          `Team assigned — ${result.assigned} user(s) added${result.skipped ? `, ${result.skipped} already assigned` : ""}`
        );
      }
      const teamsResponse = await fetchProjectTeams({ projectId: newProjectId });
      setAddProjectTeams(teamsResponse?.teams ?? []);
    } catch {
      toast.error("Failed to update team assignment");
    }
  };

  const openDeleteModal = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const handlePurgeProjects = async () => {
    try {
      const result = await purgeProjects({});
      toast.success(`Purged ${result.projects_deleted} projects, ${result.tasks_deleted} tasks, reset ${result.users_reset} users`);
      setShowPurgeModal(false);
      refetch(filtersBody ? { filters: filtersBody } : {});
    } catch {
      toast.error("Failed to purge projects");
    }
  };

  const ProjectTable = ({ projectList }: { projectList: Project[] }) => (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[28%]">Project</TableHead>
          <TableHead className="w-[7%]">Tasks</TableHead>
          <TableHead className="w-[15%]">Progress</TableHead>
          <TableHead className="w-[12%]">Rates</TableHead>
          <TableHead className="w-[12%]">Budget</TableHead>
          <TableHead className="w-[10%]">Difficulty</TableHead>
          <TableHead className="w-[16%] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projectList.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="max-w-0">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  <Link href={`/admin/projects/${project.id}`} className="font-medium text-kaart-orange hover:underline" title={`View project details: ${project.name}`}>
                    {project.name}
                  </Link>
                  {project.source === "mr" ? (
                    <Badge variant="default" className="ml-2 text-[10px] bg-blue-500">MR</Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-2 text-[10px]">TM4</Badge>
                  )}
                </div>
                <a
                  href={getProjectExternalUrl(project.id, project.source)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-kaart-orange hover:underline"
                  title={project.source === "mr" ? "Open in MapRoulette" : "Open in Tasking Manager"}
                >
                  #{project.id}
                </a>
              </div>
            </TableCell>
            <TableCell>{formatNumber(project.total_tasks)}</TableCell>
            <TableCell>
              {project.source === "mr" && project.mr_status_breakdown && Object.keys(project.mr_status_breakdown).length > 0 ? (
                <div className="text-sm space-y-0.5">
                  {project.mr_status_breakdown["1"] != null && (
                    <p className="text-green-600">{formatNumber(project.mr_status_breakdown["1"])} Fixed</p>
                  )}
                  {project.mr_status_breakdown["5"] != null && (
                    <p className="text-emerald-500">{formatNumber(project.mr_status_breakdown["5"])} Already Fixed</p>
                  )}
                  {project.mr_status_breakdown["2"] != null && (
                    <p className="text-amber-600">{formatNumber(project.mr_status_breakdown["2"])} Not an Issue</p>
                  )}
                  {project.mr_status_breakdown["6"] != null && (
                    <p className="text-orange-500">{formatNumber(project.mr_status_breakdown["6"])} Can&apos;t Complete</p>
                  )}
                  {project.mr_status_breakdown["3"] != null && (
                    <p className="text-gray-400">{formatNumber(project.mr_status_breakdown["3"])} Skipped</p>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-green-600">{formatNumber(project.total_mapped)} mapped</p>
                  <p className="text-blue-600">{formatNumber(project.total_validated)} validated</p>
                  <p className="text-red-600">{formatNumber(project.total_invalidated)} invalidated</p>
                </div>
              )}
            </TableCell>
            <TableCell>
              {project.payments_enabled === false ? (
                <Badge variant="secondary">Stats Only</Badge>
              ) : (
                <div className="text-sm">
                  <p>Map: {formatCurrency(project.mapping_rate_per_task)}</p>
                  <p>Val: {formatCurrency(project.validation_rate_per_task)}</p>
                </div>
              )}
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <p>Max: {formatCurrency(project.max_payment ?? 0)}</p>
                <p className="text-muted-foreground">
                  Paid: {formatCurrency(project.total_payout ?? 0)}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
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
                {(project as Project & { assigned_locations?: number }).assigned_locations ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {(project as Project & { assigned_locations?: number }).assigned_locations} loc
                  </Badge>
                ) : null}
                {(project as Project & { assigned_trainings?: number }).assigned_trainings ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {(project as Project & { assigned_trainings?: number }).assigned_trainings} trn
                  </Badge>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="text-right pr-2">
              <div className="flex justify-end gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSyncProject(project.id, project.name)}
                  isLoading={syncingProjectId === project.id}
                  disabled={syncingProjectId !== null}
                >
                  Sync
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEditModal(project)}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => openDeleteModal(project)}>
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {projectList.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              No projects found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (loading && !projects) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage TM4 projects and payment rates
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Add Project</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatNumber(activeProjects.length)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatNumber(inactiveProjects.length)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber([...activeProjects, ...inactiveProjects].reduce((sum, p) => sum + p.total_tasks, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                [...activeProjects, ...inactiveProjects].reduce(
                  (sum, p) => sum + (p.total_payout ?? 0),
                  0
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <FilterBar
            dimensions={filterOptions?.dimensions ? Object.entries(filterOptions.dimensions).map(([key, values]) => ({
              key,
              label: key.charAt(0).toUpperCase() + key.slice(1),
              options: Array.isArray(values)
                ? values.map((v) =>
                    typeof v === 'string'
                      ? { value: v, label: v }
                      : { value: String(v.id ?? v.name), label: v.name }
                  )
                : [],
            })) : []}
            activeFilters={activeFilters}
            onChange={setActiveFilters}
            loading={filterOptionsLoading}
          />
        </div>
        <Button
          variant={showMyProjects ? "primary" : "outline"}
          size="sm"
          onClick={() => setShowMyProjects(!showMyProjects)}
        >
          My Projects
        </Button>
      </div>

      {/* Projects Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeProjects.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveProjects.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <Card>
            <CardContent className="p-0">
              <ProjectTable projectList={activeProjects} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inactive">
          <Card>
            <CardContent className="p-0">
              <ProjectTable projectList={inactiveProjects} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Project Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData(defaultFormData);
          setBudgetCalculation("");
          if (newProjectId) refetch(filtersBody ? { filters: filtersBody } : {});
          setNewProjectId(null);
          setAddTab("details");
          setAddProjectTeams([]);
        }}
        title={newProjectId ? "Project Created — Assign Locations & Teams" : "Add New Project"}
        description={newProjectId ? "Optionally assign locations and teams before closing" : "Add a TM4 or MapRoulette project to Mikro for payment tracking"}
        size="lg"
        footer={
          newProjectId ? (
            <Button onClick={() => {
              setShowAddModal(false);
              setFormData(defaultFormData);
              setBudgetCalculation("");
              refetch(filtersBody ? { filters: filtersBody } : {});
              setNewProjectId(null);
              setAddTab("details");
              setAddProjectTeams([]);
            }}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} isLoading={creating}>
                Create Project
              </Button>
            </>
          )
        }
      >
        <Tabs defaultValue="details" value={addTab} onValueChange={(v) => setAddTab(v as "details" | "locations" | "teams")}>
          <TabsList className="mb-4">
            <TabsTrigger value="details">Project Details</TabsTrigger>
            <TabsTrigger value="locations" disabled={!newProjectId}>
              Locations
            </TabsTrigger>
            <TabsTrigger value="teams" disabled={!newProjectId}>
              Teams{newProjectId ? ` (${addProjectTeams.filter(t => t.assigned === "Assigned").length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            {newProjectId ? (
              <div className="text-center py-8">
                <Badge variant="success" className="text-sm px-3 py-1 mb-3">Created</Badge>
                <p className="text-muted-foreground">
                  Project created successfully. Use the Locations and Teams tabs to assign before closing, or click Done.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Project Source</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="add-source"
                        value="tm4"
                        checked={formData.source === "tm4"}
                        onChange={() => handleInputChange("source", "tm4")}
                        className="accent-kaart-orange"
                      />
                      <span className="text-sm">TM4 (Tasking Manager)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="add-source"
                        value="mr"
                        checked={formData.source === "mr"}
                        onChange={() => handleInputChange("source", "mr")}
                        className="accent-kaart-orange"
                      />
                      <span className="text-sm">MapRoulette</span>
                    </label>
                  </div>
                </div>
                <Input
                  label={formData.source === "mr" ? "MapRoulette Challenge URL" : "TM4 Project URL"}
                  placeholder={formData.source === "mr" ? "https://maproulette.org/browse/challenges/123" : "https://tasks.kaart.com/projects/123"}
                  value={formData.url}
                  onChange={(e) => handleInputChange("url", e.target.value)}
                />
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="add-payments-enabled"
                    checked={formData.payments_enabled}
                    onChange={(e) => handleInputChange("payments_enabled", e.target.checked)}
                    className="rounded border-input"
                  />
                  <label htmlFor="add-payments-enabled" className="text-sm font-medium">
                    Enable Payments
                  </label>
                  <span className="text-xs text-muted-foreground">
                    (uncheck for stats-only tracking)
                  </span>
                </div>
                {formData.payments_enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Mapping Rate ($)"
                      type="number"
                      step="0.01"
                      value={formData.mapping_rate}
                      onChange={(e) => handleInputChange("mapping_rate", e.target.value)}
                    />
                    <Input
                      label="Validation Rate ($)"
                      type="number"
                      step="0.01"
                      value={formData.validation_rate}
                      onChange={(e) => handleInputChange("validation_rate", e.target.value)}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Max Editors"
                    type="number"
                    value={formData.max_editors}
                    onChange={(e) => handleInputChange("max_editors", e.target.value)}
                  />
                  <Input
                    label="Max Validators"
                    type="number"
                    value={formData.max_validators}
                    onChange={(e) => handleInputChange("max_validators", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="add-visibility"
                    checked={formData.visibility}
                    onChange={(e) => handleInputChange("visibility", e.target.checked)}
                    className="rounded border-input"
                  />
                  <label htmlFor="add-visibility" className="text-sm">
                    Visible to users
                  </label>
                </div>
                <div className="border-t border-border pt-4">
                  <Button variant="outline" onClick={handleCalculateBudget} className="w-full">
                    Calculate Budget
                  </Button>
                  {budgetCalculation && (
                    <p className="mt-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {budgetCalculation}
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="locations">
            {newProjectId && (
              <LocationsTab resourceId={newProjectId} resourceType="project" />
            )}
          </TabsContent>

          <TabsContent value="teams">
            {!newProjectId ? null : loadingTeams ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : addProjectTeams.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No teams in organization</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">Members</TableHead>
                      <TableHead>Lead</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addProjectTeams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{team.member_count}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {team.lead_name || "None"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={team.assigned === "Assigned" ? "success" : "secondary"}>
                            {team.assigned}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={team.assigned === "Assigned" ? "destructive" : "primary"}
                            onClick={() => handleToggleAddTeamAssignment(team.id, team.assigned)}
                          >
                            {team.assigned === "Assigned" ? "Unassign" : "Assign"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProject(null);
          setProjectUsers([]);
          setProjectTeams([]);
          refetch();
        }}
        title="Edit Project"
        description={`Editing ${selectedProject?.name || "project"}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => {
              setShowEditModal(false);
              setSelectedProject(null);
              setProjectUsers([]);
              setProjectTeams([]);
              refetch();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject} isLoading={updating}>
              Save Changes
            </Button>
          </>
        }
      >
        <Tabs defaultValue="settings" value={editTab} onValueChange={(v) => setEditTab(v as "settings" | "users" | "teams" | "training" | "locations")}>
          <TabsList className="mb-4">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="users">
              Users ({projectUsers.filter(u => u.assigned === "Yes").length}/{selectedProject?.max_editors ?? 0})
            </TabsTrigger>
            <TabsTrigger value="teams">
              Teams ({projectTeams.filter(t => t.assigned === "Assigned").length})
            </TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-payments-enabled"
                  checked={formData.payments_enabled}
                  onChange={(e) => handleInputChange("payments_enabled", e.target.checked)}
                  className="rounded border-input"
                />
                <label htmlFor="edit-payments-enabled" className="text-sm font-medium">
                  Enable Payments
                </label>
                <span className="text-xs text-muted-foreground">
                  (uncheck for stats-only tracking)
                </span>
              </div>
              {!formData.payments_enabled && (
                <p className="text-xs text-amber-600">
                  Disabling payments will not reverse already-accumulated earnings
                </p>
              )}
              {formData.payments_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Mapping Rate ($)"
                    type="number"
                    step="0.01"
                    value={formData.mapping_rate}
                    onChange={(e) => handleInputChange("mapping_rate", e.target.value)}
                  />
                  <Input
                    label="Validation Rate ($)"
                    type="number"
                    step="0.01"
                    value={formData.validation_rate}
                    onChange={(e) => handleInputChange("validation_rate", e.target.value)}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Max Editors"
                  type="number"
                  value={formData.max_editors}
                  onChange={(e) => handleInputChange("max_editors", e.target.value)}
                />
                <Input
                  label="Max Validators"
                  type="number"
                  value={formData.max_validators}
                  onChange={(e) => handleInputChange("max_validators", e.target.value)}
                />
              </div>
              <Select
                label="Difficulty"
                value={formData.difficulty}
                onChange={(value) => handleInputChange("difficulty", value)}
                options={[
                  { value: "Easy", label: "Easy" },
                  { value: "Medium", label: "Medium" },
                  { value: "Hard", label: "Hard" },
                ]}
              />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-visibility"
                    checked={formData.visibility}
                    onChange={(e) => handleInputChange("visibility", e.target.checked)}
                    className="rounded border-input"
                  />
                  <label htmlFor="edit-visibility" className="text-sm">
                    Visible to users
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-status"
                    checked={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.checked)}
                    className="rounded border-input"
                  />
                  <label htmlFor="edit-status" className="text-sm">
                    Active
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users">
            {loadingUsers ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : projectUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No users in organization</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Assigned</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={user.assigned === "Yes" ? "success" : "secondary"}>
                            {user.assigned}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={user.assigned === "Yes" ? "destructive" : "primary"}
                            onClick={() => handleToggleUserAssignment(user.id)}
                            disabled={assigning}
                          >
                            {user.assigned === "Yes" ? "Unassign" : "Assign"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="teams">
            {loadingTeams ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : projectTeams.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No teams in organization</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">Members</TableHead>
                      <TableHead>Lead</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectTeams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{team.member_count}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {team.lead_name || "None"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={team.assigned === "Assigned" ? "success" : "secondary"}>
                            {team.assigned}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={team.assigned === "Assigned" ? "destructive" : "primary"}
                            onClick={() => handleToggleTeamAssignment(team.id, team.assigned)}
                          >
                            {team.assigned === "Assigned" ? "Unassign" : "Assign"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="training">
            {selectedProject && (
              <ProjectTrainingsTab projectId={selectedProject.id} />
            )}
          </TabsContent>

          <TabsContent value="locations">
            {selectedProject && (
              <LocationsTab resourceId={selectedProject.id} resourceType="project" />
            )}
          </TabsContent>
        </Tabs>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProject(null);
        }}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${selectedProject?.name}"? This action cannot be undone and will remove all associated task and payment data.`}
        confirmText="Delete"
        variant="destructive"
        isLoading={deleting}
      />

      {/* Purge Confirmation */}
      <ConfirmDialog
        isOpen={showPurgeModal}
        onClose={() => setShowPurgeModal(false)}
        onConfirm={handlePurgeProjects}
        title="Purge All Projects"
        message="This will PERMANENTLY DELETE all projects, tasks, user-task relations, and reset user stats. This action cannot be undone!"
        confirmText="Purge All"
        variant="destructive"
        isLoading={purging}
      />

      {/* Dev Tools Section */}
      <Card className="mt-8 border-dashed border-yellow-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-yellow-600">Dev Tools (Remove before production)</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowPurgeModal(true)}
            isLoading={purging}
          >
            Purge All Projects
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
