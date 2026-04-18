"use client";

import Image from "next/image";
import { Card, CardContent, Button, Badge, Val } from "@/components/ui";
import { formatNumber } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Projects", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { label: "Time", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Training", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { label: "Checklists", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { label: "Teams", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { label: "Payments", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { label: "Regions", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Punks List", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", active: true },
  { label: "Friends List", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { label: "Transcribe", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
];

const PUNKS = [
  { username: "parzival_0", notes: "Consistently deleting other mappers' turn restrictions without explanation", tags: ["vandalism", "turn restrictions"], addedBy: "Roland Deschain", date: "Mar 12, 2026", lastActive: "Apr 15, 2026", changesets: 2847 },
  { username: "art3mis", notes: "Adding fictitious road names in rural areas — reported to DWG", tags: ["fabrication", "DWG reported"], addedBy: "Eddie Dean", date: "Feb 28, 2026", lastActive: "Apr 10, 2026", changesets: 1203 },
  { username: "aech_h", notes: "Overlapping duplicate ways on coastlines, ignoring changeset comments", tags: ["duplicates", "unresponsive"], addedBy: "Susannah Dean", date: "Jan 15, 2026", lastActive: "Apr 12, 2026", changesets: 5621 },
  { username: "i_r0k", notes: "Automated edits without community approval — mechanical edit policy violation", tags: ["bot", "undiscussed"], addedBy: "Jake Chambers", date: "Mar 22, 2026", lastActive: "Apr 8, 2026", changesets: 8410 },
  { username: "daito_sho", notes: "Bulk-importing POI data from unknown source, no attribution", tags: ["import", "attribution"], addedBy: "Roland Deschain", date: "Feb 10, 2026", lastActive: "Mar 28, 2026", changesets: 892 },
  { username: "shoto_tosh", notes: "Repeatedly reverting valid edits by other mappers in Siwenna region", tags: ["revert war", "territorial"], addedBy: "Cuthbert Allgood", date: "Apr 1, 2026", lastActive: "Apr 16, 2026", changesets: 3156 },
  { username: "nolan_sor", notes: "Deleting highway classifications and replacing with track — quality concern", tags: ["downgrade", "highways"], addedBy: "Alain Johns", date: "Mar 5, 2026", lastActive: "Apr 14, 2026", changesets: 1567 },
  { username: "og_morrow", notes: "Creating nonsensical one-way restrictions in residential areas", tags: ["oneways", "errors"], addedBy: "Jake Chambers", date: "Jan 30, 2026", lastActive: "Apr 2, 2026", changesets: 445 },
  { username: "sixers_101", notes: "Moved entire village to wrong coordinates — since corrected by community", tags: ["geometry", "corrected"], addedBy: "Eddie Dean", date: "Feb 20, 2026", lastActive: "Mar 15, 2026", changesets: 234 },
  { username: "l0wfive", notes: "Systematic removal of access=private tags on gated roads", tags: ["access", "privacy"], addedBy: "Roland Deschain", date: "Apr 5, 2026", lastActive: "Apr 17, 2026", changesets: 1890 },
];

export default function PunksDemo() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--muted)" }}>
      {/* Header */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 64, backgroundColor: "var(--background)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/mikro-logo.png" alt="Mikro" width={32} height={32} />
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--foreground)" }}>Mikro</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, color: "var(--foreground)" }}>Roland Deschain</span>
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
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Punks List</h1>
                <p className="text-sm text-muted-foreground">Track problematic OSM editors and monitor their activity</p>
              </div>
              <div className="flex gap-2">
                <Button>Add Punk</Button>
                <Button variant="outline">Refresh All</Button>
              </div>
            </div>

            {/* Search + filter */}
            <div className="flex items-center gap-3">
              <input type="text" placeholder="Search by username or notes..." className="rounded-md border border-border bg-background px-3 py-1.5 text-sm w-64" readOnly />
              <div className="flex gap-1">
                {["All", "vandalism", "bot", "import", "revert war"].map((tag, i) => (
                  <button key={tag} className={`px-3 py-1 text-xs rounded-full ${i === 0 ? "bg-kaart-orange/10 text-kaart-orange font-medium" : "bg-muted text-muted-foreground"}`}>{tag}</button>
                ))}
              </div>
            </div>

            {/* Punks Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        {["OSM Username ▲", "Notes", "Tags", "Added By", "Date Added", "Last Active", "Changesets", "Actions"].map((col) => (
                          <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {PUNKS.map((punk) => (
                        <tr key={punk.username} className="hover:bg-muted/50">
                          <td className="px-3 py-2.5">
                            <span className="font-medium text-kaart-orange">{punk.username}</span>
                          </td>
                          <td className="px-3 py-2.5 text-sm text-muted-foreground max-w-[220px] truncate" title={punk.notes}>{punk.notes}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1">
                              {punk.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-sm text-muted-foreground">{punk.addedBy}</td>
                          <td className="px-3 py-2.5 text-sm text-foreground">{punk.date}</td>
                          <td className="px-3 py-2.5 text-sm text-foreground">{punk.lastActive}</td>
                          <td className="px-3 py-2.5 text-sm text-foreground"><Val>{formatNumber(punk.changesets)}</Val></td>
                          <td className="px-3 py-2.5">
                            <div className="flex gap-1">
                              <button className="px-2 py-1 text-xs rounded border border-border text-muted-foreground">Edit</button>
                              <button className="px-2 py-1 text-xs rounded border border-border text-muted-foreground">Refresh</button>
                              <button className="px-2 py-1 text-xs rounded border border-red-200 text-red-500">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-muted-foreground">Showing 1–10 of 10 punks</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
