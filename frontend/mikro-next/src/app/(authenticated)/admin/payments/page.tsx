"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { PayRequest, Payment } from "@/types";

export default function AdminPaymentsPage() {
  const [payRequests, setPayRequests] = useState<PayRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"requests" | "completed">("requests");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/backend/payments/fetch_org_transactions");
      if (response.ok) {
        const data = await response.json();
        setPayRequests(data.requests || []);
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItem(selectedItem === id ? null : id);
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
        <h1 className="text-2xl font-bold">Payments</h1>
        <div className="flex gap-2">
          {activeTab === "requests" ? (
            <>
              <Button onClick={() => setShowAddModal(true)}>Add</Button>
              <Button
                variant="secondary"
                onClick={() => selectedItem && setShowProcessModal(true)}
                disabled={!selectedItem}
              >
                Process
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline">Export CSV</Button>
              <Button
                variant="secondary"
                onClick={() => selectedItem && setShowDetailsModal(true)}
                disabled={!selectedItem}
              >
                View Details
              </Button>
            </>
          )}
          <Button
            variant="destructive"
            onClick={() => selectedItem && setShowDeleteModal(true)}
            disabled={!selectedItem}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("requests");
            setSelectedItem(null);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "requests"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pay Requests ({payRequests.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("completed");
            setSelectedItem(null);
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "completed"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Completed Payouts ({payments.length})
        </button>
      </div>

      {/* Pay Requests Table */}
      {activeTab === "requests" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tasks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payRequests.map((request) => (
                    <tr
                      key={request.id}
                      onClick={() => handleSelectItem(request.id)}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedItem === request.id ? "bg-kaart-orange/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3">{request.id}</td>
                      <td className="px-4 py-3 font-medium">{request.user_name}</td>
                      <td className="px-4 py-3">${request.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">{request.date_requested}</td>
                      <td className="px-4 py-3">{request.payment_email ?? "-"}</td>
                      <td className="px-4 py-3">{request.task_ids?.length ?? 0}</td>
                    </tr>
                  ))}
                  {payRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No pending pay requests
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Payments Table */}
      {activeTab === "completed" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Payoneer ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date Paid</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tasks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      onClick={() => handleSelectItem(payment.id)}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedItem === payment.id ? "bg-kaart-orange/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3">{payment.payoneer_id ?? "-"}</td>
                      <td className="px-4 py-3 font-medium">{payment.user_name}</td>
                      <td className="px-4 py-3">${payment.amount_paid.toFixed(2)}</td>
                      <td className="px-4 py-3">{payment.date_paid}</td>
                      <td className="px-4 py-3">{payment.payment_email ?? "-"}</td>
                      <td className="px-4 py-3">{payment.task_ids?.length ?? 0}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No completed payments
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">User ID</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Task IDs (comma separated)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="1, 2, 3"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button>Create</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Process Request Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Process Pay Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Payoneer ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowProcessModal(false)}>
                  Cancel
                </Button>
                <Button>Process Payment</Button>
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
              <CardTitle>Delete {activeTab === "requests" ? "Request" : "Payment"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete this {activeTab === "requests" ? "pay request" : "payment"}?
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

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Payment details would be displayed here.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
