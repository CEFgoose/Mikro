"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { Checklist } from "@/types";

export default function ValidatorChecklistsPage() {
  const [completedChecklists, setCompletedChecklists] = useState<Checklist[]>([]);
  const [confirmedChecklists, setConfirmedChecklists] = useState<Checklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"completed" | "confirmed">("completed");
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      const response = await fetch("/api/backend/checklists/fetch_validator_checklists");
      if (response.ok) {
        const data = await response.json();
        setCompletedChecklists(data.completed_checklists || []);
        setConfirmedChecklists(data.confirmed_checklists || []);
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

  const handleConfirmItem = async (checklistId: number, itemNumber: number, userId: number) => {
    try {
      await fetch("/api/backend/checklists/confirm_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklist_id: checklistId,
          item_number: itemNumber,
          user_id: userId,
        }),
      });
      fetchChecklists();
    } catch (error) {
      console.error("Failed to confirm item:", error);
    }
  };

  const currentChecklists = activeTab === "completed" ? completedChecklists : confirmedChecklists;

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
        <h1 className="text-2xl font-bold">Checklists to Validate</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("completed");
            setSelectedChecklist(null);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "completed"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Ready for Confirmation ({completedChecklists.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("confirmed");
            setSelectedChecklist(null);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "confirmed"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Completed & Confirmed ({confirmedChecklists.length})
        </button>
      </div>

      {/* Checklists */}
      <div className="space-y-4">
        {currentChecklists.map((checklist) => (
          <Card
            key={checklist.id}
            className={`transition-all ${
              selectedChecklist === checklist.id ? "ring-2 ring-kaart-orange" : ""
            }`}
          >
            <CardHeader
              className="cursor-pointer"
              onClick={() => handleSelectChecklist(checklist.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{checklist.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Assigned to: {checklist.assigned_user ?? "Unknown"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                  <span className="text-sm text-muted-foreground">
                    ${checklist.validation_rate.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {checklist.list_items?.map((item, index) => (
                  <div
                    key={item.id ?? index}
                    className="flex items-center gap-3 p-2 rounded bg-muted/50"
                  >
                    {activeTab === "completed" && (
                      <input
                        type="checkbox"
                        checked={item.confirmed}
                        onChange={() =>
                          handleConfirmItem(checklist.id, item.number, checklist.assigned_user_id!)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-kaart-orange focus:ring-kaart-orange"
                      />
                    )}
                    {activeTab === "confirmed" && (
                      <span className="h-4 w-4 flex items-center justify-center text-green-600">
                        ✓
                      </span>
                    )}
                    <span className="flex-1">{item.action}</span>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-kaart-orange hover:underline text-sm"
                      >
                        View
                      </a>
                    )}
                  </div>
                ))}
                {(!checklist.list_items || checklist.list_items.length === 0) && (
                  <p className="text-sm text-muted-foreground">No items in this checklist</p>
                )}
              </div>

              {/* Comments section */}
              {checklist.comments && checklist.comments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-2">Comments</h4>
                  <div className="space-y-2">
                    {checklist.comments.map((comment) => (
                      <div key={comment.id} className="text-sm p-2 bg-muted rounded">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{comment.author}</span>
                          <span>{comment.created_at}</span>
                        </div>
                        <p>{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "completed" && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm">
                    Add Comment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {currentChecklists.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No {activeTab === "completed" ? "checklists ready for confirmation" : "confirmed checklists"}
          </div>
        )}
      </div>
    </div>
  );
}
