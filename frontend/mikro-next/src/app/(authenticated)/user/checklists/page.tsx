"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { Checklist } from "@/types";

export default function UserChecklistsPage() {
  const [activeChecklists, setActiveChecklists] = useState<Checklist[]>([]);
  const [completedChecklists, setCompletedChecklists] = useState<Checklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      const response = await fetch("/api/backend/checklists/fetch_user_checklists");
      if (response.ok) {
        const data = await response.json();
        setActiveChecklists(data.active_checklists || []);
        setCompletedChecklists(data.completed_checklists || []);
      }
    } catch (error) {
      console.error("Failed to fetch checklists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteItem = async (checklistId: number, itemNumber: number) => {
    try {
      await fetch("/api/backend/checklists/complete_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklist_id: checklistId,
          item_number: itemNumber,
        }),
      });
      fetchChecklists();
    } catch (error) {
      console.error("Failed to complete item:", error);
    }
  };

  const handleSelectChecklist = (checklistId: number) => {
    setSelectedChecklist(selectedChecklist === checklistId ? null : checklistId);
  };

  const currentChecklists = activeTab === "active" ? activeChecklists : completedChecklists;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Checklists</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("active");
            setSelectedChecklist(null);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "active"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active ({activeChecklists.length})
        </button>
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
          Completed ({completedChecklists.length})
        </button>
      </div>

      {/* Checklists */}
      <div className="space-y-4">
        {currentChecklists.map((checklist) => {
          const completedItems = checklist.list_items?.filter((item) => item.completed).length ?? 0;
          const totalItems = checklist.list_items?.length ?? 0;
          const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

          return (
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
                      {checklist.description || "No description"}
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
                    <span className="text-sm font-medium text-kaart-orange">
                      ${checklist.completion_rate.toFixed(2)}
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>
                      {completedItems}/{totalItems} items
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-kaart-orange rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </CardHeader>
              {selectedChecklist === checklist.id && (
                <CardContent>
                  <div className="space-y-2">
                    {checklist.list_items?.map((item, index) => (
                      <div
                        key={item.id ?? index}
                        className={`flex items-center gap-3 p-2 rounded ${
                          item.completed ? "bg-green-50" : "bg-muted/50"
                        }`}
                      >
                        {activeTab === "active" && (
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleCompleteItem(checklist.id, item.number)}
                            className="h-4 w-4 rounded border-gray-300 text-kaart-orange focus:ring-kaart-orange"
                          />
                        )}
                        {activeTab === "completed" && (
                          <span className="h-4 w-4 flex items-center justify-center text-green-600">
                            ✓
                          </span>
                        )}
                        <span
                          className={`flex-1 ${
                            item.completed ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {item.action}
                        </span>
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

                  {checklist.due_date && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Due: {checklist.due_date}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
        {currentChecklists.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No {activeTab} checklists
          </div>
        )}
      </div>
    </div>
  );
}
