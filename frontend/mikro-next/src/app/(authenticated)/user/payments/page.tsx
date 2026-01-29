"use client";

import { useState } from "react";
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
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Skeleton,
} from "@/components/ui";
import { useToastActions } from "@/components/ui";
import {
  useUserTransactions,
  useUserPayable,
  useSubmitPaymentRequest,
} from "@/hooks";

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

export default function UserPaymentsPage() {
  const { data: transactions, loading: transactionsLoading, refetch } = useUserTransactions();
  const { data: payable, loading: payableLoading, refetch: refetchPayable } = useUserPayable();
  const { mutate: submitPayment, loading: submitting } = useSubmitPaymentRequest();
  const toast = useToastActions();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState("");

  const requests = transactions?.requests ?? [];
  const payments = transactions?.payments ?? [];

  const pendingTotal = requests.reduce((sum, r) => sum + r.amount_requested, 0);
  const totalReceived = payments.reduce((sum, p) => sum + p.amount_paid, 0);

  const handleRequestPayment = async () => {
    if (!payable || payable.payable_total <= 0) {
      toast.error("No payable amount available");
      return;
    }

    try {
      await submitPayment({ notes: paymentNotes });
      toast.success("Payment request submitted successfully");
      setShowRequestModal(false);
      setPaymentNotes("");
      await refetch();
      await refetchPayable();
    } catch {
      toast.error("Failed to submit payment request");
    }
  };

  const loading = transactionsLoading || payableLoading;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground" style={{ marginTop: 8 }}>
          Track your earnings and payment history
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1.5fr 1fr 1fr 1fr" }} className="grid-stats">
        {/* Available Balance - larger with button */}
        <Card style={{ padding: 0, border: `2px solid ${requests.length > 0 ? "#ca8a04" : "#ff6b35"}` }}>
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Available Balance</p>
            <div style={{ fontSize: 28, fontWeight: 700, color: requests.length > 0 ? "#ca8a04" : "#ff6b35" }}>
              {formatCurrency(payable?.payable_total ?? 0)}
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              {requests.length > 0 ? "Request pending" : "Ready for payout"}
            </p>
            {requests.length > 0 ? (
              <p style={{
                marginTop: 12,
                padding: "8px 12px",
                backgroundColor: "rgba(202, 138, 4, 0.1)",
                borderRadius: 6,
                fontSize: 12,
                color: "#a16207"
              }}>
                You have a pending request. New requests can be submitted after approval.
              </p>
            ) : (
              <Button
                style={{ marginTop: 12, width: "100%" }}
                onClick={() => setShowRequestModal(true)}
                disabled={(payable?.payable_total ?? 0) <= 0}
              >
                Request Payment
              </Button>
            )}
          </div>
        </Card>

        {/* Compact stats */}
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Pending Requests</p>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#ca8a04" }}>
              {formatCurrency(pendingTotal)}
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              {requests.length} awaiting approval
            </p>
          </div>
        </Card>

        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Received</p>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>
              {formatCurrency(totalReceived)}
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Lifetime earnings</p>
          </div>
        </Card>

        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Payments</p>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{payments.length}</div>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Completed payouts</p>
          </div>
        </Card>
      </div>

      {/* Earnings Breakdown - Compact */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div style={{
          padding: "12px 16px",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          borderRadius: 8
        }}>
          <p style={{ fontSize: 12, color: "#15803d" }}>Mapping Earnings</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#166534" }}>
            {formatCurrency(payable?.mapping_earnings ?? 0)}
          </p>
        </div>
        <div style={{
          padding: "12px 16px",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderRadius: 8
        }}>
          <p style={{ fontSize: 12, color: "#1d4ed8" }}>Validation Earnings</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#1e40af" }}>
            {formatCurrency(payable?.validation_earnings ?? 0)}
          </p>
        </div>
        <div style={{
          padding: "12px 16px",
          backgroundColor: "rgba(168, 85, 247, 0.1)",
          borderRadius: 8
        }}>
          <p style={{ fontSize: 12, color: "#7c3aed" }}>Checklist Earnings</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#6d28d9" }}>
            {formatCurrency(payable?.checklist_earnings ?? 0)}
          </p>
        </div>
      </div>

      {/* Tabs for Requests and History */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Requests ({requests.length})</TabsTrigger>
          <TabsTrigger value="history">Payment History ({payments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card style={{ padding: 0 }}>
            <CardContent style={{ padding: 0 }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Date Requested</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">#{request.id}</TableCell>
                      <TableCell>{formatDate(request.date_requested)}</TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(request.amount_requested)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="warning">Pending</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} style={{ textAlign: "center", padding: "32px 16px", color: "#6b7280" }}>
                        No pending payment requests
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card style={{ padding: 0 }}>
            <CardContent style={{ padding: 0 }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Date Paid</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">#{payment.id}</TableCell>
                      <TableCell>{formatDate(payment.date_paid)}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatCurrency(payment.amount_paid)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {payment.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">Paid</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} style={{ textAlign: "center", padding: "32px 16px", color: "#6b7280" }}>
                        No payment history yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Payment Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setPaymentNotes("");
        }}
        title="Request Payment"
        description="Submit a payment request for your available balance"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRequestPayment}
              isLoading={submitting}
              disabled={(payable?.payable_total ?? 0) <= 0}
            >
              Submit Request
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-kaart-orange/10 p-4">
            <p className="text-sm text-muted-foreground">You are requesting:</p>
            <p className="text-3xl font-bold text-kaart-orange">
              {formatCurrency(payable?.payable_total ?? 0)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Earnings Breakdown:</p>
            <div className="text-sm space-y-1 bg-muted p-3 rounded-lg">
              <div className="flex justify-between">
                <span>Mapping:</span>
                <span className="font-medium">{formatCurrency(payable?.mapping_earnings ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Validation:</span>
                <span className="font-medium">{formatCurrency(payable?.validation_earnings ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Checklist:</span>
                <span className="font-medium">{formatCurrency(payable?.checklist_earnings ?? 0)}</span>
              </div>
              <div className="border-t border-border pt-1 mt-1 flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatCurrency(payable?.payable_total ?? 0)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              rows={3}
              placeholder="Add any notes for this payment request..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Payment will be processed within 5-7 business days after approval.
            You will receive the payment to your registered payment method.
          </p>
        </div>
      </Modal>
    </div>
  );
}
