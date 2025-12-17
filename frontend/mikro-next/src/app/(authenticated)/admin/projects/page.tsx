"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { Project } from "@/types";

export default function AdminProjectsPage() {
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [inactiveProjects, setInactiveProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form state
  const [projectUrl, setProjectUrl] = useState("");
  const [mappingRate, setMappingRate] = useState("0.10");
  const [validationRate, setValidationRate] = useState("0.05");
  const [maxEditors, setMaxEditors] = useState("5");
  const [maxValidators, setMaxValidators] = useState("3");
  const [budgetCalculation, setBudgetCalculation] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/backend/project/fetch_org_projects");
      if (response.ok) {
        const data = await response.json();
        setActiveProjects(data.active_projects || []);
        setInactiveProjects(data.inactive_projects || []);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBudget = async () => {
    try {
      const response = await fetch("/api/backend/project/calculate_budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: projectUrl,
          rate_type: true,
          mapping_rate: parseFloat(mappingRate),
          validation_rate: parseFloat(validationRate),
          project_id: selectedProject,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setBudgetCalculation(data.calculation || "");
      }
    } catch (error) {
      console.error("Failed to calculate budget:", error);
    }
  };

  const handleSelectProject = (projectId: number) => {
    setSelectedProject(selectedProject === projectId ? null : projectId);
  };

  const currentProjects = activeTab === "active" ? activeProjects : inactiveProjects;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)}>Add</Button>
          <Button
            variant="secondary"
            onClick={() => selectedProject && setShowEditModal(true)}
            disabled={!selectedProject}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => selectedProject && setShowDeleteModal(true)}
            disabled={!selectedProject}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "active"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active ({activeProjects.length})
        </button>
        <button
          onClick={() => setActiveTab("inactive")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "inactive"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Inactive ({inactiveProjects.length})
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentProjects.map((project) => (
          <Card
            key={project.id}
            onClick={() => handleSelectProject(project.id)}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedProject === project.id ? "ring-2 ring-kaart-orange" : ""
            }`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tasks:</span>
                  <span>{project.total_tasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mapping Rate:</span>
                  <span>${project.mapping_rate_per_task.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validation Rate:</span>
                  <span>${project.validation_rate_per_task.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Budget:</span>
                  <span>${project.max_payment?.toFixed(2) ?? "N/A"}</span>
                </div>
                {project.difficulty && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Difficulty:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        project.difficulty === "Easy"
                          ? "bg-green-100 text-green-800"
                          : project.difficulty === "Medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {project.difficulty}
                    </span>
                  </div>
                )}
              </div>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-4 block text-center text-sm text-kaart-orange hover:underline"
              >
                View in Tasking Manager
              </a>
            </CardContent>
          </Card>
        ))}
        {currentProjects.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No {activeTab} projects found
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">TM4 Project URL</label>
                <input
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="https://tasks.kaart.com/projects/123"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mapping Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={mappingRate}
                    onChange={(e) => setMappingRate(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Validation Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={validationRate}
                    onChange={(e) => setValidationRate(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Editors</label>
                  <input
                    type="number"
                    value={maxEditors}
                    onChange={(e) => setMaxEditors(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Validators</label>
                  <input
                    type="number"
                    value={maxValidators}
                    onChange={(e) => setMaxValidators(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <Button variant="outline" onClick={calculateBudget} className="w-full">
                  Calculate Budget
                </Button>
                {budgetCalculation && (
                  <p className="mt-2 text-sm text-muted-foreground">{budgetCalculation}</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button>Create Project</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit/Delete Modals would follow similar pattern */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Edit Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Edit project settings here.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete this project? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="destructive">Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
