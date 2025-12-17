"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { PayRequest, Payment } from "@/types";

export default function UserPaymentsPage() {
  const [payRequests, setPayRequests] = useState<PayRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/backend/payments/fetch_user_transactions");
      if (response.ok) {
        const data = await response.json();
        setPayRequests(data.requests || []);
        setPayments(data.payments || []);
        setCurrentBalance(data.current_balance || 0);
        setTotalPaid(data.total_paid || 0);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPayment = async () => {
    try {
      const response = await fetch("/api/backend/payments/request_payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: currentBalance }),
      });
      if (response.ok) {
        setShowRequestModal(false);
        fetchPayments();
      }
    } catch (error) {
      console.error("Failed to request payment:", error);
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
      <h1 className="text-2xl font-bold">Payments</h1>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-kaart-orange">
              ${currentBalance.toFixed(2)}
            </div>
            <Button
              onClick={() => setShowRequestModal(true)}
              disabled={currentBalance < 1}
              className="mt-4"
            >
              Request Payment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalPaid.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Lifetime earnings paid out
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "pending"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending Requests ({payRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "history"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Payment History ({payments.length})
        </button>
      </div>

      {/* Pending Requests */}
      {activeTab === "pending" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date Requested</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-4 py-3">{request.id}</td>
                      <td className="px-4 py-3">${request.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">{request.date_requested}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payRequests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No pending payment requests
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {activeTab === "history" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Payoneer ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date Paid</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tasks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-3">{payment.payoneer_id ?? "-"}</td>
                      <td className="px-4 py-3">${payment.amount_paid.toFixed(2)}</td>
                      <td className="px-4 py-3">{payment.date_paid}</td>
                      <td className="px-4 py-3">{payment.task_ids?.length ?? 0}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No payment history
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Payment Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Request Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You are about to request a payment of{" "}
                <span className="font-bold text-foreground">${currentBalance.toFixed(2)}</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                The payment will be sent to your registered Payoneer email address.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRequestModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRequestPayment}>Confirm Request</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
