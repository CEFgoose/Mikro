"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button, Modal, useToastActions } from "@/components/ui";
import { FilterBar } from "@/components/filters";
import { useFilters, useFetchFilterOptions } from "@/hooks";
import { formatNumber, formatCurrency, displayRole } from "@/lib/utils";
import { User } from "@/types";

interface CsvUser {
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  osm_username: string;
  role: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editRole, setEditRole] = useState<string>("user");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvUsers, setCsvUsers] = useState<CsvUser[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackOsmUsername, setTrackOsmUsername] = useState("");
  const [trackDisplayName, setTrackDisplayName] = useState("");
  const toast = useToastActions();
  const { activeFilters, setActiveFilters, filtersBody, clearFilters } = useFilters();
  const { data: filterOptions, loading: filterOptionsLoading } = useFetchFilterOptions();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/backend/user/fetch_users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filtersBody ? { filters: filtersBody } : {}),
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) fetchUsers();
  }, [filtersBody]);

  const handleSelectUser = (userId: string) => {
    setSelectedUser(selectedUser === userId ? null : userId);
  };

  const handleOpenEditModal = () => {
    if (selectedUser) {
      const user = users.find((u) => u.id === selectedUser);
      setEditRole(user?.role || "user");
      setEditFirstName(user?.first_name || "");
      setEditLastName(user?.last_name || "");
      setShowEditModal(true);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/backend/user/invite_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await response.json();
      if (response.ok && data.status === 200) {
        toast.success(data.message || "Invitation sent successfully");
        setShowAddModal(false);
        setInviteEmail("");
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Failed to invite user:", error);
      toast.error("Failed to send invitation");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const response = await fetch("/backend/user/modify_users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser,
          role: editRole,
          first_name: editFirstName,
          last_name: editLastName,
        }),
      });
      const data = await response.json();
      if (response.ok && data.status === 200) {
        toast.success("User updated successfully");
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const response = await fetch("/backend/user/remove_users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selectedUser }),
      });
      const data = await response.json();
      if (response.ok && data.status === 200) {
        toast.success("User removed successfully");
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to remove user");
      }
    } catch (error) {
      console.error("Failed to remove user:", error);
      toast.error("Failed to remove user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.trim().split("\n");
        if (lines.length < 2) {
          setImportError("CSV file must have a header row and at least one data row");
          return;
        }

        const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const emailIdx = header.indexOf("email");
        const nameIdx = header.indexOf("name");
        const firstNameIdx = header.indexOf("first_name");
        const lastNameIdx = header.indexOf("last_name");
        const osmUsernameIdx = header.indexOf("osm_username");
        const roleIdx = header.indexOf("role");

        if (emailIdx === -1) {
          setImportError("CSV must have an 'email' column");
          return;
        }

        const parsed: CsvUser[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());
          if (values[emailIdx]) {
            const firstName = firstNameIdx !== -1 ? values[firstNameIdx] || "" : "";
            const lastName = lastNameIdx !== -1 ? values[lastNameIdx] || "" : "";
            const name = nameIdx !== -1 ? values[nameIdx] || "" : "";
            parsed.push({
              email: values[emailIdx],
              name: name,
              first_name: firstName,
              last_name: lastName,
              osm_username: osmUsernameIdx !== -1 ? values[osmUsernameIdx] || "" : "",
              role: roleIdx !== -1 ? values[roleIdx] || "user" : "user",
            });
          }
        }

        if (parsed.length === 0) {
          setImportError("No valid users found in CSV");
          return;
        }

        setCsvUsers(parsed);
        setShowImportModal(true);
      } catch {
        setImportError("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleImportUsers = async () => {
    if (csvUsers.length === 0) return;
    setIsSaving(true);
    setImportError(null);
    try {
      const response = await fetch("/backend/user/import_users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: csvUsers }),
      });
      const data = await response.json();
      if (response.ok && data.status === 200) {
        const successCount = data.results?.success?.length || 0;
        const failedItems = data.results?.failed || [];
        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} user(s).`);
          setShowImportModal(false);
          setCsvUsers([]);
          fetchUsers();
        }
        if (failedItems.length > 0) {
          const errorDetails = failedItems.map((f: { email: string; error: string }) => `${f.email}: ${f.error}`).join("\n");
          setImportError(`${failedItems.length} user(s) failed to import:\n${errorDetails}`);
          if (successCount === 0) {
            // Keep modal open to show errors
          }
        }
      } else {
        setImportError(data.message || "Import failed");
      }
    } catch (error) {
      console.error("Failed to import users:", error);
      setImportError("Failed to import users");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePurgeUsers = async () => {
    setIsPurging(true);
    try {
      const response = await fetch("/backend/user/purge_all_users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (response.ok && data.status === 200) {
        toast.success(`Purged ${data.users_deleted} users. Your admin account was preserved.`);
        setShowPurgeModal(false);
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to purge users");
      }
    } catch (error) {
      console.error("Failed to purge users:", error);
      toast.error("Failed to purge users");
    } finally {
      setIsPurging(false);
    }
  };

  const handleCreateTrackedUser = async () => {
    if (!trackOsmUsername.trim()) {
      toast.error("OSM username is required");
      return;
    }
    setIsSaving(true);
    try {
      const nameParts = trackDisplayName.trim().split(" ", 2);
      const response = await fetch("/backend/user/create_tracked_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          osm_username: trackOsmUsername.trim(),
          first_name: nameParts[0] || trackOsmUsername.trim(),
          last_name: nameParts[1] || "",
        }),
      });
      const data = await response.json();
      if (response.ok && data.status === 200) {
        toast.success(data.message || "Tracked user created");
        setShowTrackModal(false);
        setTrackOsmUsername("");
        setTrackDisplayName("");
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to create tracked user");
      }
    } catch (error) {
      console.error("Failed to create tracked user:", error);
      toast.error("Failed to create tracked user");
    } finally {
      setIsSaving(false);
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
    <div className="space-y-8">
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)}>Add</Button>
          <Button variant="outline" onClick={() => setShowTrackModal(true)}>Track</Button>
          <Button
            variant="secondary"
            onClick={handleOpenEditModal}
            disabled={!selectedUser}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => selectedUser && setShowDeleteModal(true)}
            disabled={!selectedUser}
          >
            Delete
          </Button>
          <Button variant="outline" onClick={handleImportClick}>Import CSV</Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        dimensions={filterOptions?.dimensions ? Object.entries(filterOptions.dimensions).map(([key, values]) => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          options: Array.isArray(values)
            ? values.map((v) =>
                typeof v === 'string'
                  ? { value: v, label: v }
                  : { value: String(v.id ?? v.name), label: v.name }
              )
            : [],
        })) : []}
        activeFilters={activeFilters}
        onChange={setActiveFilters}
        loading={filterOptionsLoading}
      />

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Country</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Region</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Timezone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Projects</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Mapped</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Validated</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Invalidated</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Awaiting</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Total Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedUser === user.id
                        ? "bg-kaart-orange/15 dark:bg-kaart-orange/25 hover:bg-kaart-orange/20 dark:hover:bg-kaart-orange/30"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <td className="px-6 py-5">
                      <Link
                        href={`/admin/users/${user.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-kaart-orange hover:underline"
                        title="View user profile"
                      >
                        {user.name?.trim() || user.email || "Unknown"}
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "validator"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {displayRole(user.role)}
                        </span>
                        {user.is_tracked_only && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            tracked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-foreground">{user.country_name || "\u2014"}</td>
                    <td className="px-6 py-5 text-foreground">{user.region_name || "\u2014"}</td>
                    <td className="px-6 py-5 text-foreground">{user.timezone || "\u2014"}</td>
                    <td className="px-6 py-5 text-foreground">{formatNumber(user.assigned_projects)}</td>
                    <td className="px-6 py-5 text-foreground">{formatNumber(user.total_tasks_mapped)}</td>
                    <td className="px-6 py-5 text-foreground">{formatNumber(user.total_tasks_validated)}</td>
                    <td className="px-6 py-5 text-foreground">{formatNumber(user.total_tasks_invalidated)}</td>
                    <td className="px-6 py-5 text-foreground">
                      {formatCurrency(user.awaiting_payment)}
                    </td>
                    <td className="px-6 py-5 text-foreground">
                      {formatCurrency(user.total_payout)}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setInviteEmail(""); }} title="Invite User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            The user will receive an email to set their password and complete registration.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowAddModal(false); setInviteEmail(""); }}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={isSaving || !inviteEmail}>
              {isSaving ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              placeholder="Last name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="validator">Validator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete User">
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">
              {users.find((u) => u.id === selectedUser)?.name || users.find((u) => u.id === selectedUser)?.email || "this user"}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isSaving}>
              {isSaving ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hidden file input for CSV import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv,text/csv"
        className="hidden"
      />

      {/* Import CSV Modal */}
      <Modal isOpen={showImportModal} onClose={() => { setShowImportModal(false); setCsvUsers([]); }} title="Import Users from CSV" size="2xl">
        <div className="space-y-4">
          {importError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {importError}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            The following {csvUsers.length} user(s) will be invited. Each will receive an email to set their password.
          </p>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Email</th>
                  <th className="px-4 py-2 text-left font-medium">First Name</th>
                  <th className="px-4 py-2 text-left font-medium">Last Name</th>
                  <th className="px-4 py-2 text-left font-medium">OSM Username</th>
                  <th className="px-4 py-2 text-left font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {csvUsers.map((user, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.first_name || user.name?.split(" ")[0] || "-"}</td>
                    <td className="px-4 py-2">{user.last_name || user.name?.split(" ").slice(1).join(" ") || "-"}</td>
                    <td className="px-4 py-2">{user.osm_username || "-"}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "validator"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {displayRole(user.role)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowImportModal(false); setCsvUsers([]); }}>
              Cancel
            </Button>
            <Button onClick={handleImportUsers} disabled={isSaving}>
              {isSaving ? "Importing..." : `Import ${csvUsers.length} User(s)`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Purge Users Modal */}
      <Modal isOpen={showPurgeModal} onClose={() => setShowPurgeModal(false)} title="Purge All Users">
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This will permanently delete ALL users in the organization except your own admin account.
            All related data (task assignments, checklists, trainings, payments) will also be deleted.
          </p>
          <p className="text-red-600 font-semibold">
            This action cannot be undone!
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPurgeModal(false)} disabled={isPurging}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handlePurgeUsers} disabled={isPurging}>
              {isPurging ? "Purging..." : "Purge All Users"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Track User Modal */}
      <Modal isOpen={showTrackModal} onClose={() => { setShowTrackModal(false); setTrackOsmUsername(""); setTrackDisplayName(""); }} title="Track External User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">OSM Username *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. jorge_mapper"
              value={trackOsmUsername}
              onChange={(e) => setTrackOsmUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Display Name (optional)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Jorge Martinez"
              value={trackDisplayName}
              onChange={(e) => setTrackDisplayName(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            This creates a tracked-only user record. No email or login is created.
            The task sync will automatically pick up their OSM contributions.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowTrackModal(false); setTrackOsmUsername(""); setTrackDisplayName(""); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateTrackedUser} disabled={isSaving || !trackOsmUsername.trim()}>
              {isSaving ? "Creating..." : "Track User"}
            </Button>
          </div>
        </div>
      </Modal>

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
              Purge All Users
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Warning: This will delete all users except your own admin account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
