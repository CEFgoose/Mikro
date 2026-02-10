"use client";

import { useState } from "react";
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
import {
  useOrgProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useApiMutation,
  useFetchProjectUsers,
  useAssignUser,
  usePurgeProjects,
} from "@/hooks";
import { getTM4ProjectUrl } from "@/lib/utils";
import type { Project } from "@/types";

interface ProjectUserItem {
  id: string;
  name: string;
  email: string;
  assigned: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

interface ProjectFormData {
  url: string;
  mapping_rate: string;
  validation_rate: string;
  max_editors: string;
  max_validators: string;
  visibility: boolean;
  difficulty: string;
  status: boolean;
}

const defaultFormData: ProjectFormData = {
  url: "",
  mapping_rate: "0.10",
  validation_rate: "0.05",
  max_editors: "5",
  max_validators: "3",
  visibility: true,
  difficulty: "Medium",
  status: true,
};

export default function AdminProjectsPage() {
  const { data: projects, loading, refetch } = useOrgProjects();
  const { mutate: createProject, loading: creating } = useCreateProject();
  const { mutate: updateProject, loading: updating } = useUpdateProject();
  const { mutate: deleteProject, loading: deleting } = useDeleteProject();
  const { mutate: calculateBudget } = useApiMutation<{ calculation: string; status: number }>(
    "/project/calculate_budget"
  );
  const { mutate: fetchProjectUsers, loading: loadingUsers } = useFetchProjectUsers();
  const { mutate: toggleAssignUser, loading: assigning } = useAssignUser();
  const { mutate: purgeProjects, loading: purging } = usePurgeProjects();
  const toast = useToastActions();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>(defaultFormData);
  const [budgetCalculation, setBudgetCalculation] = useState("");
  const [projectUsers, setProjectUsers] = useState<ProjectUserItem[]>([]);
  const [editTab, setEditTab] = useState<"settings" | "users">("settings");

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
      await createProject({
        url: formData.url,
        rate_type: true,
        mapping_rate: parseFloat(formData.mapping_rate),
        validation_rate: parseFloat(formData.validation_rate),
        max_editors: parseInt(formData.max_editors),
        max_validators: parseInt(formData.max_validators),
        visibility: formData.visibility,
      });
      toast.success("Project created successfully");
      setShowAddModal(false);
      setFormData(defaultFormData);
      setBudgetCalculation("");
      refetch();
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
        mapping_rate: parseFloat(formData.mapping_rate),
        validation_rate: parseFloat(formData.validation_rate),
        max_editors: parseInt(formData.max_editors),
        max_validators: parseInt(formData.max_validators),
        visibility: formData.visibility,
        project_status: formData.status,
      });
      toast.success("Project updated successfully");
      setShowEditModal(false);
      setSelectedProject(null);
      refetch();
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
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete project";
      toast.error(message);
    }
  };

  const openEditModal = async (project: Project) => {
    setSelectedProject(project);
    setFormData({
      url: project.url,
      mapping_rate: project.mapping_rate_per_task.toString(),
      validation_rate: project.validation_rate_per_task.toString(),
      max_editors: project.max_editors?.toString() ?? "5",
      max_validators: project.max_validators?.toString() ?? "3",
      visibility: project.visibility ?? true,
      difficulty: project.difficulty ?? "Medium",
      status: project.status ?? true,
    });
    setEditTab("settings");
    setShowEditModal(true);
    // Fetch users for this project
    try {
      const response = await fetchProjectUsers({ project_id: project.id });
      setProjectUsers(response?.users ?? []);
    } catch {
      console.error("Failed to fetch project users");
      setProjectUsers([]);
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

  const openDeleteModal = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const handlePurgeProjects = async () => {
    try {
      const result = await purgeProjects({});
      toast.success(`Purged ${result.projects_deleted} projects, ${result.tasks_deleted} tasks, reset ${result.users_reset} users`);
      setShowPurgeModal(false);
      refetch();
    } catch {
      toast.error("Failed to purge projects");
    }
  };

  const ProjectTable = ({ projectList }: { projectList: Project[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Tasks</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Rates</TableHead>
          <TableHead>Budget</TableHead>
          <TableHead>Difficulty</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projectList.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <div>
                <p className="font-medium">{project.name}</p>
                <a
                  href={getTM4ProjectUrl(project.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-kaart-orange hover:underline"
                >
                  #{project.id}
                </a>
              </div>
            </TableCell>
            <TableCell>{project.total_tasks}</TableCell>
            <TableCell>
              <div className="text-sm">
                <p className="text-green-600">{project.total_mapped ?? 0} mapped</p>
                <p className="text-blue-600">{project.total_validated ?? 0} validated</p>
                <p className="text-red-600">{project.total_invalidated ?? 0} invalidated</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <p>Map: {formatCurrency(project.mapping_rate_per_task)}</p>
                <p>Val: {formatCurrency(project.validation_rate_per_task)}</p>
              </div>
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
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
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

  if (loading) {
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
            <div className="text-2xl font-bold text-green-600">{activeProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inactiveProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[...activeProjects, ...inactiveProjects].reduce((sum, p) => sum + p.total_tasks, 0)}
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
        }}
        title="Add New Project"
        description="Add a TM4 project to Mikro for payment tracking"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} isLoading={creating}>
              Create Project
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="TM4 Project URL"
            placeholder="https://tasks.kaart.com/projects/123"
            value={formData.url}
            onChange={(e) => handleInputChange("url", e.target.value)}
          />
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
              id="visibility"
              checked={formData.visibility}
              onChange={(e) => handleInputChange("visibility", e.target.checked)}
              className="rounded border-input"
            />
            <label htmlFor="visibility" className="text-sm">
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
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProject(null);
          setProjectUsers([]);
        }}
        title="Edit Project"
        description={`Editing ${selectedProject?.name || "project"}`}
        size="lg"
        footer={
          editTab === "settings" ? (
            <>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProject} isLoading={updating}>
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Close
            </Button>
          )
        }
      >
        <Tabs defaultValue="settings" value={editTab} onValueChange={(v) => setEditTab(v as "settings" | "users")}>
          <TabsList className="mb-4">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="users">
              Users ({projectUsers.filter(u => u.assigned === "Yes").length}/{selectedProject?.max_editors ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="space-y-4">
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
