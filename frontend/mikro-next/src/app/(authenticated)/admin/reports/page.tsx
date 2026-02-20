"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import {
  useFetchEditingStats,
  useFetchTimekeepingStats,
  useFetchFilterOptions,
  useFetchChangesetHeatmap,
} from "@/hooks/useApi";
import { useFilters } from "@/hooks";
import { FilterBar } from "@/components/filters";
import type {
  EditingStatsResponse,
  TimekeepingStatsResponse,
  ChangesetHeatmapResponse,
} from "@/types";
import {
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import dynamic from "next/dynamic";

const MappingHeatmap = dynamic(() => import("@/components/MappingHeatmap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-muted rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </div>
  ),
});

// ─── Color Constants ─────────────────────────────────────────

const COLORS = {
  mapped: "#f97316",
  validated: "#3b82f6",
  invalidated: "#ef4444",
  hours: "#10b981",
  review: "#6366f1",
  training: "#f59e0b",
  other: "#9ca3af",
  deleted: "#ef4444",
  added: "#f97316",
  modified: "#3b82f6",
};

const CATEGORY_COLORS: Record<string, string> = {
  mapping: "#f97316",
  "editing / osm": "#f97316",
  validation: "#3b82f6",
  "kaart qc": "#3b82f6",
  review: "#6366f1",
  management: "#8b5cf6",
  training: "#f59e0b",
  "kaart training / meetings": "#f59e0b",
  "project creation / team planning": "#06b6d4",
  "community outreach - general": "#10b981",
  "community qc": "#14b8a6",
  "community events / trainings / meetings": "#a855f7",
  "wiki / osm documentation": "#ec4899",
  "imagery capture": "#64748b",
  other: "#9ca3af",
};

const WEEKLY_TASK_COLORS = [
  "#8b5cf6", // Management
  "#f59e0b", // Kaart Training / Meetings
  "#3b82f6", // Kaart QC
  "#64748b", // Imagery Capture
  "#06b6d4", // Project Creation / Team Planning
  "#14b8a6", // Community QC
  "#ec4899", // Wiki / OSM Documentation
  "#a855f7", // Community Events / Trainings / Meetings
  "#10b981", // Community Outreach - General
];

const COMMUNITY_OUTREACH_COLORS = {
  "Wiki / OSM Documentation": "#ec4899",
  "Community QC": "#14b8a6",
  "Community Events / Trainings / Meetings": "#a855f7",
  "Community Outreach - General": "#10b981",
};

// ─── Mock Data (charts requiring Kibana / external sources) ──

const MOCK_ACTIVITY_ELEMENT_TYPES = [
  {
    title: "Oneways",
    data: [
      { week: "1/19", deleted: 107, added: 147, modified: 107 },
      { week: "1/26", deleted: 0, added: 0, modified: 65 },
      { week: "2/2", deleted: 0, added: 0, modified: 0 },
      { week: "2/9", deleted: 0, added: 0, modified: 0 },
    ],
  },
  {
    title: "Access & Barriers",
    data: [
      { week: "1/19", deleted: 800, added: 1200, modified: 0 },
      { week: "1/26", deleted: 0, added: 0, modified: 0 },
      { week: "2/2", deleted: 684, added: 0, modified: 510 },
      { week: "2/9", deleted: 0, added: 0, modified: 0 },
    ],
  },
  {
    title: "Highways",
    data: [
      { week: "1/19", deleted: 4613, added: 0, modified: 7543 },
      { week: "1/26", deleted: 0, added: 1359, modified: 6397 },
      { week: "2/2", deleted: 0, added: 0, modified: 0 },
      { week: "2/9", deleted: 0, added: 0, modified: 0 },
    ],
  },
  {
    title: "Refs",
    data: [
      { week: "1/19", deleted: 0, added: 300, modified: 0 },
      { week: "1/26", deleted: 0, added: 149, modified: 148 },
      { week: "2/2", deleted: 0, added: 0, modified: 0 },
      { week: "2/9", deleted: 0, added: 0, modified: 0 },
    ],
  },
  {
    title: "Turn Restrictions",
    data: [
      { week: "1/19", deleted: 0, added: 11, modified: 0 },
      { week: "1/26", deleted: 0, added: 0, modified: 1 },
      { week: "2/2", deleted: 1, added: 0, modified: 0 },
      { week: "2/9", deleted: 0, added: 0, modified: 0 },
    ],
  },
  {
    title: "Names",
    data: [
      { week: "1/19", deleted: 0, added: 1326, modified: 1260 },
      { week: "1/26", deleted: 0, added: 0, modified: 0 },
      { week: "2/2", deleted: 0, added: 0, modified: 1040 },
      { week: "2/9", deleted: 0, added: 0, modified: 0 },
    ],
  },
  {
    title: "Construction",
    data: [
      { week: "1/19", deleted: 27, added: 0, modified: 0 },
      { week: "1/26", deleted: 0, added: 16, modified: 0 },
      { week: "2/2", deleted: 5, added: 0, modified: 6 },
      { week: "2/9", deleted: 0, added: 0, modified: 0 },
    ],
  },
  {
    title: "Classifications",
    data: [
      { week: "1/19", deleted: 0, added: 867, modified: 0 },
      { week: "1/26", deleted: 0, added: 750, modified: 0 },
      { week: "2/2", deleted: 0, added: 0, modified: 249 },
      { week: "2/9", deleted: 0, added: 0, modified: 0 },
    ],
  },
];

