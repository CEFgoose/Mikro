"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Val } from "@/components/ui";
import { formatNumber, formatCurrency } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Projects", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { label: "Time", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Training", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { label: "Checklists", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { label: "Teams", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { label: "Payments", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", active: true },
  { label: "Reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { label: "Regions", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Punks List", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  { label: "Friends List", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { label: "Transcribe", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" },
];

const PENDING_REQUESTS = [
  { user: "Hober Mallow", osm: "master_trader", date: "Apr 15, 2026", amount: 285.50, tasks: 47 },
  { user: "Hari Seldon", osm: "psychohistory", date: "Apr 14, 2026", amount: 156.00, tasks: 28 },
  { user: "Ducem Barr", osm: "siwenna_ruins", date: "Apr 13, 2026", amount: 98.75, tasks: 19 },
];

const PAYMENT_HISTORY = [
  { user: "Salvor Hardin", osm: "terminus_mayor", date: "Apr 10, 2026", amount: 412.00, method: "PayPal" },
  { user: "Gaal Dornick", osm: "prime_radiant", date: "Apr 10, 2026", amount: 324.50, method: "Wire" },
  { user: "Hari Seldon", osm: "psychohistory", date: "Apr 9, 2026", amount: 176.25, method: "Wire" },
  { user: "Bel Riose", osm: "last_general", date: "Apr 8, 2026", amount: 567.25, method: "PayPal" },
  { user: "Bayta Darell", osm: "second_found", date: "Apr 5, 2026", amount: 289.00, method: "Wire" },
  { user: "Preem Palver", osm: "first_speaker", date: "Apr 3, 2026", amount: 142.00, method: "PayPal" },
  { user: "Ebling Mis", osm: "seldon_plan", date: "Apr 1, 2026", amount: 198.50, method: "PayPal" },
];

export default function PaymentsDemo() {
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
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
                <p className="text-muted-foreground text-sm">Manage per-task micropayment requests and hourly contractor payouts</p>
              </div>
              <Button variant="outline">Hourly Contractors</Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card className="border-kaart-orange/30">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Potential Payout</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-kaart-orange"><Val>$3,840.25</Val></div>
                  <p className="text-xs text-muted-foreground">If all users cashed in now</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending Requests</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600"><Val>3</Val></div>
                  <p className="text-xs text-muted-foreground">Total: <Val>$540.25</Val></p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Completed Payouts</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600"><Val>42</Val></div>
                  <p className="text-xs text-muted-foreground">Total: <Val>$18,420.00</Val></p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">This Month</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-kaart-orange"><Val>$2,109.50</Val></div>
                  <p className="text-xs text-muted-foreground"><Val>7</Val> payments</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Last Month</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold"><Val>$1,876.25</Val></div>
                  <p className="text-xs text-muted-foreground"><span className="text-green-600">+$233.25 increase</span></p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="flex gap-4">
              <input type="text" placeholder="Search by user or OSM username..." className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" readOnly />
              <select className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                <option>Sort by Date</option>
              </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border">
              <button className="px-4 py-2 text-sm font-medium text-kaart-orange border-b-2 border-kaart-orange">Pending Requests (3)</button>
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground">Payment History (42)</button>
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground">Archived (8)</button>
            </div>

            {/* Pending Requests Table */}
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      {["User", "OSM Username", "Date Requested", "Tasks", "Amount", "Actions"].map((col) => (
                        <th key={col} className="px-4 py-2 text-left text-xs font-semibold text-foreground">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {PENDING_REQUESTS.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium text-kaart-orange">{r.user}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{r.osm}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{r.date}</td>
                        <td className="px-4 py-3 text-sm text-foreground"><Val>{formatNumber(r.tasks)}</Val></td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground"><Val>{formatCurrency(r.amount)}</Val></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button className="px-3 py-1 text-xs rounded bg-kaart-blue text-white font-medium">Details</button>
                            <button className="px-3 py-1 text-xs rounded bg-green-600 text-white font-medium">Approve</button>
                            <button className="px-3 py-1 text-xs rounded border border-border text-muted-foreground">Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Payment History Preview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Payouts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      {["User", "OSM Username", "Date Paid", "Amount", "Method", "Status"].map((col) => (
                        <th key={col} className="px-4 py-2 text-left text-xs font-semibold text-foreground">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {PAYMENT_HISTORY.map((p, i) => (
                      <tr key={i} className="hover:bg-muted/50">
                        <td className="px-4 py-2.5 text-sm font-medium text-kaart-orange">{p.user}</td>
                        <td className="px-4 py-2.5 text-sm text-foreground">{p.osm}</td>
                        <td className="px-4 py-2.5 text-sm text-foreground">{p.date}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-foreground"><Val>{formatCurrency(p.amount)}</Val></td>
                        <td className="px-4 py-2.5 text-sm text-foreground">{p.method}</td>
                        <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">Paid</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Payment Request Details Modal */}
      <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }} />
        <div style={{ position: "relative", zIndex: 101, backgroundColor: "var(--background)", borderRadius: 12, width: 620, maxHeight: "85vh", overflow: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
          {/* Header */}
          <div style={{ padding: "20px 24px 0" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Payment Request Details</h2>
            <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "4px 0 0" }}>Hober Mallow &middot; master_trader &middot; Requested Apr 15, 2026</p>
          </div>

          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, padding: "16px 24px" }}>
            <div style={{ textAlign: "center", padding: 12, backgroundColor: "var(--muted)", borderRadius: 8 }}>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: 0 }}>Total Tasks</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)", margin: "4px 0 0" }}>47</p>
            </div>
            <div style={{ textAlign: "center", padding: 12, backgroundColor: "var(--muted)", borderRadius: 8 }}>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: 0 }}>Projects</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)", margin: "4px 0 0" }}>3</p>
            </div>
            <div style={{ textAlign: "center", padding: 12, backgroundColor: "var(--muted)", borderRadius: 8 }}>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: 0 }}>Mapping</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#ff6b35", margin: "4px 0 0" }}>$198.50</p>
            </div>
            <div style={{ textAlign: "center", padding: 12, backgroundColor: "var(--muted)", borderRadius: 8 }}>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: 0 }}>Validation</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#004e89", margin: "4px 0 0" }}>$87.00</p>
            </div>
          </div>

          {/* Total */}
          <div style={{ padding: "0 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>Total Requested</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#ff6b35" }}>$285.50</span>
          </div>

          {/* Task breakdown by project */}
          <div style={{ padding: "0 24px 16px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginBottom: 8 }}>Task Breakdown</p>
            <table style={{ width: "100%", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, color: "var(--foreground)" }}>Project</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, color: "var(--foreground)" }}>Task</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, color: "var(--foreground)" }}>Type</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, color: "var(--foreground)" }}>Mapped By</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, color: "var(--foreground)" }}>Validated By</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 600, color: "var(--foreground)" }}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { project: "Terminus Road Network", task: "#1042", type: "Mapping", mapper: "master_trader", validator: "terminus_mayor", rate: "$0.35" },
                  { project: "Terminus Road Network", task: "#1043", type: "Mapping", mapper: "master_trader", validator: "terminus_mayor", rate: "$0.35" },
                  { project: "Terminus Road Network", task: "#1044", type: "Validation", mapper: "prime_radiant", validator: "master_trader", rate: "$0.15" },
                  { project: "Trantor Underground Transit", task: "#2871", type: "Mapping", mapper: "master_trader", validator: "—", rate: "$0.50" },
                  { project: "Trantor Underground Transit", task: "#2872", type: "Mapping", mapper: "master_trader", validator: "—", rate: "$0.50" },
                  { project: "Trantor Underground Transit", task: "#2873", type: "Mapping", mapper: "master_trader", validator: "last_general", rate: "$0.50" },
                  { project: "Siwenna Access Barriers", task: "#412", type: "Mapping", mapper: "master_trader", validator: "psychohistory", rate: "$0.30" },
                  { project: "Siwenna Access Barriers", task: "#413", type: "Validation", mapper: "darell_14", validator: "master_trader", rate: "$0.15" },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px 8px", color: "var(--foreground)" }}>{row.project}</td>
                    <td style={{ padding: "6px 8px", color: "var(--muted-foreground)" }}>{row.task}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 500, backgroundColor: row.type === "Mapping" ? "rgba(255,107,53,0.1)" : "rgba(0,78,137,0.1)", color: row.type === "Mapping" ? "#ff6b35" : "#004e89" }}>
                        {row.type}
                      </span>
                    </td>
                    <td style={{ padding: "6px 8px", color: "var(--muted-foreground)" }}>{row.mapper}</td>
                    <td style={{ padding: "6px 8px", color: "var(--muted-foreground)" }}>{row.validator}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 500, color: "var(--foreground)" }}>{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 8, textAlign: "right" }}>Showing 8 of 47 tasks</p>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
            <button style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, borderRadius: 6, border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)", cursor: "pointer" }}>Export CSV</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "8px 20px", fontSize: 13, fontWeight: 500, borderRadius: 6, border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--muted-foreground)", cursor: "pointer" }}>Reject</button>
              <button style={{ padding: "8px 20px", fontSize: 13, fontWeight: 500, borderRadius: 6, border: "none", backgroundColor: "#16a34a", color: "white", cursor: "pointer" }}>Approve & Pay</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
