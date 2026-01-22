"use client";

import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  useToastActions,
} from "@/components/ui";
import { useUserProjects } from "@/hooks";
import type { Project } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function ProjectCard({ project }: { project: Project }) {
  const progressPercent = project.total_tasks > 0
    ? Math.round(((project.total_mapped ?? 0) / project.total_tasks) * 100)
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-kaart-orange hover:underline"
            >
              #{project.id} - Open in TM4
            </a>
          </div>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-kaart-orange rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Tasks</p>
            <p className="font-semibold text-lg">{project.total_tasks}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Mapped</p>
            <p className="font-semibold text-lg text-green-600">
              {project.total_mapped ?? 0}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Validated</p>
            <p className="font-semibold text-lg text-blue-600">
              {project.total_validated ?? 0}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Invalidated</p>
            <p className="font-semibold text-lg text-red-600">
              {project.total_invalidated ?? 0}
            </p>
          </div>
        </div>

        {/* Payment Rates */}
        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground mb-2">Payment Rates</p>
          <div className="flex gap-4">
            <div className="flex-1 bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
              <p className="text-xs text-green-700 dark:text-green-300">Mapping</p>
              <p className="font-bold text-green-800 dark:text-green-200">
                {formatCurrency(project.mapping_rate_per_task)}
              </p>
            </div>
            <div className="flex-1 bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-700 dark:text-blue-300">Validation</p>
              <p className="font-bold text-blue-800 dark:text-blue-200">
                {formatCurrency(project.validation_rate_per_task)}
              </p>
            </div>
          </div>
        </div>

        {/* Action */}
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2 px-4 bg-kaart-orange text-white rounded-lg hover:bg-kaart-orange-dark transition-colors font-medium"
        >
          Start Mapping
        </a>
      </CardContent>
    </Card>
  );
}

export default function UserProjectsPage() {
  const { data: projects, loading, error } = useUserProjects();
  const toast = useToastActions();

  // Show error as toast instead of inline
  useEffect(() => {
    if (error) {
      toast.error(`Projects: ${error}`);
    }
  }, [error]);

  const activeProjects = projects?.org_active_projects ?? [];

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
        <p className="text-muted-foreground" style={{ marginTop: 8 }}>
          Projects assigned to you for mapping and validation
        </p>
      </div>

      {/* Stats Summary - Compact Row */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(4, 1fr)" }} className="grid-stats">
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Active Projects</p>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{activeProjects.length}</div>
          </div>
        </Card>
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Tasks</p>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {activeProjects.reduce((sum, p) => sum + p.total_tasks, 0)}
            </div>
          </div>
        </Card>
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Tasks Completed</p>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>
              {activeProjects.reduce((sum, p) => sum + (p.total_mapped ?? 0), 0)}
            </div>
          </div>
        </Card>
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Potential Earnings</p>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#ff6b35" }}>
              {formatCurrency(
                activeProjects.reduce(
                  (sum, p) =>
                    sum +
                    (p.total_tasks - (p.total_mapped ?? 0)) * p.mapping_rate_per_task,
                  0
                )
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Projects Grid */}
      {activeProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{
              width: 48,
              height: 48,
              margin: "0 auto 16px",
              borderRadius: "50%",
              backgroundColor: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "#6b7280" }}
              >
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>No Projects Assigned</h3>
            <p style={{ color: "#6b7280", maxWidth: 320, margin: "0 auto" }}>
              You don&apos;t have any projects assigned yet. Contact your administrator to get
              started with mapping.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
