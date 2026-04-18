"use client";

import Image from "next/image";
import { Card, CardContent, StatCard, Val } from "@/components/ui";
import { formatNumber, formatCurrency } from "@/lib/utils";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Projects", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { label: "Time", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Training", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { label: "Checklists", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", active: true },
  { label: "Teams", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { label: "Payments", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { label: "Regions", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Punks List", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  { label: "Friends List", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { label: "Transcribe", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
];

const ACTIVITY_DATA = [
  { date: "Apr 1", mapped: 12, validated: 3, hours: 6.5 },
  { date: "Apr 2", mapped: 8, validated: 5, hours: 5.2 },
  { date: "Apr 3", mapped: 15, validated: 2, hours: 7.8 },
  { date: "Apr 4", mapped: 6, validated: 8, hours: 4.1 },
  { date: "Apr 5", mapped: 0, validated: 0, hours: 0 },
  { date: "Apr 6", mapped: 0, validated: 0, hours: 0 },
  { date: "Apr 7", mapped: 18, validated: 4, hours: 8.0 },
  { date: "Apr 8", mapped: 10, validated: 6, hours: 6.3 },
  { date: "Apr 9", mapped: 14, validated: 1, hours: 7.1 },
  { date: "Apr 10", mapped: 9, validated: 7, hours: 5.8 },
  { date: "Apr 11", mapped: 11, validated: 3, hours: 6.0 },
  { date: "Apr 12", mapped: 0, validated: 0, hours: 0 },
  { date: "Apr 13", mapped: 0, validated: 0, hours: 0 },
  { date: "Apr 14", mapped: 20, validated: 5, hours: 8.5 },
];

export default function ProfileDemo() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--muted)" }}>
      {/* Header */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 64, backgroundColor: "var(--background)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/mikro-logo.png" alt="Mikro" width={32} height={32} />
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--foreground)" }}>Mikro</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, color: "var(--foreground)" }}>Motoko Kusanagi</span>
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
            {/* Back link */}
            <span className="text-kaart-orange text-sm">&larr; Back to Users</span>

            {/* Profile Header Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-kaart-orange flex items-center justify-center text-white text-xl font-bold shrink-0">K</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-bold tracking-tight">Korben Dallas</h1>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">mapper</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Level 3</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="border border-border rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Accounts</p>
                    <div className="space-y-1.5">
                      <div><span className="text-xs text-muted-foreground">Email</span><p className="text-sm">korben@fhloston.net</p></div>
                      <div><span className="text-xs text-muted-foreground">OSM</span><p className="text-sm text-kaart-orange">multipass</p></div>
                      <div><span className="text-xs text-muted-foreground">Mapillary</span><p className="text-sm text-kaart-orange">korben_dallas</p></div>
                      <div><span className="text-xs text-muted-foreground">Hourly Rate</span><p className="text-sm"><Val>$12.00</Val>/hr</p></div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Location</p>
                    <div className="space-y-1.5">
                      <div><span className="text-xs text-muted-foreground">Country</span><p className="text-sm">United States</p></div>
                      <div><span className="text-xs text-muted-foreground">Region</span><p className="text-sm">North America</p></div>
                      <div><span className="text-xs text-muted-foreground">Timezone</span><p className="text-sm">America/Denver</p></div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Stats</p>
                    <div className="space-y-1.5">
                      <div><span className="text-xs text-muted-foreground">Joined</span><p className="text-sm">Jan 15, 2025</p></div>
                      <div><span className="text-xs text-muted-foreground">Mapper Points</span><p className="text-sm font-medium">2,840</p></div>
                      <div><span className="text-xs text-muted-foreground">Validator Points</span><p className="text-sm font-medium">0</p></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All-time Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Tasks Mapped" value="573" />
              <StatCard label="Tasks Validated" value="0" />
              <StatCard label="Tasks Invalidated" value="0" />
              <StatCard label="Total Earnings" value="$1,820.00" />
            </div>

            {/* Activity Chart */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Activity — Last 14 Days</h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">Daily</span>
                    <span className="px-3 py-1 text-xs rounded-full bg-kaart-orange/10 text-kaart-orange font-medium">Weekly</span>
                    <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">Monthly</span>
                    <span className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">Custom</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={ACTIVITY_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="mapped" name="Mapped" fill="#ff6b35" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="validated" name="Validated" fill="#004e89" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="hours" name="Hours" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
