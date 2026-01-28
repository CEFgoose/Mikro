"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { User } from "@/types";

interface CsvUser {
  email: string;
  name: string;
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
  const [isSaving, setIsSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvUsers, setCsvUsers] = useState<CsvUser[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/backend/user/fetch_users", {
        method: "POST",
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

  const handleSelectUser = (userId: string) => {
    setSelectedUser(selectedUser === userId ? null : userId);
  };

  const handleOpenEditModal = () => {
    if (selectedUser) {
      const user = users.find((u) => u.id === selectedUser);
      setEditRole(user?.role || "user");
      setShowEditModal(true);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      alert("Please enter an email address");
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
        alert(data.message || "Invitation sent successfully");
        setShowAddModal(false);
        setInviteEmail("");
        fetchUsers();
      } else {
        alert(data.message || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Failed to invite user:", error);
      alert("Failed to send invitation");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const response = await fetch("/backend/user/modify_users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selectedUser, role: editRole }),
      });
      const data = await response.json();
      if (response.ok && data.status === 200) {
        alert("User role updated successfully");
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        alert(data.message || "Failed to update user role");
      }
    } catch (error) {
      console.error("Failed to update user role:", error);
      alert("Failed to update user role");
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
        const roleIdx = header.indexOf("role");

        if (emailIdx === -1) {
          setImportError("CSV must have an 'email' column");
          return;
        }

        const parsed: CsvUser[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());
          if (values[emailIdx]) {
            parsed.push({
              email: values[emailIdx],
              name: nameIdx !== -1 ? values[nameIdx] || "" : "",
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
        const failedCount = data.results?.failed?.length || 0;
        let message = `Successfully imported ${successCount} user(s).`;
        if (failedCount > 0) {
          message += ` ${failedCount} failed.`;
        }
        alert(message);
        setShowImportModal(false);
        setCsvUsers([]);
        fetchUsers();
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
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)}>Add</Button>
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

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Projects</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Mapped</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Validated</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Invalidated</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Awaiting</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedUser === user.id ? "bg-kaart-orange/10" : ""
                    }`}
                  >
                    <td className="px-6 py-5 font-medium text-gray-900">{user.name?.trim() || user.email || "Unknown"}</td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "validator"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-gray-700">{user.assigned_projects ?? 0}</td>
                    <td className="px-6 py-5 text-gray-700">{user.total_tasks_mapped ?? 0}</td>
                    <td className="px-6 py-5 text-gray-700">{user.total_tasks_validated ?? 0}</td>
                    <td className="px-6 py-5 text-gray-700">{user.total_tasks_invalidated ?? 0}</td>
                    <td className="px-6 py-5 text-gray-700">
                      ${user.awaiting_payment?.toFixed(2) ?? "0.00"}
                    </td>
                    <td className="px-6 py-5 text-gray-700">
                      ${user.total_payout?.toFixed(2) ?? "0.00"}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
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
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Invite User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit User Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Button onClick={handleSaveRole} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to remove this user? This action cannot be undone.
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

      {/* Hidden file input for CSV import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv,text/csv"
        className="hidden"
      />

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>Import Users from CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-auto flex-1">
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
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {csvUsers.map((user, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">{user.email}</td>
                        <td className="px-4 py-2">{user.name || "-"}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "validator"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {user.role}
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
