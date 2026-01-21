"use client";

import { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Project, ValidatorDashboardStats } from "@/types";

export default function ValidatorDashboard() {
  const { isLoading: userLoading } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ValidatorDashboardStats | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        fetch("/api/backend/project/fetch_validator_projects"),
        fetch("/api/backend/user/fetch_validator_stats"),
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToSource = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Validator Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Tasks Mapped Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasks Mapped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.tasks_mapped ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total tasks you have mapped
            </p>
          </CardContent>
        </Card>

        {/* Validation Overview Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Validation Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Validated</span>
                  <span className="text-green-600">{stats?.tasks_validated ?? 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${
                        stats?.tasks_mapped
                          ? ((stats?.tasks_validated ?? 0) / stats.tasks_mapped) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Invalidated</span>
                  <span className="text-blue-600">{stats?.tasks_invalidated ?? 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${
                        stats?.tasks_mapped
                          ? ((stats?.tasks_invalidated ?? 0) / stats.tasks_mapped) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-kaart-orange">
              ${stats?.payable_total?.toFixed(2) ?? "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total paid: ${stats?.paid_total?.toFixed(2) ?? "0.00"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Project</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Map Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Val Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Mapped</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Validated</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Invalidated</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Your Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    onDoubleClick={() => goToSource(project.url)}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedProject === project.id ? "bg-kaart-orange/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{project.name}</td>
                    <td className="px-4 py-3">
                      ${project.mapping_rate_per_task.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      ${project.validation_rate_per_task.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">{project.total_tasks}</td>
                    <td className="px-4 py-3">{project.tasks_mapped ?? 0}</td>
                    <td className="px-4 py-3">{project.tasks_validated ?? 0}</td>
                    <td className="px-4 py-3">{project.tasks_invalidated ?? 0}</td>
                    <td className="px-4 py-3 text-kaart-orange font-medium">
                      ${project.user_earnings?.toFixed(2) ?? "0.00"}
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No projects assigned. Contact an admin to be assigned to projects.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Double-click a row to open the project in the Tasking Manager.
      </p>
    </div>
  );
}
