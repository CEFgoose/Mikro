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
  ConfirmDialog,
  Input,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
} from "@/components/ui";
import { useToastActions } from "@/components/ui";
import {
  useAdminChecklists,
  useCreateChecklist,
  useUpdateChecklist,
  useDeleteChecklist,
  useConfirmChecklist,
  useUsersList,
} from "@/hooks";
import type { Checklist } from "@/types";

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

interface ChecklistFormData {
  name: string;
  description: string;
  completion_rate: string;
  validation_rate: string;
  difficulty: string;
  due_date: string;
  assigned_user_id: string;
}

const defaultFormData: ChecklistFormData = {
  name: "",
  description: "",
  completion_rate: "5.00",
  validation_rate: "2.50",
  difficulty: "Medium",
  due_date: "",
  assigned_user_id: "",
};

interface ItemFormData {
  action: string;
  link: string;
}

export default function AdminChecklistsPage() {
  const { data: checklists, loading, refetch } = useAdminChecklists();
  const { data: usersData } = useUsersList();
  const { mutate: createChecklist, loading: creating } = useCreateChecklist();
  const { mutate: updateChecklist, loading: updating } = useUpdateChecklist();
  const { mutate: deleteChecklist, loading: deleting } = useDeleteChecklist();
  const { mutate: confirmChecklist, loading: confirming } = useConfirmChecklist();
  const toast = useToastActions();

  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState<ChecklistFormData>(defaultFormData);
  const [items, setItems] = useState<ItemFormData[]>([]);

  const activeChecklists = useMemo(() => checklists?.active_checklists ?? [], [checklists?.active_checklists]);
  const inactiveChecklists = useMemo(() => checklists?.inactive_checklists ?? [], [checklists?.inactive_checklists]);
  const completedChecklists = useMemo(() => checklists?.completed_checklists ?? [], [checklists?.completed_checklists]);
  const confirmedChecklists = useMemo(() => checklists?.confirmed_checklists ?? [], [checklists?.confirmed_checklists]);
  const staleChecklists = useMemo(() => checklists?.stale_checklists ?? [], [checklists?.stale_checklists]);

  const users = useMemo(() => usersData?.users ?? [], [usersData?.users]);

  // Calculate stats
  const stats = useMemo(() => {
    const all = [
      ...activeChecklists,
      ...inactiveChecklists,
      ...completedChecklists,
      ...confirmedChecklists,
      ...staleChecklists,
    ];
    const totalPaid = confirmedChecklists.reduce(
      (sum, c) => sum + c.completion_rate + c.validation_rate,
      0
    );
    return {
      total: all.length,
      active: activeChecklists.length,
      pendingConfirmation: completedChecklists.length,
      totalPaid,
    };
  }, [activeChecklists, inactiveChecklists, completedChecklists, confirmedChecklists, staleChecklists]);

  const handleInputChange = (field: keyof ChecklistFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateChecklist = async () => {
    if (!formData.name) {
      toast.error("Please enter a checklist name");
      return;
    }

    try {
      await createChecklist({
        name: formData.name,
        description: formData.description,
        completion_rate: parseFloat(formData.completion_rate),
        validation_rate: parseFloat(formData.validation_rate),
        difficulty: formData.difficulty,
        due_date: formData.due_date || undefined,
        assigned_user_id: formData.assigned_user_id ? parseInt(formData.assigned_user_id) : undefined,
        items: items.filter((i) => i.action.trim()).map((i, idx) => ({
          number: idx + 1,
          action: i.action,
          link: i.link || undefined,
        })),
      });
      toast.success("Checklist created successfully");
      setShowAddModal(false);
      setFormData(defaultFormData);
      setItems([]);
      refetch();
    } catch {
      toast.error("Failed to create checklist");
    }
  };

  const handleUpdateChecklist = async () => {
    if (!selectedChecklist) return;

    try {
      await updateChecklist({
        checklist_id: selectedChecklist.id,
        name: formData.name,
        description: formData.description,
        completion_rate: parseFloat(formData.completion_rate),
        validation_rate: parseFloat(formData.validation_rate),
        difficulty: formData.difficulty,
      });
      toast.success("Checklist updated successfully");
      setShowEditModal(false);
      setSelectedChecklist(null);
      refetch();
    } catch {
      toast.error("Failed to update checklist");
    }
  };

  const handleDeleteChecklist = async () => {
    if (!selectedChecklist) return;

    try {
      await deleteChecklist({ checklist_id: selectedChecklist.id });
      toast.success("Checklist deleted successfully");
      setShowDeleteModal(false);
      setSelectedChecklist(null);
      refetch();
    } catch {
      toast.error("Failed to delete checklist");
    }
  };

  const handleConfirmChecklist = async (checklist: Checklist) => {
    try {
      await confirmChecklist({ checklist_id: checklist.id });
      toast.success("Checklist confirmed and payment processed");
      refetch();
    } catch {
      toast.error("Failed to confirm checklist");
    }
  };

  const openEditModal = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setFormData({
      name: checklist.name,
      description: checklist.description || "",
      completion_rate: checklist.completion_rate.toString(),
      validation_rate: checklist.validation_rate.toString(),
      difficulty: checklist.difficulty,
      due_date: checklist.due_date || "",
      assigned_user_id: checklist.assigned_user_id?.toString() || "",
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setShowDetailsModal(true);
  };

  const addItem = () => {
    setItems([...items, { action: "", link: "" }]);
  };

  const updateItem = (index: number, field: keyof ItemFormData, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const ChecklistCard = ({ checklist, showConfirm = false }: { checklist: Checklist; showConfirm?: boolean }) => {
    const completedItems = checklist.list_items?.filter((i) => i.completed).length ?? 0;
    const totalItems = checklist.list_items?.length ?? 0;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{checklist.name}</CardTitle>
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
                className="h-full bg-kaart-orange rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completion Rate:</span>
              <span className="font-medium">{formatCurrency(checklist.completion_rate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Validation Rate:</span>
              <span className="font-medium">{formatCurrency(checklist.validation_rate)}</span>
            </div>
            {checklist.due_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due:</span>
                <span>{formatDate(checklist.due_date)}</span>
              </div>
            )}
            {checklist.assigned_user && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned:</span>
                <span>{checklist.assigned_user}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => openDetailsModal(checklist)}
            >
              View Details
            </Button>
            {showConfirm ? (
              <Button
                size="sm"
                variant="primary"
                className="flex-1"
                onClick={() => handleConfirmChecklist(checklist)}
                isLoading={confirming}
              >
                Confirm
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => openEditModal(checklist)}
              >
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checklists</h1>
          <p className="text-muted-foreground">
            Manage checklists and track completion
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Create Checklist</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Checklists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-kaart-orange">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingConfirmation}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeChecklists.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Confirmation ({completedChecklists.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({confirmedChecklists.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveChecklists.length})</TabsTrigger>
          <TabsTrigger value="stale">Stale ({staleChecklists.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeChecklists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeChecklists.map((checklist) => (
                <ChecklistCard key={checklist.id} checklist={checklist} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No active checklists
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {completedChecklists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedChecklists.map((checklist) => (
                <ChecklistCard key={checklist.id} checklist={checklist} showConfirm />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No checklists pending confirmation
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="confirmed">
          {confirmedChecklists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {confirmedChecklists.map((checklist) => (
                <ChecklistCard key={checklist.id} checklist={checklist} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No confirmed checklists
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inactive">
          {inactiveChecklists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inactiveChecklists.map((checklist) => (
                <ChecklistCard key={checklist.id} checklist={checklist} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No inactive checklists
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stale">
          {staleChecklists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {staleChecklists.map((checklist) => (
                <ChecklistCard key={checklist.id} checklist={checklist} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No stale checklists
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Checklist Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData(defaultFormData);
          setItems([]);
        }}
        title="Create Checklist"
        description="Create a new checklist with tasks"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateChecklist} isLoading={creating}>
              Create Checklist
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Checklist name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              rows={3}
              placeholder="Describe the checklist..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Completion Rate ($)"
              type="number"
              step="0.01"
              value={formData.completion_rate}
              onChange={(e) => handleInputChange("completion_rate", e.target.value)}
            />
            <Input
              label="Validation Rate ($)"
              type="number"
              step="0.01"
              value={formData.validation_rate}
              onChange={(e) => handleInputChange("validation_rate", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Difficulty"
              value={formData.difficulty}
              onChange={(value) => handleInputChange("difficulty", value)}
              options={[
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
              ]}
            />
            <Input
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange("due_date", e.target.value)}
            />
          </div>
          <Select
            label="Assign to User (optional)"
            value={formData.assigned_user_id}
            onChange={(value) => handleInputChange("assigned_user_id", value)}
            options={[
              { value: "", label: "Unassigned" },
              ...users.map((u) => ({
                value: u.id,
                label: `${u.name}${u.osm_username ? ` (${u.osm_username})` : ""}`,
              })),
            ]}
          />

          {/* Items Section */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Checklist Items ({items.length})</h3>
              <Button size="sm" variant="outline" onClick={addItem}>
                Add Item
              </Button>
            </div>
            {items.map((item, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  placeholder="Task description"
                  value={item.action}
                  onChange={(e) => updateItem(index, "action", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Link (optional)"
                  value={item.link}
                  onChange={(e) => updateItem(index, "link", e.target.value)}
                  className="w-40"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItem(index)}
                  className="text-red-600"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Edit Checklist Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedChecklist(null);
        }}
        title="Edit Checklist"
        description={`Editing ${selectedChecklist?.name}`}
        size="lg"
        footer={
          <>
            <Button
              variant="destructive"
              onClick={() => {
                setShowEditModal(false);
                setShowDeleteModal(true);
              }}
            >
              Delete
            </Button>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateChecklist} isLoading={updating}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Completion Rate ($)"
              type="number"
              step="0.01"
              value={formData.completion_rate}
              onChange={(e) => handleInputChange("completion_rate", e.target.value)}
            />
            <Input
              label="Validation Rate ($)"
              type="number"
              step="0.01"
              value={formData.validation_rate}
              onChange={(e) => handleInputChange("validation_rate", e.target.value)}
            />
          </div>
          <Select
            label="Difficulty"
            value={formData.difficulty}
            onChange={(value) => handleInputChange("difficulty", value)}
            options={[
              { value: "Easy", label: "Easy" },
              { value: "Medium", label: "Medium" },
              { value: "Hard", label: "Hard" },
            ]}
          />
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedChecklist(null);
        }}
        title={selectedChecklist?.name ?? "Checklist Details"}
        description={selectedChecklist?.description || "No description"}
        size="lg"
        footer={
          <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
        }
      >
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="font-bold">{formatCurrency(selectedChecklist?.completion_rate ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Validation Rate</p>
              <p className="font-bold">{formatCurrency(selectedChecklist?.validation_rate ?? 0)}</p>
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
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-bold">
                {selectedChecklist?.due_date ? formatDate(selectedChecklist.due_date) : "No due date"}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-medium mb-2">
              Items ({selectedChecklist?.list_items?.filter((i) => i.completed).length ?? 0}/
              {selectedChecklist?.list_items?.length ?? 0} completed)
            </h3>
            <div className="space-y-2">
              {selectedChecklist?.list_items?.map((item, index) => (
                <div
                  key={item.id ?? index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    item.completed ? "bg-green-50 dark:bg-green-950" : "bg-muted"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${
                      item.completed
                        ? "bg-green-500 text-white"
                        : "bg-muted-foreground/20"
                    }`}
                  >
                    {item.completed ? "✓" : item.number}
                  </span>
                  <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                    {item.action}
                  </span>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-kaart-orange hover:underline text-sm"
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
              {(!selectedChecklist?.list_items || selectedChecklist.list_items.length === 0) && (
                <p className="text-muted-foreground text-center py-4">No items</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedChecklist(null);
        }}
        onConfirm={handleDeleteChecklist}
        title="Delete Checklist"
        message={`Are you sure you want to delete "${selectedChecklist?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        isLoading={deleting}
      />
    </div>
  );
}
