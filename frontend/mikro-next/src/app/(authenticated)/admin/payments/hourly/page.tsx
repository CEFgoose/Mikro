"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Modal,
  Input,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Skeleton,
} from "@/components/ui";
import { useToastActions, Val } from "@/components/ui";
import {
  useHourlySummary,
  useSetHourlyRate,
  useMarkHourlyPaid,
  useUsersList,
} from "@/hooks";
import { formatCurrency } from "@/lib/utils";
import type { HourlyContractor, HourlyMonthData } from "@/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function HourlyContractorPaymentsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { data, loading, refetch } = useHourlySummary();
  const { mutate: setHourlyRate, loading: settingRate } = useSetHourlyRate();
  const { mutate: markPaid, loading: markingPaid } = useMarkHourlyPaid();
  const toast = useToastActions();

  // Add contractor modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [addRate, setAddRate] = useState("");
  const { data: usersData } = useUsersList();

  // Pagination
  const ROWS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Inline rate editing
  const [editingRateUserId, setEditingRateUserId] = useState<string | null>(null);
  const [editingRateValue, setEditingRateValue] = useState("");

  // Fetch data on mount and year change
  useEffect(() => {
    refetch({ year: selectedYear });
  }, [selectedYear, refetch]);

  const contractors: HourlyContractor[] = useMemo(
    () => data?.contractors ?? [],
    [data?.contractors]
  );

  // Summary stats
  const totalContractors = contractors.length;
  const totalHours = useMemo(
    () => contractors.reduce((sum, c) => sum + c.yearTotal.hours, 0),
    [contractors]
  );
  const totalEarnings = useMemo(
    () => contractors.reduce((sum, c) => sum + c.yearTotal.earnings, 0),
    [contractors]
  );
  const totalPaidAmount = useMemo(() => {
    let paid = 0;
    for (const c of contractors) {
      for (const monthData of Object.values(c.months)) {
        if (monthData.paid) {
          paid += monthData.earnings;
        }
      }
    }
    return paid;
  }, [contractors]);

  const handleTogglePaid = async (userId: string, monthKey: string, currentPaid: boolean) => {
    try {
      await markPaid({ userId, year: selectedYear, month: monthKey, paid: !currentPaid });
      toast.success(!currentPaid ? "Marked as paid" : "Marked as unpaid");
      refetch({ year: selectedYear });
    } catch {
      toast.error("Failed to update payment status");
    }
  };

  const handleSaveRate = async (userId: string) => {
    const rate = parseFloat(editingRateValue);
    if (isNaN(rate) || rate < 0) {
      toast.error("Please enter a valid rate");
      return;
    }
    try {
      await setHourlyRate({ userId, hourlyRate: rate });
      toast.success("Hourly rate updated");
      setEditingRateUserId(null);
      refetch({ year: selectedYear });
    } catch {
      toast.error("Failed to update hourly rate");
    }
  };

  const handleAddContractor = async () => {
    if (!addUserId || !addRate) {
      toast.error("Please select a user and enter a rate");
      return;
    }
    const rate = parseFloat(addRate);
    if (isNaN(rate) || rate < 0) {
      toast.error("Please enter a valid rate");
      return;
    }
    try {
      await setHourlyRate({ userId: addUserId, hourlyRate: rate });
      toast.success("Contractor added");
      setShowAddModal(false);
      setAddUserId("");
      setAddRate("");
      refetch({ year: selectedYear });
    } catch {
      toast.error("Failed to add contractor");
    }
  };

  const getMonthData = (contractor: HourlyContractor, monthIndex: number): HourlyMonthData => {
    const key = String(monthIndex + 1);
    return contractor.months[key] ?? {
      totalSeconds: 0,
      hours: 0,
      earnings: 0,
      paid: false,
      paidAt: null,
      notes: null,
    };
  };

  // Sticky column widths for cumulative left offsets
  const colWidths = [160, 140, 100, 90]; // Name, OSM, Country, Rate
  const stickyLeftOffsets = colWidths.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + colWidths[i - 1]);
    return acc;
  }, []);

  const userOptions = useMemo(() => {
    const users = usersData?.users ?? [];
    return users.map((u) => ({
      value: u.id,
      label: `${u.name} (${u.osm_username || "no OSM"})`,
    }));
  }, [usersData?.users]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/payments" className="text-muted-foreground hover:text-foreground text-sm">
              Payments
            </Link>
            <span className="text-muted-foreground text-sm">/</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Hourly Contractor Payments</h1>
          <p className="text-muted-foreground">
            Track and manage monthly payments for hourly contractors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAddModal(true)}>
            Add Contractor
          </Button>
        </div>
      </div>

      {/* Year Selector */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedYear((y) => y - 1)}
        >
          &larr;
        </Button>
        <span className="text-xl font-semibold tabular-nums">{selectedYear}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedYear((y) => y + 1)}
        >
          &rarr;
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Contractors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContractors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours ({selectedYear})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings ({selectedYear})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Val>{formatCurrency(totalEarnings)}</Val>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <Val>{formatCurrency(totalPaidAmount)}</Val>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {contractors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">No hourly contractors found for {selectedYear}.</p>
            <p className="text-muted-foreground text-sm mt-1">
              Click &quot;Add Contractor&quot; to set up an hourly rate for a user.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="bg-background z-20 whitespace-nowrap"
                      style={{ position: "sticky", left: stickyLeftOffsets[0], minWidth: colWidths[0] }}
                    >
                      Name
                    </TableHead>
                    <TableHead
                      className="bg-background z-20 whitespace-nowrap"
                      style={{ position: "sticky", left: stickyLeftOffsets[1], minWidth: colWidths[1] }}
                    >
                      OSM Username
                    </TableHead>
                    <TableHead
                      className="bg-background z-20 whitespace-nowrap"
                      style={{ position: "sticky", left: stickyLeftOffsets[2], minWidth: colWidths[2] }}
                    >
                      Country
                    </TableHead>
                    <TableHead
                      className="bg-background z-20 whitespace-nowrap"
                      style={{ position: "sticky", left: stickyLeftOffsets[3], minWidth: colWidths[3] }}
                    >
                      Rate
                    </TableHead>
                    {MONTHS.map((m) => (
                      <TableHead key={m} className="text-center whitespace-nowrap min-w-[90px]">
                        {m}
                      </TableHead>
                    ))}
                    <TableHead className="text-center whitespace-nowrap min-w-[100px] font-bold">
                      Year Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractors.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE).map((contractor) => (
                    <TableRow key={contractor.userId}>
                      {/* Name */}
                      <TableCell
                        className="bg-background z-10 font-medium whitespace-nowrap"
                        style={{ position: "sticky", left: stickyLeftOffsets[0], minWidth: colWidths[0] }}
                      >
                        {contractor.name}
                      </TableCell>
                      {/* OSM Username */}
                      <TableCell
                        className="bg-background z-10 whitespace-nowrap"
                        style={{ position: "sticky", left: stickyLeftOffsets[1], minWidth: colWidths[1] }}
                      >
                        {contractor.osmUsername}
                      </TableCell>
                      {/* Country */}
                      <TableCell
                        className="bg-background z-10 whitespace-nowrap"
                        style={{ position: "sticky", left: stickyLeftOffsets[2], minWidth: colWidths[2] }}
                      >
                        {contractor.country || "-"}
                      </TableCell>
                      {/* Rate (editable) */}
                      <TableCell
                        className="bg-background z-10 whitespace-nowrap"
                        style={{ position: "sticky", left: stickyLeftOffsets[3], minWidth: colWidths[3] }}
                      >
                        {editingRateUserId === contractor.userId ? (
                          <Input
                            type="number"
                            value={editingRateValue}
                            onChange={(e) => setEditingRateValue(e.target.value)}
                            onBlur={() => handleSaveRate(contractor.userId)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRate(contractor.userId);
                              if (e.key === "Escape") setEditingRateUserId(null);
                            }}
                            className="w-20 h-7 text-sm"
                            autoFocus
                            disabled={settingRate}
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:underline"
                            onDoubleClick={() => {
                              setEditingRateUserId(contractor.userId);
                              setEditingRateValue(String(contractor.hourlyRate));
                            }}
                            title="Double-click to edit"
                          >
                            <Val>{formatCurrency(contractor.hourlyRate)}</Val>/hr
                          </span>
                        )}
                      </TableCell>
                      {/* Monthly cells */}
                      {MONTHS.map((_, monthIndex) => {
                        const monthData = getMonthData(contractor, monthIndex);
                        const hasData = monthData.hours > 0 || monthData.earnings > 0;
                        return (
                          <TableCell
                            key={monthIndex}
                            className={`text-center cursor-pointer transition-colors ${
                              monthData.paid
                                ? "bg-green-100 dark:bg-green-900/30"
                                : hasData
                                  ? "hover:bg-muted/50"
                                  : ""
                            }`}
                            onClick={() => {
                              if (hasData) {
                                handleTogglePaid(contractor.userId, String(monthIndex + 1), monthData.paid);
                              }
                            }}
                            title={
                              monthData.paid
                                ? `Paid${monthData.paidAt ? ` on ${new Date(monthData.paidAt).toLocaleDateString()}` : ""} - click to unmark`
                                : hasData
                                  ? "Click to mark as paid"
                                  : "No hours logged"
                            }
                          >
                            {hasData ? (
                              <div className="text-xs">
                                <div>{monthData.hours.toFixed(1)}h</div>
                                <div className="text-muted-foreground">
                                  {formatCurrency(monthData.earnings).text}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                      {/* Year Total */}
                      <TableCell className="text-center font-semibold">
                        <div className="text-xs">
                          <div>{contractor.yearTotal.hours.toFixed(1)}h</div>
                          <div className="text-muted-foreground">
                            {formatCurrency(contractor.yearTotal.earnings).text}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {contractors.length > ROWS_PER_PAGE && (
              <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
                <span>Showing {(currentPage - 1) * ROWS_PER_PAGE + 1}-{Math.min(currentPage * ROWS_PER_PAGE, contractors.length)} of {contractors.length}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
                  <span className="flex items-center px-2">Page {currentPage} of {Math.ceil(contractors.length / ROWS_PER_PAGE)}</span>
                  <Button variant="outline" size="sm" disabled={currentPage === Math.ceil(contractors.length / ROWS_PER_PAGE)}
                    onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Contractor Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setAddUserId("");
          setAddRate("");
        }}
        title="Add Hourly Contractor"
        description="Select a user and set their hourly rate."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setAddUserId("");
                setAddRate("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddContractor} disabled={settingRate || !addUserId || !addRate}>
              {settingRate ? "Saving..." : "Add Contractor"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">User</label>
            <Select
              value={addUserId}
              onChange={(val) => setAddUserId(val)}
              options={userOptions}
              placeholder="Select a user..."
              searchable
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Hourly Rate (USD)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={addRate}
              onChange={(e) => setAddRate(e.target.value)}
              placeholder="e.g. 15.00"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
