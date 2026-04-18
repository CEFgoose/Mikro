"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Val } from "@/components/ui";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Projects", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { label: "Time", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", active: true },
  { label: "Training", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { label: "Checklists", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { label: "Teams", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { label: "Payments", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { label: "Regions", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Punks List", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  { label: "Friends List", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { label: "Transcribe", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
];

const ACTIVE_SESSIONS = [
  { name: "Burt Macklin", project: "TM4 #14892", category: "Editing", clockIn: "2:34:17", today: "5h 12m" },
  { name: "Andy Awesome", project: "MR Challenge 63061", category: "Validation", clockIn: "1:08:42", today: "3h 45m" },
  { name: "Rex Buckingham", project: "TM4 #15210", category: "Editing", clockIn: "0:22:05", today: "0h 22m" },
];

const HISTORY_ENTRIES = [
  { name: "Andy Awesome", project: "MR Challenge 63061", category: "Editing", clockIn: "Apr 17, 08:30", clockOut: "Apr 17, 13:00", duration: "4h 30m", status: "completed" },
  { name: "Rex Buckingham", project: "TM4 #15210", category: "Editing", clockIn: "Apr 17, 08:00", clockOut: "Apr 17, 14:45", duration: "6h 45m", status: "completed" },
  { name: "Duke Silver", project: "TM4 #14892", category: "Editing", clockIn: "Apr 17, 08:00", clockOut: "Apr 17, 12:15", duration: "4h 15m", status: "completed" },
  { name: "Burt Macklin", project: "MR Challenge 63061", category: "Editing", clockIn: "Apr 17, 06:30", clockOut: "Apr 17, 09:12", duration: "2h 42m", status: "completed" },
  { name: "Constantine Benvoglio", project: "TM4 #15003", category: "Validation", clockIn: "Apr 17, 07:00", clockOut: "Apr 17, 11:30", duration: "4h 30m", status: "completed" },
  { name: "Viktor Nightshade", project: "TM4 #14892", category: "Editing", clockIn: "Apr 16, 22:00", clockOut: "Apr 17, 06:15", duration: "8h 15m", status: "completed" },
  { name: "Kip Hackman", project: "MR Challenge 63061", category: "Validation", clockIn: "Apr 16, 14:00", clockOut: "Apr 16, 18:45", duration: "4h 45m", status: "completed" },
  { name: "Larry Gengurch", project: "TM4 #15210", category: "Review", clockIn: "Apr 16, 10:00", clockOut: "Apr 16, 13:30", duration: "3h 30m", status: "completed" },
  { name: "Caleb Crawdad", project: "TM4 #14892", category: "Training", clockIn: "Apr 16, 09:00", clockOut: "Apr 16, 11:00", duration: "2h 00m", status: "completed" },
  { name: "Mangy Carl", project: "TM4 #15003", category: "Editing", clockIn: "Apr 16, 08:00", clockOut: "Apr 16, 14:20", duration: "6h 20m", status: "voided" },
];

function formatElapsedTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function TimeDemo() {
  const [elapsed, setElapsed] = useState(5847); // ~1:37:27

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--muted)" }}>
      {/* Header */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 64, backgroundColor: "var(--background)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/mikro-logo.png" alt="Mikro" width={32} height={32} />
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--foreground)" }}>Mikro</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, color: "var(--foreground)" }}>Burt Macklin</span>
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

        {/* Sidebar clock widget */}
        <div style={{ margin: "16px 12px 0", padding: 12, border: "2px solid #22c55e", borderRadius: 12, backgroundColor: "var(--background)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Time Tracking</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontFamily: "monospace", fontWeight: 700, color: "#22c55e", marginBottom: 4 }}>
              {formatElapsedTime(elapsed)}
            </div>
            <p style={{ fontSize: 11, fontWeight: 500, color: "var(--foreground)", margin: "0 0 2px" }}>MR Challenge 63061</p>
            <p style={{ fontSize: 10, color: "var(--muted-foreground)", margin: "0 0 4px" }}>Editing</p>
            <p style={{ fontSize: 10, color: "var(--muted-foreground)", margin: "0 0 8px" }}>Today: 3h 48m &middot; Week: 22h 15m</p>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ flex: 1, padding: "6px 0", fontSize: 11, borderRadius: 6, border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)", cursor: "pointer" }}>Switch Tasks</button>
              <button style={{ flex: 1, padding: "6px 0", fontSize: 11, borderRadius: 6, border: "none", backgroundColor: "#ef4444", color: "white", cursor: "pointer" }}>Clock Out</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ paddingTop: 64, marginLeft: 180 }}>
        <div style={{ padding: 24 }}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-foreground">Time Management</h1>
              <div className="flex gap-2">
                <Button variant="outline">Add Entry</Button>
                <Button variant="outline">Export</Button>
              </div>
            </div>

            {/* Active Sessions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  Active Sessions ({ACTIVE_SESSIONS.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {ACTIVE_SESSIONS.map((s) => (
                    <div key={s.name} className="border border-green-200 rounded-lg p-3 bg-green-50/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-foreground">{s.name}</span>
                        <span className="text-xs font-mono text-green-600 font-bold">{s.clockIn}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.project}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-xs">{s.category}</Badge>
                        <span className="text-xs text-muted-foreground">Today: {s.today}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex items-center gap-3">
              {["This Week", "This Month", "Last Month", "Last 3 Months", "All Time"].map((label, i) => (
                <button key={label} className={`px-3 py-1.5 text-xs rounded-full ${i === 1 ? "bg-kaart-orange/10 text-kaart-orange font-medium" : "bg-muted text-muted-foreground"}`}>
                  {label}
                </button>
              ))}
              <span className="text-xs text-muted-foreground mx-2">|</span>
              {["All", "Editing", "Validation", "Review", "Training"].map((label, i) => (
                <button key={label} className={`px-3 py-1.5 text-xs rounded-full ${i === 0 ? "bg-kaart-blue/10 text-kaart-blue font-medium" : "bg-muted text-muted-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* History Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        {["User", "Project", "Category", "Clock In", "Clock Out", "Duration", "Status"].map((col) => (
                          <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {HISTORY_ENTRIES.map((entry, i) => (
                        <tr key={i} className="hover:bg-muted/50">
                          <td className="px-3 py-2 text-sm font-medium text-kaart-orange">{entry.name}</td>
                          <td className="px-3 py-2 text-sm text-foreground">{entry.project}</td>
                          <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{entry.category}</Badge></td>
                          <td className="px-3 py-2 text-sm text-foreground">{entry.clockIn}</td>
                          <td className="px-3 py-2 text-sm text-foreground">{entry.clockOut}</td>
                          <td className="px-3 py-2 text-sm font-medium text-foreground">{entry.duration}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${entry.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-muted-foreground">Showing 1–10 of 247 entries</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
