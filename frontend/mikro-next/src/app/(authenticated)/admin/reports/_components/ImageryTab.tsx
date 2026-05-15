"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Val } from "@/components/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/lib/utils";
import { ChartExportButton } from "@/components/admin/ChartExportButton";
import { TableExportButton } from "@/components/admin/TableExportButton";
import type { MapillaryStatsResponse } from "@/types";
import { chartNumberFmt, chartTooltipFmt, ROWS_PER_PAGE } from "./reportUtils";

interface ImageryTabProps {
  data: MapillaryStatsResponse | null;
  loading: boolean;
}

export function ImageryTab({ data, loading }: ImageryTabProps) {
  const [tripsPage, setTripsPage] = useState(1);
  const imageryWeeklyUploadsRef = useRef<HTMLDivElement>(null);
  const imageryByContributorRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">Loading Mapillary data...</span>
      </div>
    );
  }

  if (!data || data.summary.total_images === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 text-lg">No Mapillary data available</p>
          <p className="text-gray-400 text-sm mt-2">
            {data?.message ||
              "Link Mapillary usernames to users in their profile to start tracking imagery uploads."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Images</p>
            <p className="text-3xl font-bold">
              <Val>{formatNumber(data.summary.total_images)}</Val>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Trips</p>
            <p className="text-3xl font-bold">
              <Val>{formatNumber(data.summary.total_trips)}</Val>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Active Contributors</p>
            <p className="text-3xl font-bold">
              <Val>{formatNumber(data.summary.active_contributors)}</Val>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Sequences</p>
            <p className="text-3xl font-bold">
              <Val>{formatNumber(data.summary.total_sequences)}</Val>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Uploads Chart */}
      {data.weekly_uploads.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Weekly Image Uploads</CardTitle>
            <ChartExportButton
              containerRef={imageryWeeklyUploadsRef}
              filename="imagery-weekly-uploads"
            />
          </CardHeader>
          <CardContent>
            <div ref={imageryWeeklyUploadsRef} style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={data.weekly_uploads}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis tickFormatter={chartNumberFmt} />
                  <Tooltip formatter={chartTooltipFmt} />
                  <Bar dataKey="images" fill="#10b981" name="Images" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images by User Chart */}
      {data.summary.images_by_user.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Images by Contributor</CardTitle>
            <ChartExportButton
              containerRef={imageryByContributorRef}
              filename="imagery-by-contributor"
            />
          </CardHeader>
          <CardContent>
            <div
              ref={imageryByContributorRef}
              style={{ width: "100%", height: Math.max(200, data.summary.images_by_user.length * 40) }}
            >
              <ResponsiveContainer>
                <BarChart data={data.summary.images_by_user} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={chartNumberFmt} />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip formatter={chartTooltipFmt} />
                  <Bar dataKey="count" fill="#6366f1" name="Images" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trips Table */}
      {data.trips.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Capture Trips</CardTitle>
            <TableExportButton
              rows={data.trips as unknown as Array<Record<string, unknown>>}
              columns={[
                { key: "user_name", label: "User" },
                { key: "mapillary_username", label: "Mapillary Username" },
                { key: "date", label: "Date" },
                { key: "image_count", label: "Images" },
                { key: "sequence_count", label: "Sequences" },
              ]}
              filename="imagery-capture-trips"
            />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-gray-600">User</th>
                    <th className="pb-2 font-medium text-gray-600">Mapillary Username</th>
                    <th className="pb-2 font-medium text-gray-600">Date</th>
                    <th className="pb-2 font-medium text-gray-600 text-right">Images</th>
                    <th className="pb-2 font-medium text-gray-600 text-right">Sequences</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trips
                    .slice((tripsPage - 1) * ROWS_PER_PAGE, tripsPage * ROWS_PER_PAGE)
                    .map((trip, i) => (
                      <tr
                        key={`${trip.mapillary_username}-${trip.date}-${i}`}
                        className="border-b last:border-0"
                      >
                        <td className="py-2">{trip.user_name}</td>
                        <td className="py-2 text-gray-500">{trip.mapillary_username}</td>
                        <td className="py-2">{trip.date}</td>
                        <td className="py-2 text-right">
                          <Val>{formatNumber(trip.image_count)}</Val>
                        </td>
                        <td className="py-2 text-right">
                          <Val>{formatNumber(trip.sequence_count)}</Val>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {data.trips.length > ROWS_PER_PAGE && (
              <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                <span>
                  Showing {(tripsPage - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(tripsPage * ROWS_PER_PAGE, data.trips.length)} of {data.trips.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={tripsPage === 1}
                    onClick={() => setTripsPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-2">
                    Page {tripsPage} of {Math.ceil(data.trips.length / ROWS_PER_PAGE)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={tripsPage === Math.ceil(data.trips.length / ROWS_PER_PAGE)}
                    onClick={() => setTripsPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
