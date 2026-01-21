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
  useOrgTransactions,
  useProcessPaymentRequest,
} from "@/hooks";
import type { PayRequest } from "@/types";

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

export default function AdminPaymentsPage() {
  const { data: transactions, loading, refetch } = useOrgTransactions();
  const { mutate: processPayment, loading: processing } = useProcessPaymentRequest();
  const toast = useToastActions();

  const [selectedRequest, setSelectedRequest] = useState<PayRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "user">("date");

  const requests = useMemo(() => transactions?.requests ?? [], [transactions?.requests]);
  const payments = useMemo(() => transactions?.payments ?? [], [transactions?.payments]);

  const totalPending = useMemo(() => requests.reduce((sum, r) => sum + r.amount_requested, 0), [requests]);
  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount_paid, 0), [payments]);

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    return requests
      .filter(
        (r) =>
          r.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.osm_username?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      )
      .toSorted((a, b) => {
        switch (sortBy) {
          case "amount":
            return b.amount_requested - a.amount_requested;
          case "user":
            return a.user.localeCompare(b.user);
          case "date":
          default:
            return new Date(b.date_requested).getTime() - new Date(a.date_requested).getTime();
        }
      });
  }, [requests, searchTerm, sortBy]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments
      .filter(
        (p) =>
          p.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.osm_username?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      )
      .toSorted((a, b) => new Date(b.date_paid).getTime() - new Date(a.date_paid).getTime());
  }, [payments, searchTerm]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const thisMonth = payments.filter((p) => {
      const date = new Date(p.date_paid);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const lastMonth = payments.filter((p) => {
      const date = new Date(p.date_paid);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
    });
    return {
      thisMonth: thisMonth.reduce((sum, p) => sum + p.amount_paid, 0),
      lastMonth: lastMonth.reduce((sum, p) => sum + p.amount_paid, 0),
      count: thisMonth.length,
    };
  }, [payments]);

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      await processPayment({
        request_id: selectedRequest.id,
        approved: true,
        notes: paymentNotes,
      });
      toast.success(`Payment of ${formatCurrency(selectedRequest.amount_requested)} approved`);
      setShowApproveModal(false);
      setSelectedRequest(null);
      setPaymentNotes("");
      refetch();
    } catch {
      toast.error("Failed to approve payment");
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      await processPayment({
        request_id: selectedRequest.id,
        approved: false,
        notes: paymentNotes,
      });
      toast.success("Payment request rejected");
      setShowRejectModal(false);
      setSelectedRequest(null);
      setPaymentNotes("");
      refetch();
    } catch {
      toast.error("Failed to reject payment");
    }
  };

  const openApproveModal = (request: PayRequest) => {
    setSelectedRequest(request);
    setPaymentNotes("");
    setShowApproveModal(true);
  };

  const openRejectModal = (request: PayRequest) => {
    setSelectedRequest(request);
    setPaymentNotes("");
    setShowRejectModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-64" />
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
          Manage payment requests and view payout history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{requests.length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(totalPending)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{payments.length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-kaart-orange">
              {formatCurrency(monthlyStats.thisMonth)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlyStats.count} payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthlyStats.lastMonth)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlyStats.thisMonth > monthlyStats.lastMonth ? (
                <span className="text-green-600">
                  +{formatCurrency(monthlyStats.thisMonth - monthlyStats.lastMonth)} increase
                </span>
              ) : monthlyStats.thisMonth < monthlyStats.lastMonth ? (
                <span className="text-red-600">
                  {formatCurrency(monthlyStats.thisMonth - monthlyStats.lastMonth)} decrease
                </span>
              ) : (
                "Same as this month"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by user or OSM username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          label=""
          value={sortBy}
          onChange={(value) => setSortBy(value as "date" | "amount" | "user")}
          options={[
            { value: "date", label: "Sort by Date" },
            { value: "amount", label: "Sort by Amount" },
            { value: "user", label: "Sort by User" },
          ]}
        />
      </div>

      {/* Tabs for Requests and History */}
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Pending Requests ({filteredRequests.length})</TabsTrigger>
          <TabsTrigger value="history">Payment History ({filteredPayments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>OSM Username</TableHead>
                    <TableHead>Date Requested</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.user}</TableCell>
                      <TableCell>{request.osm_username}</TableCell>
                      <TableCell>{formatDate(request.date_requested)}</TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(request.amount_requested)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => openApproveModal(request)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectModal(request)}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No matching payment requests found" : "No pending payment requests"}
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
                    <TableHead>User</TableHead>
                    <TableHead>OSM Username</TableHead>
                    <TableHead>Date Paid</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.user}</TableCell>
                      <TableCell>{payment.osm_username}</TableCell>
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
                  {filteredPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No matching payments found" : "No payment history"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedRequest(null);
        }}
        title="Approve Payment"
        description={`Approve payment request of ${formatCurrency(selectedRequest?.amount_requested ?? 0)} for ${selectedRequest?.user}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApprove} isLoading={processing}>
              Approve Payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>User:</strong> {selectedRequest?.user}
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>OSM Username:</strong> {selectedRequest?.osm_username}
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Amount:</strong> {formatCurrency(selectedRequest?.amount_requested ?? 0)}
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Date Requested:</strong> {selectedRequest ? formatDate(selectedRequest.date_requested) : "-"}
            </p>
          </div>
          <Input
            label="Notes (optional)"
            placeholder="Add notes about this payment..."
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
          />
        </div>
      </Modal>

      {/* Reject Confirmation */}
      <ConfirmDialog
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedRequest(null);
        }}
        onConfirm={handleReject}
        title="Reject Payment Request"
        message={`Are you sure you want to reject the payment request of ${formatCurrency(selectedRequest?.amount_requested ?? 0)} from ${selectedRequest?.user}? This action will mark the request as rejected.`}
        confirmText="Reject"
        variant="destructive"
        isLoading={processing}
      />
    </div>
  );
}
