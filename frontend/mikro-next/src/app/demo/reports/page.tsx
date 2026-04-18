"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, Val } from "@/components/ui";
import { formatNumber } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Projects", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { label: "Time", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Training", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { label: "Checklists", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { label: "Teams", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { label: "Payments", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", active: true },
  { label: "Regions", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Punks List", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  { label: "Friends List", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { label: "Transcribe", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
];

const DONUT_DATA = [
  { name: "Completed", value: 68 },
  { name: "Remaining", value: 32 },
];

const TASKS_OVER_TIME = [
  { week: "Mar 3", mapped: 142, validated: 98, invalidated: 8 },
  { week: "Mar 10", mapped: 187, validated: 121, invalidated: 12 },
  { week: "Mar 17", mapped: 164, validated: 135, invalidated: 6 },
  { week: "Mar 24", mapped: 210, validated: 148, invalidated: 15 },
  { week: "Mar 31", mapped: 195, validated: 162, invalidated: 9 },
  { week: "Apr 7", mapped: 228, validated: 175, invalidated: 11 },
];

const PROJECTS_TABLE = [
  { name: "Terminus Road Network", status: "Active", progressMap: 71, progressVal: 49, timePerTask: "4.2 min", mapRate: "$0.35", valRate: "$0.15" },
  { name: "Trantor Underground Transit", status: "Active", progressMap: 46, progressVal: 32, timePerTask: "6.8 min", mapRate: "$0.50", valRate: "$0.25" },
  { name: "Siwenna Access Barriers", status: "Complete", progressMap: 100, progressVal: 90, timePerTask: "3.1 min", mapRate: "$0.30", valRate: "$0.15" },
  { name: "Anacreon Rural Survey", status: "Active", progressMap: 30, progressVal: 15, timePerTask: "5.5 min", mapRate: "$0.20", valRate: "$0.10" },
  { name: "Kalgan Highway Network", status: "Active", progressMap: 55, progressVal: 40, timePerTask: "4.8 min", mapRate: "$0.40", valRate: "$0.20" },
  { name: "Helicon Name Survey", status: "New", progressMap: 8, progressVal: 0, timePerTask: "—", mapRate: "$0.25", valRate: "$0.10" },
];

export default function ReportsDemo() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--muted)" }}>
      {/* Header */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 64, backgroundColor: "var(--background)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/mikro-logo.png" alt="Mikro" width={32} height={32} />
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--foreground)" }}>Mikro</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, color: "var(--foreground)" }}>Salvor Hardin</span>
          <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Settings</span>
          <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Logout</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside style={{ position: "fixed", left: 0, top: 64, bottom: 0, width: 180, borderRight: "1px solid var(--border)", backgroundColor: "var(--background)", zIndex: 40, padding: "16px 0", overflowY: "auto" }}>
        <nav style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 8, padding: "10px 12px", fontSize: 14, fontWeight: 500, backgroundColor: "active" in item && item.active ? "rgba(255, 107, 53, 0.1)" : "transparent", color: "active" in item && item.active ? "#ff6b35" : "var(--muted-foreground)" }}>
              <svg style={{ width: 20, height: 20, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ paddingTop: 64, marginLeft: 180 }}>
        <div style={{ padding: 24 }}>
          <div className="space-y-6">
            {/* Header + date filter */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">Reports</h1>
              <div className="flex gap-2">
                {["This Week", "This Month", "Last Month", "Last 3 Months"].map((label, i) => (
                  <button key={label} className={`px-3 py-1.5 text-xs rounded-full ${i === 2 ? "bg-kaart-orange/10 text-kaart-orange font-medium" : "bg-muted text-muted-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border">
              <button className="px-4 py-2 text-sm font-medium text-kaart-orange border-b-2 border-kaart-orange">Editing</button>
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground">Community</button>
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground">Timekeeping</button>
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground">Imagery</button>
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground">MapRoulette</button>
            </div>

            {/* Hero Row: Donut + Heatmap placeholder + Changeset totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Donut */}
              <Card>
                <CardHeader className="pb-0"><CardTitle className="text-base">Project Progress</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div style={{ width: 160, height: 160, position: "relative" }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={DONUT_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={72} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                          <Cell fill="#f97316" />
                          <Cell fill="#e5e7eb" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)" }}>68%</span>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Completed</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "center", marginTop: 8 }}>
                    <p className="text-sm text-muted-foreground"><Val>8,420</Val> / <Val>12,380</Val> tasks</p>
                    <p className="text-sm font-medium"><Val>6</Val> active projects</p>
                  </div>
                </CardContent>
              </Card>

              {/* Heatmap placeholder */}
              <Card>
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Map of changeset centroids</CardTitle>
                    <span className="text-xs text-muted-foreground">12 users &middot; 1,847 changesets</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div style={{ width: "100%", height: 180, backgroundColor: "#0f1729", borderRadius: 8, position: "relative", overflow: "hidden" }}>
                    {/* Real world map from Wikimedia Commons, flipped horizontally, tinted dark */}
                    <img
                      src="/world-map.svg"
                      alt=""
                      style={{
                        width: "110%", height: "110%",
                        objectFit: "cover", objectPosition: "center 40%",
                        position: "absolute", top: "-5%", left: "-5%",
                        transform: "scaleX(-1)",
                        filter: "brightness(0) invert(1) brightness(0.5) sepia(1) hue-rotate(170deg) saturate(5)",
                        opacity: 0.9,
                      }}
                    />
                    {/* Heatmap dots */}
                    {[
                      { x: "72%", y: "28%", s: 7 }, { x: "68%", y: "35%", s: 5 }, { x: "75%", y: "40%", s: 8 }, { x: "70%", y: "45%", s: 4 },
                      { x: "66%", y: "68%", s: 6 }, { x: "68%", y: "75%", s: 5 },
                      { x: "42%", y: "22%", s: 8 }, { x: "38%", y: "25%", s: 6 }, { x: "40%", y: "30%", s: 5 }, { x: "35%", y: "20%", s: 4 },
                      { x: "38%", y: "45%", s: 7 }, { x: "35%", y: "55%", s: 9 }, { x: "36%", y: "50%", s: 5 }, { x: "40%", y: "60%", s: 6 },
                      { x: "22%", y: "25%", s: 6 }, { x: "18%", y: "30%", s: 8 }, { x: "15%", y: "22%", s: 5 }, { x: "12%", y: "35%", s: 7 },
                      { x: "20%", y: "42%", s: 6 }, { x: "18%", y: "48%", s: 5 },
                      { x: "8%", y: "48%", s: 7 }, { x: "6%", y: "52%", s: 5 },
                      { x: "4%", y: "72%", s: 6 }, { x: "6%", y: "68%", s: 4 },
                    ].map((dot, i) => (
                      <div key={i} style={{ position: "absolute", left: dot.x, top: dot.y, width: dot.s, height: dot.s, borderRadius: "50%", backgroundColor: "#ff6b35", opacity: 0.85, boxShadow: "0 0 8px rgba(255,107,53,0.6)" }} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Changeset totals */}
              <Card>
                <CardHeader className="pb-0"><CardTitle className="text-base">Changeset totals</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-foreground text-sm leading-relaxed mt-2">
                    During this time period, a total of <span className="font-bold">1,126</span> tasks were mapped across <span className="font-bold">6</span> active projects, with <span className="font-bold">839</span> tasks validated and <span className="font-bold">61</span> invalidated.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-foreground">1,126</p>
                      <p className="text-xs text-muted-foreground">Tasks Mapped</p>
                      <p className="text-xs font-medium mt-1 text-green-600">&#9650; 16.9%</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-foreground">839</p>
                      <p className="text-xs text-muted-foreground">Validated</p>
                      <p className="text-xs font-medium mt-1 text-green-600">&#9650; 8.0%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tasks Over Time */}
            <Card>
              <CardHeader><CardTitle>Tasks Over Time</CardTitle></CardHeader>
              <CardContent>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={TASKS_OVER_TIME}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="mapped" name="Mapped" fill="#f97316" />
                      <Bar dataKey="validated" name="Validated" fill="#3b82f6" />
                      <Bar dataKey="invalidated" name="Invalidated" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Project Table */}
            <Card>
              <CardHeader><CardTitle>Detailed Project Table ({PROJECTS_TABLE.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      {["Project Name", "Status", "Progress", "% Validated", "Time per Task", "Map Rate", "Val Rate"].map((col) => (
                        <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-foreground">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {PROJECTS_TABLE.map((p) => (
                      <tr key={p.name} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium text-kaart-orange">{p.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            p.status === "Complete" ? "bg-green-100 text-green-800" :
                            p.status === "New" ? "bg-blue-100 text-blue-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden" style={{ minWidth: 80 }}>
                              <div className="h-full bg-kaart-orange rounded-full" style={{ width: `${p.progressMap}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">{p.progressMap}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden" style={{ minWidth: 60 }}>
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progressVal}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">{p.progressVal}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-foreground">{p.timePerTask}</td>
                        <td className="px-4 py-3 text-foreground">{p.mapRate}</td>
                        <td className="px-4 py-3 text-foreground">{p.valRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
