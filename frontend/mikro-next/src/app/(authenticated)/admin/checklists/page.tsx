"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { Checklist } from "@/types";

export default function AdminChecklistsPage() {
  const [activeChecklists, setActiveChecklists] = useState<Checklist[]>([]);
  const [inactiveChecklists, setInactiveChecklists] = useState<Checklist[]>([]);
  const [completedChecklists, setCompletedChecklists] = useState<Checklist[]>([]);
  const [confirmedChecklists, setConfirmedChecklists] = useState<Checklist[]>([]);
  const [staleChecklists, setStaleChecklists] = useState<Checklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "inactive" | "completed" | "confirmed" | "stale">("active");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      const response = await fetch("/api/backend/checklists/fetch_admin_checklists");
      if (response.ok) {
        const data = await response.json();
        setActiveChecklists(data.active_checklists || []);
        setInactiveChecklists(data.inactive_checklists || []);
        setCompletedChecklists(data.completed_checklists || []);
        setConfirmedChecklists(data.confirmed_checklists || []);
        setStaleChecklists(data.stale_checklists || []);
      }
    } catch (error) {
      console.error("Failed to fetch checklists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChecklist = (checklistId: number) => {
    setSelectedChecklist(selectedChecklist === checklistId ? null : checklistId);
  };

  const getCurrentChecklists = (): Checklist[] => {
    switch (activeTab) {
      case "active":
        return activeChecklists;
      case "inactive":
        return inactiveChecklists;
      case "completed":
        return completedChecklists;
      case "confirmed":
        return confirmedChecklists;
      case "stale":
        return staleChecklists;
    }
  };

  const showActionButtons = activeTab === "active" || activeTab === "inactive";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
      </div>
    );
  }

  const currentChecklists = getCurrentChecklists();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Checklists</h1>
        {showActionButtons && (
          <div className="flex gap-2">
            <Button onClick={() => setShowAddModal(true)}>Add</Button>
            <Button
              variant="secondary"
              onClick={() => selectedChecklist && setShowEditModal(true)}
              disabled={!selectedChecklist}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedChecklist && setShowDeleteModal(true)}
              disabled={!selectedChecklist}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {[
          { key: "active", label: "Active", count: activeChecklists.length },
          { key: "inactive", label: "Inactive", count: inactiveChecklists.length },
          { key: "completed", label: "Ready for Confirmation", count: completedChecklists.length },
          { key: "confirmed", label: "Completed & Confirmed", count: confirmedChecklists.length },
          { key: "stale", label: "Stale", count: staleChecklists.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as typeof activeTab);
              setSelectedChecklist(null);
            }}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "text-kaart-orange border-b-2 border-kaart-orange"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Checklists Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentChecklists.map((checklist) => (
          <Card
            key={checklist.id}
            onClick={() => handleSelectChecklist(checklist.id)}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedChecklist === checklist.id ? "ring-2 ring-kaart-orange" : ""
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{checklist.name}</CardTitle>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    checklist.difficulty === "Easy"
                      ? "bg-green-100 text-green-800"
                      : checklist.difficulty === "Medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {checklist.difficulty}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {checklist.description || "No description"}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items:</span>
                  <span>{checklist.list_items?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completion Rate:</span>
                  <span>${checklist.completion_rate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validation Rate:</span>
                  <span>${checklist.validation_rate.toFixed(2)}</span>
                </div>
                {checklist.due_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due:</span>
                    <span>{checklist.due_date}</span>
                  </div>
                )}
                {checklist.assigned_user && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned to:</span>
                    <span>{checklist.assigned_user}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {currentChecklists.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No {activeTab} checklists found
          </div>
        )}
      </div>

      {/* Add Checklist Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Completion Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Validation Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Difficulty</label>
                  <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button>Create Checklist</Button>
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
              <CardTitle>Edit Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Edit checklist settings and items here.</p>
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
              <CardTitle>Delete Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete this checklist? This action cannot be undone.
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
