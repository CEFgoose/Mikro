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
      refetch();
      refetchPayable();
    } catch {
      toast.error("Failed to submit payment request");
    }
  };

  const loading = transactionsLoading || payableLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Track your earnings and payment history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-kaart-orange">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-kaart-orange">
              {formatCurrency(payable?.payable_total ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for payout
            </p>
            <Button
              className="mt-4 w-full"
              onClick={() => setShowRequestModal(true)}
              disabled={(payable?.payable_total ?? 0) <= 0}
            >
              Request Payment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(pendingTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {requests.length} request{requests.length !== 1 ? "s" : ""} awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalReceived)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime earnings paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed payouts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
              <p className="text-sm text-green-700 dark:text-green-300">Mapping Earnings</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                {formatCurrency(payable?.mapping_earnings ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">Validation Earnings</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {formatCurrency(payable?.validation_earnings ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 dark:bg-purple-950 p-4">
              <p className="text-sm text-purple-700 dark:text-purple-300">Checklist Earnings</p>
              <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                {formatCurrency(payable?.checklist_earnings ?? 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Requests and History */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Requests ({requests.length})</TabsTrigger>
          <TabsTrigger value="history">Payment History ({payments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardContent className="p-0">
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
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
          <Card>
            <CardContent className="p-0">
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
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
