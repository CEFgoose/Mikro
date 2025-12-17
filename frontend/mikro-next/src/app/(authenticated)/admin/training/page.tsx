"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { Training } from "@/types";

export default function AdminTrainingPage() {
  const [mappingTrainings, setMappingTrainings] = useState<Training[]>([]);
  const [validationTrainings, setValidationTrainings] = useState<Training[]>([]);
  const [projectTrainings, setProjectTrainings] = useState<Training[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"mapping" | "validation" | "project">("mapping");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await fetch("/api/backend/training/fetch_org_trainings");
      if (response.ok) {
        const data = await response.json();
        setMappingTrainings(data.mapping_trainings || []);
        setValidationTrainings(data.validation_trainings || []);
        setProjectTrainings(data.project_trainings || []);
      }
    } catch (error) {
      console.error("Failed to fetch trainings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTraining = (trainingId: number) => {
    setSelectedTraining(selectedTraining === trainingId ? null : trainingId);
  };

  const getCurrentTrainings = () => {
    switch (activeTab) {
      case "mapping":
        return mappingTrainings;
      case "validation":
        return validationTrainings;
      case "project":
        return projectTrainings;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
      </div>
    );
  }

  const currentTrainings = getCurrentTrainings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Training</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)}>Add</Button>
          <Button
            variant="secondary"
            onClick={() => selectedTraining && setShowEditModal(true)}
            disabled={!selectedTraining}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => selectedTraining && setShowDeleteModal(true)}
            disabled={!selectedTraining}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("mapping");
            setSelectedTraining(null);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "mapping"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Mapping ({mappingTrainings.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("validation");
            setSelectedTraining(null);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "validation"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Validation ({validationTrainings.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("project");
            setSelectedTraining(null);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "project"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Project Specific ({projectTrainings.length})
        </button>
      </div>

      {/* Training Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Difficulty</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Points</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Questions</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentTrainings.map((training) => (
                  <tr
                    key={training.id}
                    onClick={() => handleSelectTraining(training.id)}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedTraining === training.id ? "bg-kaart-orange/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{training.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          training.difficulty === "Easy"
                            ? "bg-green-100 text-green-800"
                            : training.difficulty === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {training.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">{training.point_value}</td>
                    <td className="px-4 py-3">{training.questions?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      <a
                        href={training.training_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-kaart-orange hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
                {currentTrainings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No {activeTab} trainings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Training Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Add Training</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Training URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Point Value</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button>Create Training</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Edit Training</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Edit training settings and questions here.</p>
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete Training</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete this training? This action cannot be undone.
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
