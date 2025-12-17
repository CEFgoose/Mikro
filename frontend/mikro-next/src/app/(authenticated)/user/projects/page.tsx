"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Project } from "@/types";

export default function UserProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/backend/project/fetch_user_projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = (projectId: number) => {
    setSelectedProject(selectedProject === projectId ? null : projectId);
  };

  const goToSource = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Projects</h1>

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.id}
            onClick={() => handleSelectProject(project.id)}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedProject === project.id ? "ring-2 ring-kaart-orange" : ""
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                {project.difficulty && (
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      project.difficulty === "Easy"
                        ? "bg-green-100 text-green-800"
                        : project.difficulty === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {project.difficulty}
                  </span>
                )}
              </div>
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
                  <span className="text-muted-foreground">Your Tasks Mapped:</span>
                  <span>{project.tasks_mapped ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Earnings:</span>
                  <span className="text-kaart-orange font-medium">
                    ${project.user_earnings?.toFixed(2) ?? "0.00"}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToSource(project.url);
                }}
                className="mt-4 w-full text-center py-2 px-4 bg-kaart-orange text-white rounded-lg hover:bg-kaart-orange-dark transition-colors text-sm font-medium"
              >
                Open in Tasking Manager
              </button>
            </CardContent>
          </Card>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p>No projects assigned yet.</p>
            <p className="text-sm mt-2">
              Contact an admin to be assigned to projects.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
