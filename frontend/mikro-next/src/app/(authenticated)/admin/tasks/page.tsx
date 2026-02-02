"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { Task } from "@/types";

export default function AdminTasksPage() {
  const [externalValidations, setExternalValidations] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  useEffect(() => {
    fetchExternalValidations();
  }, []);

  const fetchExternalValidations = async () => {
    try {
      const response = await fetch("/backend/tasks/fetch_external_validations");
      if (response.ok) {
        const data = await response.json();
        setExternalValidations(data.validations || []);
      }
    } catch (error) {
      console.error("Failed to fetch external validations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateTask = async () => {
    if (!selectedTask) return;
    try {
      await fetch("/backend/tasks/update_task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: selectedTask, action: "Validate" }),
      });
      fetchExternalValidations();
    } catch (error) {
      console.error("Failed to validate task:", error);
    }
  };

  const handleInvalidateTask = async () => {
    if (!selectedTask) return;
    try {
      await fetch("/backend/tasks/update_task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: selectedTask, action: "Invalidate" }),
      });
      fetchExternalValidations();
    } catch (error) {
      console.error("Failed to invalidate task:", error);
    }
  };

  const handleSelectTask = (taskId: number) => {
    setSelectedTask(selectedTask === taskId ? null : taskId);
  };

  const goToSource = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePurgeTaskStats = async () => {
    setIsPurging(true);
    try {
      const response = await fetch("/backend/task/purge_all_task_stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (response.ok && data.status === 200) {
        alert(`Task stats purged. ${data.users_reset} users and ${data.projects_reset} projects reset.`);
        setShowPurgeModal(false);
        fetchExternalValidations();
      } else {
        alert(data.message || "Failed to purge task stats");
      }
    } catch (error) {
      console.error("Failed to purge task stats:", error);
      alert("Failed to purge task stats");
    } finally {
      setIsPurging(false);
    }
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">External Validations</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleValidateTask}
            disabled={!selectedTask}
            className="bg-green-600 hover:bg-green-700"
          >
            Validate
          </Button>
          <Button
            onClick={handleInvalidateTask}
            disabled={!selectedTask}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Invalidate
          </Button>
        </div>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Task ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Project Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Project ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Mapped By</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Validated By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {externalValidations.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => handleSelectTask(task.id)}
                    onDoubleClick={() => task.project_url && goToSource(task.project_url)}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedTask === task.id ? "bg-kaart-orange/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3">{task.id}</td>
                    <td className="px-4 py-3 font-medium">{task.project_name}</td>
                    <td className="px-4 py-3">{task.project_id}</td>
                    <td className="px-4 py-3">{task.mapped_by ?? "-"}</td>
                    <td className="px-4 py-3">{task.validated_by ?? "-"}</td>
                  </tr>
                ))}
                {externalValidations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No external validations pending
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Double-click a row to open the task in the Tasking Manager.
      </p>

      {/* Purge Task Stats Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Purge All Task Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This will reset all task statistics for all users and projects.
                Task counts (mapped, validated, invalidated) and payable amounts will be zeroed out.
              </p>
              <p className="text-red-600 font-semibold">
                This action cannot be undone!
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowPurgeModal(false)} disabled={isPurging}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handlePurgeTaskStats} disabled={isPurging}>
                  {isPurging ? "Purging..." : "Purge All Task Stats"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dev Tools */}
      <Card className="border-2 border-dashed border-yellow-500">
        <CardHeader>
          <CardTitle className="text-yellow-700">Dev Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant="destructive"
              onClick={() => setShowPurgeModal(true)}
            >
              Purge All Task Stats
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Warning: This will reset all task statistics for all users and projects.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
