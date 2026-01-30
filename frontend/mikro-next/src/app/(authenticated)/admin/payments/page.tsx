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
  useRejectPaymentRequest,
  useDeletePayment,
  useFetchPaymentRequestDetails,
  PaymentRequestDetailsResponse,
  PaymentRequestProjectDetail,
} from "@/hooks";
import type { PayRequest, Payment } from "@/types";

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

function generateCSV(details: PaymentRequestDetailsResponse): string {
  const lines: string[] = [];

  // Header info
  lines.push(`Payment Request Details`);
  lines.push(`User,${details.user_name}`);
  lines.push(`OSM Username,${details.osm_username}`);
  lines.push(`Date Requested,${details.date_requested}`);
  lines.push(`Amount Requested,${formatCurrency(details.amount_requested)}`);
  lines.push(`Payment Email,${details.payment_email || "N/A"}`);
  lines.push(``);

  // Summary
  lines.push(`Summary`);
  lines.push(`Total Tasks,${details.summary.total_tasks}`);
  lines.push(`Total Projects,${details.summary.total_projects}`);
  lines.push(`Mapping Earnings,${formatCurrency(details.summary.mapping_earnings)}`);
  lines.push(`Validation Earnings,${formatCurrency(details.summary.validation_earnings)}`);
  lines.push(`Total Earnings,${formatCurrency(details.summary.total_earnings)}`);
  lines.push(``);

  // Task details header
  lines.push(`Project,Task ID,Type,Mapped By,Validated By,Rate`);

  // Task details rows
  for (const project of details.projects) {
    for (const task of project.tasks) {
      const taskType = task.is_mapping_earning ? "Mapping" : task.is_validation_earning ? "Validation" : "Other";
      const rate = task.is_mapping_earning ? task.mapping_rate : task.validation_rate;
      lines.push(`"${project.project_name}",${task.task_id},${taskType},${task.mapped_by},${task.validated_by},${formatCurrency(rate)}`);
    }
  }

  return lines.join("\n");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminPaymentsPage() {
  const { data: transactions, loading, refetch } = useOrgTransactions();
  const { mutate: processPayment, loading: processing } = useProcessPaymentRequest();
  const { mutate: rejectPayment, loading: rejecting } = useRejectPaymentRequest();
  const { mutate: deletePayment, loading: deleting } = useDeletePayment();
  const { mutate: fetchDetails, loading: loadingDetails } = useFetchPaymentRequestDetails();
  const toast = useToastActions();

  const [selectedRequest, setSelectedRequest] = useState<PayRequest | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [requestDetails, setRequestDetails] = useState<PaymentRequestDetailsResponse | null>(null);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "user">("date");
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());

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

  const handleViewDetails = async (request: PayRequest) => {
    setSelectedRequest(request);
    setExpandedProjects(new Set());
    try {
      const details = await fetchDetails({ request_id: request.id });
      setRequestDetails(details);
      setShowDetailsModal(true);
    } catch {
      toast.error("Failed to fetch payment request details");
    }
  };

  const handleExportCSV = () => {
    if (!requestDetails) return;
    const csv = generateCSV(requestDetails);
    const filename = `payment-request-${requestDetails.request_id}-${requestDetails.osm_username}.csv`;
    downloadFile(csv, filename, "text/csv");
    toast.success("CSV exported successfully");
  };

  const handleExportJSON = () => {
    if (!requestDetails) return;
    const json = JSON.stringify(requestDetails, null, 2);
    const filename = `payment-request-${requestDetails.request_id}-${requestDetails.osm_username}.json`;
    downloadFile(json, filename, "application/json");
    toast.success("JSON exported successfully");
  };

  const toggleProjectExpand = (projectId: number) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    const paymentData = {
      request_id: selectedRequest.id,
      user_id: selectedRequest.user_id,
      task_ids: selectedRequest.task_ids || [],
      request_amount: selectedRequest.amount_requested,
      payoneer_id: selectedRequest.payment_email || "",
      notes: paymentNotes,
    };

    // Debug: log payment data before sending
    console.log("Approving payment with data:", paymentData);

    try {
      await processPayment(paymentData);
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
      await rejectPayment({
        transaction_id: selectedRequest.id,
        transaction_type: "request",
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

  const openDeletePaymentModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDeletePaymentModal(true);
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;

    try {
      await deletePayment({
        transaction_id: selectedPayment.id,
        transaction_type: "payment",
      });
      toast.success("Payment record deleted");
      setShowDeletePaymentModal(false);
      setSelectedPayment(null);
      refetch();
    } catch {
      toast.error("Failed to delete payment");
    }
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
                    <TableHead>Tasks</TableHead>
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
                      <TableCell>
                        <Badge variant="outline">{request.task_ids?.length || 0} tasks</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(request)}
                          >
                            Details
                          </Button>
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
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeletePaymentModal(payment)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setRequestDetails(null);
        }}
        title="Payment Request Details"
        description={`Detailed breakdown for ${requestDetails?.user_name || selectedRequest?.user}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={handleExportCSV} disabled={!requestDetails}>
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportJSON} disabled={!requestDetails}>
              Export JSON
            </Button>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowDetailsModal(false);
                if (selectedRequest) openApproveModal(selectedRequest);
              }}
            >
              Approve Payment
            </Button>
          </>
        }
      >
        {loadingDetails ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : requestDetails ? (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="rounded-lg bg-muted p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Tasks</p>
                  <p className="text-lg font-bold">{requestDetails.summary.total_tasks}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Projects</p>
                  <p className="text-lg font-bold">{requestDetails.summary.total_projects}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mapping Earnings</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(requestDetails.summary.mapping_earnings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Validation Earnings</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(requestDetails.summary.validation_earnings)}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Requested</span>
                  <span className="text-xl font-bold text-kaart-orange">
                    {formatCurrency(requestDetails.amount_requested)}
                  </span>
                </div>
              </div>
            </div>

            {/* Projects Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold">Projects Breakdown</h4>
              {requestDetails.projects.map((project: PaymentRequestProjectDetail) => (
                <div key={project.project_id} className="border rounded-lg">
                  <button
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    onClick={() => toggleProjectExpand(project.project_id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{project.project_name}</span>
                      <Badge variant="outline">{project.tasks.length} tasks</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">
                        <span className="text-green-600">{formatCurrency(project.mapping_earnings)}</span>
                        {" + "}
                        <span className="text-blue-600">{formatCurrency(project.validation_earnings)}</span>
                      </span>
                      <svg
                        className={`w-5 h-5 transition-transform ${expandedProjects.has(project.project_id) ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expandedProjects.has(project.project_id) && (
                    <div className="border-t p-4 bg-muted/30">
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Mapping Tasks:</span>{" "}
                          <span className="font-medium">{project.mapping_count}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Validation Tasks:</span>{" "}
                          <span className="font-medium">{project.validation_count}</span>
                        </div>
                      </div>
                      {project.project_url && (
                        <a
                          href={project.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-kaart-orange hover:underline mb-3 inline-block"
                        >
                          Open Project in TM4
                        </a>
                      )}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Task ID</TableHead>
                            <TableHead className="text-xs">Type</TableHead>
                            <TableHead className="text-xs">Mapped By</TableHead>
                            <TableHead className="text-xs">Validated By</TableHead>
                            <TableHead className="text-xs text-right">Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {project.tasks.map((task) => (
                            <TableRow key={task.internal_id}>
                              <TableCell className="text-sm">{task.task_id}</TableCell>
                              <TableCell>
                                {task.is_mapping_earning ? (
                                  <Badge variant="success" className="text-xs">Mapping</Badge>
                                ) : task.is_validation_earning ? (
                                  <Badge variant="default" className="text-xs">Validation</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Other</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">{task.mapped_by}</TableCell>
                              <TableCell className="text-sm">{task.validated_by || "-"}</TableCell>
                              <TableCell className="text-sm text-right font-medium">
                                {task.is_mapping_earning
                                  ? formatCurrency(task.mapping_rate)
                                  : formatCurrency(task.validation_rate)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* User Notes */}
            {requestDetails.notes && (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">User Notes:</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{requestDetails.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No details available</p>
        )}
      </Modal>

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
              <strong>Tasks:</strong> {selectedRequest?.task_ids?.length || 0} tasks
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
        message={`Are you sure you want to reject the payment request of ${formatCurrency(selectedRequest?.amount_requested ?? 0)} from ${selectedRequest?.user}? This action will delete the request.`}
        confirmText="Reject"
        variant="destructive"
        isLoading={rejecting}
      />

      {/* Delete Payment Confirmation */}
      <ConfirmDialog
        isOpen={showDeletePaymentModal}
        onClose={() => {
          setShowDeletePaymentModal(false);
          setSelectedPayment(null);
        }}
        onConfirm={handleDeletePayment}
        title="Delete Payment Record"
        message={`Are you sure you want to permanently delete the payment record of ${formatCurrency(selectedPayment?.amount_paid ?? 0)} for ${selectedPayment?.user}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        isLoading={deleting}
      />
    </div>
  );
}