const MOCK_COMMUNITY_EVENTS = [
  {
    id: 1,
    title: "Local Govt Mapping - Pesolis Renesta Pessidos Pestled",
    categories: ["Discussion", "OSM Community"],
    summary:
      "Discussed government mapping priorities with local officials. Focused on road network and administrative boundary improvements.",
    participants: { new: 4, return: 3, key: 2, total: 9 },
  },
  {
    id: 2,
    title: "Nentanga Group Makdedirps - Rafai Overt Reduce All Environments",
    categories: ["Event", "University"],
    summary:
      "University outreach event introducing OSM to geography students. Hands-on mapping session with tutorial walkthrough.",
    participants: { new: 8, return: 5, key: 1, total: 14 },
  },
  {
    id: 3,
    title: "Pessint bor Aggressive TTracking",
    categories: ["1:1 Interaction", "New User"],
    summary:
      "One-on-one onboarding session with new community mapper. Covered JOSM setup and basic editing workflow.",
    participants: { new: 1, return: 0, key: 0, total: 1 },
  },
];

const MOCK_OVERWRITES = [
  {
    id: 1,
    title: "Local Govt Mapping - Pesolis Renesta Pessidos Pestled",
    link: "#",
  },
];

const MOCK_WEEKLY_TASK_HOURS = [
  {
    week: "1/19",
    Management: 50,
    "Kaart Training / Meetings": 120,
    "Kaart QC": 80,
    "Imagery Capture": 30,
    "Project Creation / Team Planning": 60,
    "Community QC": 40,
    "Wiki / OSM Documentation": 20,
    "Community Events / Trainings / Meetings": 350,
    "Community Outreach - General": 250,
  },
  {
    week: "1/26",
    Management: 60,
    "Kaart Training / Meetings": 100,
    "Kaart QC": 90,
    "Imagery Capture": 25,
    "Project Creation / Team Planning": 50,
    "Community QC": 35,
    "Wiki / OSM Documentation": 15,
    "Community Events / Trainings / Meetings": 400,
    "Community Outreach - General": 225,
  },
  {
    week: "2/2",
    Management: 55,
    "Kaart Training / Meetings": 130,
    "Kaart QC": 70,
    "Imagery Capture": 35,
    "Project Creation / Team Planning": 45,
    "Community QC": 50,
    "Wiki / OSM Documentation": 25,
    "Community Events / Trainings / Meetings": 500,
    "Community Outreach - General": 290,
  },
  {
    week: "2/9",
    Management: 45,
    "Kaart Training / Meetings": 110,
    "Kaart QC": 85,
    "Imagery Capture": 20,
    "Project Creation / Team Planning": 55,
    "Community QC": 45,
    "Wiki / OSM Documentation": 30,
    "Community Events / Trainings / Meetings": 375,
    "Community Outreach - General": 235,
  },
];

const WEEKLY_TASK_CATEGORIES = [
  "Management",
  "Kaart Training / Meetings",
  "Kaart QC",
  "Imagery Capture",
  "Project Creation / Team Planning",
  "Community QC",
  "Wiki / OSM Documentation",
  "Community Events / Trainings / Meetings",
  "Community Outreach - General",
];

const MOCK_COMMUNITY_OUTREACH = [
  {
    week: "1/19",
    "Wiki / OSM Documentation": 20,
    "Community QC": 40,
    "Community Events / Trainings / Meetings": 120,
    "Community Outreach - General": 231,
    newParticipants: 15,
    returnParticipants: 10,
  },
  {
    week: "1/26",
    "Wiki / OSM Documentation": 15,
    "Community QC": 35,
    "Community Events / Trainings / Meetings": 166,
    "Community Outreach - General": 244,
    newParticipants: 20,
    returnParticipants: 12,
  },
  {
    week: "2/2",
    "Wiki / OSM Documentation": 25,
    "Community QC": 50,
    "Community Events / Trainings / Meetings": 140,
    "Community Outreach - General": 177,
    newParticipants: 18,
    returnParticipants: 15,
  },
  {
    week: "2/9",
    "Wiki / OSM Documentation": 30,
    "Community QC": 45,
    "Community Events / Trainings / Meetings": 150,
    "Community Outreach - General": 200,
    newParticipants: 22,
    returnParticipants: 14,
  },
];

