"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Modal,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
} from "@/components/ui";
import { useToastActions } from "@/components/ui";
import {
  useUserChecklists,
  useCompleteChecklistItem,
  useSubmitChecklist,
} from "@/hooks";
import type { Checklist, ChecklistItem } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UserChecklistsPage() {
  const { data: checklists, loading, refetch } = useUserChecklists();
  const { mutate: completeItem, loading: completing } = useCompleteChecklistItem();
  const { mutate: submitChecklist, loading: submitting } = useSubmitChecklist();
  const toast = useToastActions();

  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const activeChecklists = checklists?.user_started_checklists ?? [];
  const completedChecklists = checklists?.user_completed_checklists ?? [];
  const confirmedChecklists = checklists?.user_confirmed_checklists ?? [];
  const availableChecklists = checklists?.user_available_checklists ?? [];

  // Calculate stats
  const stats = useMemo(() => {
    const all = [...activeChecklists, ...completedChecklists];
    const totalEarned = completedChecklists.reduce((sum, c) => sum + c.completion_rate, 0);
    const totalItems = all.reduce((sum, c) => sum + (c.list_items?.length ?? 0), 0);
    const completedItems = all.reduce(
      (sum, c) => sum + (c.list_items?.filter((i) => i.completed).length ?? 0),
      0
    );
    return {
      total: all.length,
      active: activeChecklists.length,
      completed: completedChecklists.length,
      totalEarned,
      totalItems,
      completedItems,
    };
  }, [activeChecklists, completedChecklists]);

  const handleCompleteItem = async (checklistId: number, itemNumber: number, userId?: string) => {
    try {
      await completeItem({
        checklist_id: checklistId,
        item_number: itemNumber,
        user_id: userId,
      });
      toast.success("Item marked as complete");
      refetch();
    } catch {
      toast.error("Failed to complete item");
    }
  };

  const handleSubmitChecklist = async (checklist: Checklist) => {
    try {
      await submitChecklist({ checklist_id: checklist.id });
      toast.success("Checklist submitted for review");
      refetch();
    } catch {
      toast.error("Failed to submit checklist");
    }
  };

  const openDetailsModal = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setShowDetailsModal(true);
  };

  const ChecklistCard = ({ checklist, isActive = true }: { checklist: Checklist; isActive?: boolean }) => {
    const completedItems = checklist.list_items?.filter((i) => i.completed).length ?? 0;
    const totalItems = checklist.list_items?.length ?? 0;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const allComplete = totalItems > 0 && completedItems === totalItems;

    return (
      <Card
        className={`hover:shadow-md transition-shadow ${
          !isActive ? "border-green-500 bg-green-50/50 dark:bg-green-950/20" : ""
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{checklist.name}</CardTitle>
            <div className="flex gap-2">
              <Badge
                variant={
                  checklist.difficulty === "Easy"
                    ? "success"
                    : checklist.difficulty === "Medium"
                    ? "warning"
                    : "destructive"
                }
              >
                {checklist.difficulty}
              </Badge>
              {!isActive && <Badge variant="success">Completed</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {checklist.description || "No description"}
          </p>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{completedItems}/{totalItems} items</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  allComplete ? "bg-green-500" : "bg-kaart-orange"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reward:</span>
              <span className="font-bold text-kaart-orange">{formatCurrency(checklist.completion_rate)}</span>
            </div>
            {checklist.due_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due:</span>
                <span className={new Date(checklist.due_date) < new Date() ? "text-red-600 font-medium" : ""}>
                  {formatDate(checklist.due_date)}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => openDetailsModal(checklist)}
            >
              {isActive ? "Work on Tasks" : "View Details"}
            </Button>
            {isActive && allComplete && (
              <Button
                size="sm"
                variant="primary"
                className="flex-1"
                onClick={() => handleSubmitChecklist(checklist)}
                isLoading={submitting}
              >
                Submit for Review
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <Skeleton className="h-8 w-48" />
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <h1 className="text-3xl font-bold tracking-tight">My Checklists</h1>
        <p className="text-muted-foreground" style={{ marginTop: 8 }}>
          Complete checklists to earn rewards
        </p>
      </div>

      {/* Stats Cards - Compact Row */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(4, 1fr)" }} className="grid-stats">
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Active Checklists</p>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#ff6b35" }}>{stats.active}</div>
          </div>
        </Card>
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Completed</p>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>{stats.completed}</div>
          </div>
        </Card>
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Items Progress</p>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {stats.completedItems}/{stats.totalItems}
            </div>
            <div style={{ width: "100%", backgroundColor: "#e5e7eb", borderRadius: 4, height: 4, marginTop: 8 }}>
              <div
                style={{
                  backgroundColor: "#ff6b35",
                  height: 4,
                  borderRadius: 4,
                  width: `${stats.totalItems > 0 ? (stats.completedItems / stats.totalItems) * 100 : 0}%`,
                  transition: "width 0.3s"
                }}
              />
            </div>
          </div>
        </Card>
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Earned</p>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>{formatCurrency(stats.totalEarned)}</div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeChecklists.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedChecklists.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeChecklists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {activeChecklists.map((checklist) => (
                <ChecklistCard key={checklist.id} checklist={checklist} isActive />
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
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                </div>
                <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>No Active Checklists</h3>
                <p style={{ color: "#6b7280", maxWidth: 320, margin: "0 auto" }}>
                  You don&apos;t have any checklists assigned. Contact your administrator for assignments.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedChecklists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {completedChecklists.map((checklist) => (
                <ChecklistCard key={checklist.id} checklist={checklist} isActive={false} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent style={{ padding: "48px 24px", textAlign: "center", color: "#6b7280" }}>
                No completed checklists yet
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Details/Work Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedChecklist(null);
        }}
        title={selectedChecklist?.name ?? "Checklist"}
        description={selectedChecklist?.description || "Complete all items to submit"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {activeChecklists.some((c) => c.id === selectedChecklist?.id) &&
              selectedChecklist?.list_items?.every((i) => i.completed) && (
                <Button
                  variant="primary"
                  onClick={() => selectedChecklist && handleSubmitChecklist(selectedChecklist)}
                  isLoading={submitting}
                >
                  Submit for Review
                </Button>
              )}
          </>
        }
      >
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Reward</p>
              <p className="font-bold text-kaart-orange">
                {formatCurrency(selectedChecklist?.completion_rate ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-bold">
                {selectedChecklist?.due_date ? formatDate(selectedChecklist.due_date) : "No due date"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Difficulty</p>
              <Badge
                variant={
                  selectedChecklist?.difficulty === "Easy"
                    ? "success"
                    : selectedChecklist?.difficulty === "Medium"
                    ? "warning"
                    : "destructive"
                }
              >
                {selectedChecklist?.difficulty}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="font-bold">
                {selectedChecklist?.list_items?.filter((i) => i.completed).length ?? 0}/
                {selectedChecklist?.list_items?.length ?? 0} items
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-medium mb-3">Tasks</h3>
            <div className="space-y-2">
              {selectedChecklist?.list_items?.map((item, index) => {
                const isActive = activeChecklists.some((c) => c.id === selectedChecklist?.id);

                return (
                  <div
                    key={item.id ?? index}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      item.completed
                        ? "bg-green-50 dark:bg-green-950"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {isActive && !item.completed ? (
                      <button
                        onClick={() => handleCompleteItem(selectedChecklist!.id, item.number, selectedChecklist?.user_id)}
                        disabled={completing}
                        className="h-5 w-5 rounded border-2 border-muted-foreground flex items-center justify-center hover:border-kaart-orange hover:bg-kaart-orange/10 transition-colors"
                      >
                        {completing && (
                          <div className="h-3 w-3 border-2 border-kaart-orange border-t-transparent rounded-full animate-spin" />
                        )}
                      </button>
                    ) : (
                      <span
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${
                          item.completed
                            ? "bg-green-500 text-white"
                            : "bg-muted-foreground/20"
                        }`}
                      >
                        {item.completed ? "✓" : item.number}
                      </span>
                    )}
                    <span className={`flex-1 ${item.completed ? "line-through text-muted-foreground" : ""}`}>
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
                );
              })}
              {(!selectedChecklist?.list_items || selectedChecklist.list_items.length === 0) && (
                <p className="text-muted-foreground text-center py-4">No items in this checklist</p>
              )}
            </div>
          </div>

          {/* Completion message */}
          {selectedChecklist?.list_items?.every((i) => i.completed) &&
            activeChecklists.some((c) => c.id === selectedChecklist?.id) && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 text-center">
                <p className="text-green-700 dark:text-green-300 font-medium">
                  All tasks complete! Submit this checklist for review to earn {formatCurrency(selectedChecklist?.completion_rate ?? 0)}.
                </p>
              </div>
            )}
        </div>
      </Modal>
    </div>
  );
}