// ─── Helper Components ───────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  compareValue,
}: {
  label: string;
  value: string | number;
  sub?: string;
  compareValue?: number | null;
}) {
  const numValue = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
  const delta =
    compareValue != null && compareValue > 0
      ? ((numValue - compareValue) / compareValue) * 100
      : null;

  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {delta != null && (
          <p
            className={`text-xs font-medium mt-1 ${delta >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {delta >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(delta).toFixed(1)}%
            <span className="text-muted-foreground font-normal ml-1">
              vs prior
            </span>
          </p>
        )}
        {sub && (
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
    </div>
  );
}

function CategoryBadge({ label }: { label: string }) {
  const colorMap: Record<string, string> = {
    Discussion: "bg-blue-600",
    "OSM Community": "bg-green-600",
    Event: "bg-purple-600",
    University: "bg-indigo-600",
    "1:1 Interaction": "bg-orange-600",
    "New User": "bg-teal-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${colorMap[label] || "bg-gray-600"}`}
    >
      {label}
    </span>
  );
}

function MiniActivityChart({
  title,
  data,
}: {
  title: string;
  data: { week: string; deleted: number; added: number; modified: number }[];
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs font-semibold text-foreground mb-2">
          Team Activity: {title}
        </p>
        <div style={{ width: "100%", height: 140 }}>
          <ResponsiveContainer>
            <BarChart data={data} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} width={35} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend
                wrapperStyle={{ fontSize: 9 }}
                iconSize={8}
              />
              <Bar
                dataKey="deleted"
                name="Deleted"
                fill={COLORS.deleted}
                stackId="a"
              />
              <Bar
                dataKey="added"
                name="Added"
                fill={COLORS.added}
                stackId="a"
              />
              <Bar
                dataKey="modified"
                name="Modified"
                fill={COLORS.modified}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function getProjectStatus(proj: {
  percent_mapped: number;
  percent_validated: number;
  status: boolean;
}): { label: string; className: string } {
  if (proj.percent_mapped >= 95 && proj.percent_validated >= 90)
    return {
      label: "Complete",
      className: "bg-green-100 text-green-800",
    };
  if (!proj.status)
    return {
      label: "Inactive",
      className: "bg-muted text-muted-foreground",
    };
  if (proj.percent_mapped < 15)
    return {
      label: "Stagnant",
      className: "bg-yellow-100 text-yellow-800",
    };
  return {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800",
  };
}

// ─── Helper Functions ────────────────────────────────────────

function getDateRange(preset: "daily" | "weekly" | "monthly"): {
  start: string;
  end: string;
} {
  const now = new Date();
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  let start: string;
  switch (preset) {
    case "daily":
      start = end;
      break;
    case "weekly": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      break;
    }
    case "monthly": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      break;
    }
  }
  return { start, end };
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Main Page Component ─────────────────────────────────────

export default function AdminReportsPage() {
  const router = useRouter();

  // ── State ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("editing");
  const [datePreset, setDatePreset] = useState<
    "daily" | "weekly" | "monthly" | "custom"
  >("monthly");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [snapshotTime, setSnapshotTime] = useState<string | null>(null);
  const [editingData, setEditingData] =
    useState<EditingStatsResponse | null>(null);
  const [timekeepingData, setTimekeepingData] =
    useState<TimekeepingStatsResponse | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(
    new Set()
  );
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(
    new Set()
  );
  const [heatmapPoints, setHeatmapPoints] = useState<[number, number, number][]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapSummary, setHeatmapSummary] = useState<{ totalChangesets: number; totalChanges: number; usersWithData: number } | null>(null);

  // ── Hooks ────────────────────────────────────────────────
  const {
    mutate: fetchEditing,
    loading: editingLoading,
    error: editingError,
  } = useFetchEditingStats();
  const {
    mutate: fetchTimekeeping,
    loading: timekeepingLoading,
    error: timekeepingError,
  } = useFetchTimekeepingStats();
  const { activeFilters, setActiveFilters, filtersBody, clearFilters } = useFilters();
  const { data: filterOptions, loading: filterOptionsLoading } = useFetchFilterOptions();
  const { mutate: fetchHeatmap } = useFetchChangesetHeatmap();

  // ── Data Fetching ────────────────────────────────────────
  const fetchData = useCallback(async () => {
    let startDate: string, endDate: string;
    if (datePreset === "custom") {
      if (!customStart || !customEnd) return;
      startDate = customStart;
      endDate = customEnd;
    } else {
      const range = getDateRange(datePreset);
      startDate = range.start;
      endDate = range.end;
    }

    const params: Record<string, unknown> = {
      startDate,
      endDate,
      filters: filtersBody,
    };

    // Add comparison period if enabled
    if (compareEnabled) {
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T00:00:00");
      const oneDay = 86400000;
      const periodMs = Math.max(end.getTime() - start.getTime(), oneDay);
      const compareEnd = new Date(start.getTime());
      const compareStart = new Date(start.getTime() - periodMs);
      const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      params.compareStartDate = fmtDate(compareStart);
      params.compareEndDate = fmtDate(compareEnd);
    }

    try {
      if (activeTab === "editing") {
        const res = await fetchEditing(params);
        if (res?.status === 200) {
          setEditingData(res);
          setSnapshotTime(res.snapshot_timestamp);
        }

        // Fetch heatmap data (non-blocking — runs alongside editing stats)
        setHeatmapLoading(true);
        fetchHeatmap(params)
          .then((heatRes) => {
            if (heatRes?.status === 200) {
              setHeatmapPoints(heatRes.heatmapPoints || []);
              setHeatmapSummary(heatRes.summary || null);
            }
          })
          .catch(() => {
            // Heatmap failure shouldn't affect editing stats
          })
          .finally(() => setHeatmapLoading(false));
      } else if (activeTab === "timekeeping") {
        const res = await fetchTimekeeping(params);
        if (res?.status === 200) {
          setTimekeepingData(res);
          setSnapshotTime(res.snapshot_timestamp);
        }
      }
    } catch {
      // API errors are handled by the hook's error state
    }
  }, [
    datePreset,
    customStart,
    customEnd,
    filtersBody,
    compareEnabled,
    activeTab,
    fetchEditing,
    fetchTimekeeping,
    fetchHeatmap,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Computed: editing donut ──────────────────────────────
  const overallProgress = editingData
    ? (() => {
        const totalTasks = editingData.projects.reduce(
          (s, p) => s + p.total_tasks,
          0
        );
        const totalMapped = editingData.projects.reduce(
          (s, p) => s + p.tasks_mapped,
          0
        );
        const pct = totalTasks > 0 ? Math.round((totalMapped / totalTasks) * 100) : 0;
        return { totalTasks, totalMapped, pct };
      })()
    : null;

  const donutData = overallProgress
    ? [
        { name: "Completed", value: overallProgress.pct },
        { name: "Remaining", value: 100 - overallProgress.pct },
      ]
    : [];

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Organization-wide analytics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          {snapshotTime && (
            <span className="text-xs text-muted-foreground">
              Snapshot: {formatDateTime(snapshotTime)}
            </span>
          )}
          <button
            onClick={() => fetchData()}
            disabled={editingLoading || timekeepingLoading}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-kaart-orange text-white text-sm font-medium hover:bg-kaart-orange-dark transition-colors disabled:opacity-50"
          >
            {editingLoading || timekeepingLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {/* CONTROLS ROW */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Date range picker */}
            <div className="flex items-center gap-2">
              {(["daily", "weekly", "monthly", "custom"] as const).map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => setDatePreset(preset)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      datePreset === preset
                        ? "bg-kaart-orange text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </button>
                )
              )}
            </div>

            {datePreset === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 border border-input rounded-lg text-sm"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 border border-input rounded-lg text-sm"
                />
              </div>
            )}

            {/* Compare toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompareEnabled((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  compareEnabled
                    ? "bg-blue-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {compareEnabled ? "Compare ON" : "Compare"}
              </button>
              {compareEnabled && (() => {
                let s: string, e: string;
                if (datePreset === "custom") {
                  s = customStart; e = customEnd;
                } else {
                  const r = getDateRange(datePreset);
                  s = r.start; e = r.end;
                }
                const start = new Date(s + "T00:00:00");
                const end = new Date(e + "T00:00:00");
                const oneDay = 86400000;
                const periodMs = Math.max(end.getTime() - start.getTime(), oneDay);
                const cEnd = new Date(start.getTime());
                const cStart = new Date(start.getTime() - periodMs);
                const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const sameDay = periodMs <= oneDay;
                return (
                  <span className="text-xs text-muted-foreground">
                    {sameDay ? fmt(start) : `${fmt(start)} – ${fmt(end)}`}
                    {" vs "}
                    {sameDay ? fmt(cStart) : `${fmt(cStart)} – ${fmt(cEnd)}`}
                  </span>
                );
              })()}
            </div>

            {/* Universal FilterBar */}
            <div className="ml-auto">
              <FilterBar
                dimensions={filterOptions?.dimensions ? Object.entries(filterOptions.dimensions).map(([key, values]) => ({
                  key,
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                  options: Array.isArray(values)
                    ? values.map((v) =>
                        typeof v === 'string'
                          ? { value: v, label: v }
                          : { value: String(v.id ?? v.value ?? v.name), label: v.name }
                      )
                    : [],
                })) : []}
                activeFilters={activeFilters}
                onChange={setActiveFilters}
                loading={filterOptionsLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABS */}
      <Tabs
        defaultValue="editing"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="editing">Editing</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="timekeeping">Timekeeping</TabsTrigger>
        </TabsList>

        {/* ═══════ EDITING TAB ═══════ */}
        <TabsContent value="editing">
          {editingLoading && !editingData ? (
            <LoadingSpinner />
          ) : editingError ? (
            <Card>
              <CardContent className="p-8 text-center text-red-500">
                Failed to load editing stats: {editingError}
              </CardContent>
            </Card>
          ) : editingData ? (
            <div className="space-y-6">
              {/* ── Hero Row: Donut + Heatmap + Changeset Totals ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Project Progress Donut */}
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-base">
                      Project Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div style={{ width: 180, height: 180, position: "relative" }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            <Cell fill={COLORS.mapped} />
                            <Cell fill="#e5e7eb" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-foreground">
                          {overallProgress?.pct ?? 0}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Completed
                        </span>
                      </div>
                    </div>
                    <div className="text-center mt-2 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {overallProgress?.totalMapped.toLocaleString()} /{" "}
                        {overallProgress?.totalTasks.toLocaleString()} tasks
                      </p>
                      <p className="text-sm font-medium">
                        {editingData.summary.active_projects} active projects
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Map of changeset centroids
                      </CardTitle>
                      {heatmapSummary && !heatmapLoading && (
                        <span className="text-xs text-muted-foreground">
                          {heatmapSummary.usersWithData} users &middot;{" "}
                          {heatmapSummary.totalChangesets.toLocaleString()} changesets
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {heatmapLoading ? (
                      <div className="w-full h-48 flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kaart-orange" />
                        <span className="text-sm text-muted-foreground">
                          Fetching changesets from OSM...
                        </span>
                      </div>
                    ) : (
                      <MappingHeatmap points={heatmapPoints} height="200px" />
                    )}
                  </CardContent>
                </Card>

                {/* Changeset Totals */}
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-base">
                      Changeset totals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed mt-2">
                      During this time period, a total of{" "}
                      <span className="font-bold text-foreground">
                        {editingData.summary.total_mapped.toLocaleString()}
                      </span>{" "}
                      tasks were mapped across{" "}
                      <span className="font-bold text-foreground">
                        {editingData.summary.active_projects}
                      </span>{" "}
                      active projects, with{" "}
                      <span className="font-bold text-foreground">
                        {editingData.summary.total_validated.toLocaleString()}
                      </span>{" "}
                      tasks validated and{" "}
                      <span className="font-bold text-foreground">
                        {editingData.summary.total_invalidated.toLocaleString()}
                      </span>{" "}
                      invalidated.
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-foreground">
                          {editingData.summary.total_mapped.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tasks Mapped
                        </p>
                        {editingData.comparison?.summary && (() => {
                          const prev = editingData.comparison.summary.total_mapped;
                          const curr = editingData.summary.total_mapped;
                          const delta = prev > 0 ? ((curr - prev) / prev) * 100 : null;
                          return delta != null ? (
                            <p className={`text-xs font-medium mt-1 ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {delta >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(delta).toFixed(1)}%
                            </p>
                          ) : null;
                        })()}
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-foreground">
                          {editingData.summary.total_validated.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Validated
                        </p>
                        {editingData.comparison?.summary && (() => {
                          const prev = editingData.comparison.summary.total_validated;
                          const curr = editingData.summary.total_validated;
                          const delta = prev > 0 ? ((curr - prev) / prev) * 100 : null;
                          return delta != null ? (
                            <p className={`text-xs font-medium mt-1 ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {delta >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(delta).toFixed(1)}%
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tasks Over Time Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Tasks Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {editingData.tasks_over_time.length > 0 ? (
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={editingData.tasks_over_time}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="week"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v: string) =>
                              new Date(
                                v + "T00:00:00"
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            }
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            labelFormatter={(v) =>
                              new Date(
                                String(v) + "T00:00:00"
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            }
                          />
                          <Legend />
                          <Bar
                            dataKey="mapped"
                            name="Mapped"
                            fill={COLORS.mapped}
                          />
                          <Bar
                            dataKey="validated"
                            name="Validated"
                            fill={COLORS.validated}
                          />
                          <Bar
                            dataKey="invalidated"
                            name="Invalidated"
                            fill={COLORS.invalidated}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No task data for this period.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Detailed Project Table */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Detailed Project Table (
                    {editingData.projects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Project Name
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Progress
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            % Validated
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Time per Task
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Map Rate
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Val Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {editingData.projects.map((proj) => {
                          const status = getProjectStatus(proj);
                          return (
                            <tr key={proj.id}>
                              <td className="px-6 py-4">
                                {proj.url ? (
                                  <a
                                    href={proj.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-kaart-orange hover:underline"
                                  >
                                    {proj.name}
                                  </a>
                                ) : (
                                  <span className="font-medium text-foreground">
                                    {proj.name}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                                >
                                  {status.label}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex-1 h-2 bg-muted rounded-full overflow-hidden"
                                    style={{ minWidth: 80 }}
                                  >
                                    <div
                                      className="h-full bg-kaart-orange rounded-full transition-all"
                                      style={{
                                        width: `${Math.min(proj.percent_mapped, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-10 text-right">
                                    {proj.percent_mapped}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex-1 h-2 bg-muted rounded-full overflow-hidden"
                                    style={{ minWidth: 60 }}
                                  >
                                    <div
                                      className="h-full bg-blue-500 rounded-full transition-all"
                                      style={{
                                        width: `${Math.min(proj.percent_validated, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-10 text-right">
                                    {proj.percent_validated}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-muted-foreground">
                                \u2014
                              </td>
                              <td className="px-6 py-4 text-foreground">
                                ${proj.mapping_rate.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-foreground">
                                ${proj.validation_rate.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Top Contributors Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Contributors</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            OSM Username
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Mapped
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Validated
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Invalidated
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Hours
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {editingData.top_contributors.map((c) => (
                          <tr
                            key={c.osm_username}
                            className={
                              c.user_id
                                ? "cursor-pointer hover:bg-muted/50 transition-colors"
                                : ""
                            }
                            onClick={() =>
                              c.user_id &&
                              router.push(
                                `/admin/users/${encodeURIComponent(c.user_id)}`
                              )
                            }
                          >
                            <td className="px-6 py-4">
                              <span
                                className={
                                  c.user_id
                                    ? "font-medium text-kaart-orange"
                                    : "font-medium text-foreground"
                                }
                              >
                                {c.user_name}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-foreground">
                              {c.osm_username}
                            </td>
                            <td className="px-6 py-4 text-foreground">
                              {c.tasks_mapped}
                            </td>
                            <td className="px-6 py-4 text-foreground">
                              {c.tasks_validated}
                            </td>
                            <td className="px-6 py-4 text-foreground">
                              {c.tasks_invalidated}
                            </td>
                            <td className="px-6 py-4 text-foreground">
                              {c.total_hours}h
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* ── 8 Team Activity Charts (Kibana data - mock) ── */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Editing Activity by Element Type
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Sample data — pending Kibana integration
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {MOCK_ACTIVITY_ELEMENT_TYPES.map((chart) => (
                    <MiniActivityChart
                      key={chart.title}
                      title={chart.title}
                      data={chart.data}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  Select a date range and click Refresh to load editing
                  statistics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════ COMMUNITY TAB ═══════ */}
        <TabsContent value="community">
          <div className="space-y-6">
            <p className="text-xs text-muted-foreground">
              Sample data — pending community data source integration
            </p>

            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-800 text-white">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-300 font-medium mb-1">
                    Community Interactions
                  </p>
                  <p className="text-xl font-bold">
                    3 Events; 4 Interactions
                  </p>
                  <div className="flex gap-4 mt-3">
                    <span className="text-xs text-gray-400">
                      Weekly totals +0%
                    </span>
                    <span className="text-xs text-green-400">
                      Weekly Delta +97%
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 text-white">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-300 font-medium mb-1">
                    Event Participants
                  </p>
                  <p className="text-xl font-bold">
                    15 New; 10 Return
                  </p>
                  <p className="text-lg font-semibold text-gray-200">
                    25 Total
                  </p>
                  <div className="flex gap-4 mt-3">
                    <span className="text-xs text-gray-400">
                      Weekly totals +0%
                    </span>
                    <span className="text-xs text-green-400">
                      Weekly Delta +97%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Summation Log */}
            <Card className="bg-gray-800">
              <CardHeader>
                <CardTitle className="text-white">
                  Event Summation Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-700">
                  {MOCK_COMMUNITY_EVENTS.map((event) => {
                    const isExpanded = expandedEvents.has(event.id);
                    return (
                      <div key={event.id}>
                        <div
                          className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                          onClick={() => {
                            const next = new Set(expandedEvents);
                            if (isExpanded) next.delete(event.id);
                            else next.add(event.id);
                            setExpandedEvents(next);
                          }}
                        >
                          <span className="text-gray-400 text-sm w-4">
                            {isExpanded ? "\u25BC" : "\u25B6"}
                          </span>
                          <span className="text-white font-medium flex-1 text-sm">
                            {event.title}
                          </span>
                          <div className="flex gap-1.5">
                            {event.categories.map((cat) => (
                              <CategoryBadge key={cat} label={cat} />
                            ))}
                          </div>
                          <button className="px-3 py-1 text-xs font-medium text-kaart-orange border border-kaart-orange rounded hover:bg-kaart-orange hover:text-white transition-colors">
                            Edit
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="px-14 pb-4 text-gray-300">
                            <p className="text-sm mb-3">
                              {event.summary}
                            </p>
                            <div className="bg-gray-900 rounded-lg p-3 inline-block">
                              <p className="text-xs font-semibold text-gray-200 mb-1">
                                Participants:
                              </p>
                              <div className="text-xs text-gray-400 space-y-0.5">
                                <p>
                                  {event.participants.new} new
                                </p>
                                <p>
                                  {event.participants.return}{" "}
                                  return
                                </p>
                                <p>
                                  {event.participants.key} key
                                </p>
                                <p className="font-medium text-gray-200">
                                  {event.participants.total}{" "}
                                  total
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Overwrites Section */}
            <Card className="bg-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  Overwrites
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-700">
                  {MOCK_OVERWRITES.map((ow) => (
                    <div
                      key={ow.id}
                      className="flex items-center gap-3 px-6 py-4"
                    >
                      <span className="text-gray-400 text-sm w-4">
                        \u25B6
                      </span>
                      <span className="text-white font-medium flex-1 text-sm">
                        {ow.title}
                      </span>
                      <a
                        href={ow.link}
                        className="px-3 py-1 text-xs font-medium text-kaart-orange border border-kaart-orange rounded hover:bg-kaart-orange hover:text-white transition-colors"
                      >
                        Link
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════ TIMEKEEPING TAB ═══════ */}
        <TabsContent value="timekeeping">
          {timekeepingLoading && !timekeepingData ? (
            <LoadingSpinner />
          ) : timekeepingError ? (
            <Card>
              <CardContent className="p-8 text-center text-red-500">
                Failed to load timekeeping stats: {timekeepingError}
              </CardContent>
            </Card>
          ) : timekeepingData ? (
            <div className="space-y-6">
              {/* ── Top Row: Totals + Task Breakdown ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Team Hours + Summary Text */}
                <Card>
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Totals</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Team Hours
                    </p>
                    <div className="flex items-baseline gap-3">
                      <p className="text-3xl font-bold">
                        {timekeepingData.summary.total_hours.toLocaleString()}h
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          timekeepingData.summary
                            .weekly_rate_change_percent >= 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {timekeepingData.summary
                          .weekly_rate_change_percent >= 0
                          ? "+"
                          : ""}
                        {timekeepingData.summary.weekly_rate_change_percent}
                        %
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {timekeepingData.summary.total_entries.toLocaleString()}{" "}
                      entries
                    </p>
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-foreground leading-relaxed">
                        During this time period, a total of{" "}
                        <span className="font-bold">
                          {timekeepingData.summary.total_hours.toLocaleString()}{" "}
                          hours
                        </span>{" "}
                        were logged. This is{" "}
                        <span className="font-bold">100.0%</span> of the
                        total hours logged.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="text-center">
                        <p className="text-xl font-bold text-foreground">
                          {timekeepingData.summary.total_changesets.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Changesets
                        </p>
                        {timekeepingData.comparison?.summary && (() => {
                          const prev = timekeepingData.comparison.summary.total_changesets;
                          const curr = timekeepingData.summary.total_changesets;
                          const delta = prev > 0 ? ((curr - prev) / prev) * 100 : null;
                          return delta != null ? (
                            <p className={`text-xs font-medium mt-1 ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {delta >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(delta).toFixed(1)}%
                            </p>
                          ) : null;
                        })()}
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-foreground">
                          {timekeepingData.summary.total_changes.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Changes
                        </p>
                        {timekeepingData.comparison?.summary && (() => {
                          const prev = timekeepingData.comparison.summary.total_changes;
                          const curr = timekeepingData.summary.total_changes;
                          const delta = prev > 0 ? ((curr - prev) / prev) * 100 : null;
                          return delta != null ? (
                            <p className={`text-xs font-medium mt-1 ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {delta >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(delta).toFixed(1)}%
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Hours by Category — Horizontal BarChart */}
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-base">Task</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {timekeepingData.hours_by_category.length > 0 ? (
                      <div
                        style={{
                          width: "100%",
                          height: Math.max(
                            200,
                            timekeepingData.hours_by_category.length * 40
                          ),
                        }}
                      >
                        <ResponsiveContainer>
                          <BarChart
                            data={timekeepingData.hours_by_category}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis
                              type="category"
                              dataKey="category"
                              tick={{ fontSize: 10 }}
                              width={160}
                              tickFormatter={(v: string) =>
                                v.charAt(0).toUpperCase() + v.slice(1)
                              }
                            />
                            <Tooltip
                              formatter={(value) => [
                                `${value}h`,
                                "Hours",
                              ]}
                            />
                            <Bar dataKey="hours" name="Hours">
                              {timekeepingData.hours_by_category.map(
                                (entry, index) => (
                                  <Cell
                                    key={index}
                                    fill={
                                      CATEGORY_COLORS[
                                        entry.category
                                      ] || CATEGORY_COLORS.other
                                    }
                                  />
                                )
                              )}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No time tracking data for this period.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── Middle Row: 3 Charts ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Weekly Team Activity — ComposedChart */}
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-base">
                      Weekly Team Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {timekeepingData.weekly_activity.length > 0 ? (
                      <div style={{ width: "100%", height: 280 }}>
                        <ResponsiveContainer>
                          <ComposedChart
                            data={timekeepingData.weekly_activity}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="week"
                              tick={{ fontSize: 10 }}
                              tickFormatter={(v: string) =>
                                new Date(
                                  v + "T00:00:00"
                                ).toLocaleDateString("en-US", {
                                  month: "numeric",
                                  day: "numeric",
                                })
                              }
                            />
                            <YAxis
                              yAxisId="left"
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tick={{ fontSize: 10 }}
                            />
                            <Tooltip
                              labelFormatter={(v) =>
                                new Date(
                                  String(v) + "T00:00:00"
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              }
                            />
                            <Legend
                              wrapperStyle={{ fontSize: 10 }}
                            />
                            <Bar
                              yAxisId="left"
                              dataKey="hours"
                              name="Hours"
                              fill={COLORS.hours}
                            />
                            <Line
                              yAxisId="right"
                              dataKey="changes_per_hour"
                              name="Changes/Hour"
                              stroke={COLORS.mapped}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                            />
                            <Line
                              yAxisId="right"
                              dataKey="changes_per_changeset"
                              name="Changes/Changeset"
                              stroke={COLORS.review}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No weekly activity data.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Weekly Task Hours — Stacked BarChart (mock) */}
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-base">
                      Weekly Task Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <BarChart data={MOCK_WEEKLY_TASK_HOURS}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="week"
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ fontSize: 11 }}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: 9 }}
                            iconSize={8}
                          />
                          {WEEKLY_TASK_CATEGORIES.map(
                            (cat, i) => (
                              <Bar
                                key={cat}
                                dataKey={cat}
                                stackId="a"
                                fill={
                                  WEEKLY_TASK_COLORS[
                                    i % WEEKLY_TASK_COLORS.length
                                  ]
                                }
                              />
                            )
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-1">
                      Sample data — pending backend integration
                    </p>
                  </CardContent>
                </Card>

                {/* Community Outreach Trends — Stacked Bar + Lines (mock) */}
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-base">
                      Community Outreach Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <ComposedChart
                          data={MOCK_COMMUNITY_OUTREACH}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="week"
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ fontSize: 11 }}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: 9 }}
                            iconSize={8}
                          />
                          {Object.entries(
                            COMMUNITY_OUTREACH_COLORS
                          ).map(([cat, color]) => (
                            <Bar
                              key={cat}
                              dataKey={cat}
                              stackId="a"
                              fill={color}
                            />
                          ))}
                          <Line
                            dataKey="newParticipants"
                            name="# of New Participants"
                            stroke="#1f2937"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                          <Line
                            dataKey="returnParticipants"
                            name="# of Retained Participants"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            strokeDasharray="5 5"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-1">
                      Sample data — pending community data integration
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Per-User Time Tracking Table */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Time Tracking (
                    {timekeepingData.user_breakdown.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground w-8"></th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Hours
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Records
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Changesets
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            Changes
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                            OSM usernames
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {timekeepingData.user_breakdown.map((u) => {
                          const isExpanded = expandedUsers.has(
                            u.user_id
                          );
                          return (
                            <Fragment key={u.user_id}>
                              <tr
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => {
                                  const next = new Set(
                                    expandedUsers
                                  );
                                  if (isExpanded)
                                    next.delete(u.user_id);
                                  else next.add(u.user_id);
                                  setExpandedUsers(next);
                                }}
                              >
                                <td className="px-6 py-4 text-muted-foreground">
                                  {isExpanded
                                    ? "\u25BC"
                                    : "\u25B6"}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-kaart-orange/20 flex items-center justify-center text-kaart-orange text-xs font-bold">
                                      {(u.user_name || "?")
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </div>
                                    <span className="font-medium text-foreground">
                                      {u.user_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-foreground">
                                  {u.total_hours}h
                                </td>
                                <td className="px-6 py-4 text-foreground">
                                  {u.entries_count}
                                </td>
                                <td className="px-6 py-4 text-foreground">
                                  {u.changeset_count}
                                </td>
                                <td className="px-6 py-4 text-foreground">
                                  {u.changes_count.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-foreground">
                                  {u.osm_username || "\u2014"}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td
                                    colSpan={7}
                                    className="px-12 py-3 bg-muted/30"
                                  >
                                    <div className="flex flex-wrap gap-4">
                                      {Object.entries(
                                        u.category_hours
                                      ).map(([cat, hrs]) => (
                                        <div
                                          key={cat}
                                          className="flex items-center gap-2"
                                        >
                                          <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                              backgroundColor:
                                                CATEGORY_COLORS[
                                                  cat
                                                ] ||
                                                CATEGORY_COLORS.other,
                                            }}
                                          />
                                          <span className="text-sm text-muted-foreground capitalize">
                                            {cat}:{" "}
                                            <span className="font-medium">
                                              {hrs}h
                                            </span>
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  Select a date range and click Refresh to load
                  timekeeping statistics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
