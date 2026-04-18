"use client";

import Image from "next/image";
import { Card, CardContent, Button, Badge, Val } from "@/components/ui";
import { formatNumber, formatCurrency } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Projects", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z", active: true },
  { label: "Time", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
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

const PROJECTS = [
  { id: 14892, name: "Wakanda Vibranium Transit Network", shortName: "WKD-VT", source: "tm4", tasks: 1240, mapped: 876, validated: 612, completion: 70, mappingRate: 0.35, validationRate: 0.15, budget: 620.00, spent: 434.00, difficulty: "Medium" },
  { id: 15003, name: "Madripoor Lowtown Intersections", shortName: "MDP-LT", source: "tm4", tasks: 890, mapped: 445, validated: 298, completion: 50, mappingRate: 0.40, validationRate: 0.20, budget: 534.00, spent: 237.60, difficulty: "Hard" },
  { id: 15210, name: "Freedonia Field Road Classification", shortName: "FRD-FC", source: "tm4", tasks: 2100, mapped: 2100, validated: 1890, completion: 100, mappingRate: 0.25, validationRate: 0.10, budget: 735.00, spent: 714.00, difficulty: "Easy" },
  { id: 63061, name: "Zamunda Royal Highway Turn Restrictions", shortName: "ZMD-TR", source: "mr", tasks: 3420, mapped: 1567, validated: 1102, completion: 46, mappingRate: 0.50, validationRate: 0.25, budget: 2565.00, spent: 1059.00, difficulty: "Hard" },
  { id: 15401, name: "Genovia One-Way Streets", shortName: "GNV-OW", source: "tm4", tasks: 650, mapped: 520, validated: 480, completion: 80, mappingRate: 0.30, validationRate: 0.15, budget: 292.50, spent: 228.00, difficulty: "Medium" },
  { id: 63102, name: "Latveria Name Transliteration", shortName: "LTV-NM", source: "mr", tasks: 5800, mapped: 1740, validated: 870, completion: 30, mappingRate: 0.20, validationRate: 0.10, budget: 1740.00, spent: 435.00, difficulty: "Easy" },
  { id: 15589, name: "Elbonia Swamp Access Barriers", shortName: "ELB-AB", source: "tm4", tasks: 410, mapped: 328, validated: 246, completion: 80, mappingRate: 0.45, validationRate: 0.20, budget: 266.50, spent: 196.80, difficulty: "Medium" },
  { id: 15712, name: "Florin Speed Limit Updates", shortName: "FLR-SP", source: "tm4", tasks: 1800, mapped: 360, validated: 180, completion: 20, mappingRate: 0.30, validationRate: 0.15, budget: 810.00, spent: 135.00, difficulty: "Easy" },
  { id: 63200, name: "Sokovia Roundabout Geometry", shortName: "SKV-RB", source: "mr", tasks: 2200, mapped: 1100, validated: 880, completion: 50, mappingRate: 0.55, validationRate: 0.25, budget: 1760.00, spent: 825.00, difficulty: "Hard" },
  { id: 15890, name: "Narnia Rural Road Survey", shortName: "NRN-RR", source: "tm4", tasks: 3100, mapped: 930, validated: 465, completion: 30, mappingRate: 0.20, validationRate: 0.10, budget: 930.00, spent: 232.50, difficulty: "Easy" },
];

function ProgressBar({ mapped, validated, total }: { mapped: number; validated: number; total: number }) {
  const mappedPct = total > 0 ? (mapped / total) * 100 : 0;
  const validatedPct = total > 0 ? (validated / total) * 100 : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ width: "100%", height: 6, backgroundColor: "var(--muted)", borderRadius: 3, overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${validatedPct}%`, backgroundColor: "#004e89", borderRadius: 3 }} />
        <div style={{ width: `${mappedPct - validatedPct}%`, backgroundColor: "#ff6b35" }} />
      </div>
      <div style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--muted-foreground)" }}>
        <span><span style={{ color: "#ff6b35" }}>{mapped}</span> mapped</span>
        <span><span style={{ color: "#004e89" }}>{validated}</span> validated</span>
      </div>
    </div>
  );
}

export default function ProjectsDemo() {
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
      </aside>

      {/* Main */}
      <main style={{ paddingTop: 64, marginLeft: 180 }}>
        <div style={{ padding: 24 }}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-foreground">Projects</h1>
              <div className="flex gap-2">
                <Button>Add TM4 Project</Button>
                <Button variant="outline">Add MR Challenge</Button>
                <Button variant="outline">Sync All</Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border">
              <button className="px-4 py-2 text-sm font-medium text-kaart-orange border-b-2 border-kaart-orange">Active ({PROJECTS.length})</button>
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground">Inactive (2)</button>
            </div>

            {/* Projects Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="w-[26%] px-3 py-2 text-left text-xs font-semibold text-foreground">Project ▲</th>
                        <th className="w-[6%] px-3 py-2 text-left text-xs font-semibold text-foreground">Tasks</th>
                        <th className="w-[14%] px-3 py-2 text-left text-xs font-semibold text-foreground">Progress</th>
                        <th className="w-[6%] px-3 py-2 text-left text-xs font-semibold text-foreground">Done</th>
                        <th className="w-[11%] px-3 py-2 text-left text-xs font-semibold text-foreground">Rates</th>
                        <th className="w-[11%] px-3 py-2 text-left text-xs font-semibold text-foreground">Budget</th>
                        <th className="w-[10%] px-3 py-2 text-left text-xs font-semibold text-foreground">Difficulty</th>
                        <th className="w-[16%] px-3 py-2 text-right text-xs font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {PROJECTS.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/50">
                          <td className="px-3 py-2">
                            <div>
                              <span className="font-medium text-sm text-kaart-orange">{p.name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-muted-foreground">{p.shortName}</span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {p.source === "mr" ? "MR" : `#${p.id}`}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-foreground"><Val>{formatNumber(p.tasks)}</Val></td>
                          <td className="px-3 py-2">
                            <ProgressBar mapped={p.mapped} validated={p.validated} total={p.tasks} />
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-foreground">{p.completion}%</td>
                          <td className="px-3 py-2">
                            <div className="text-xs text-foreground">
                              <div>Map: <Val>{formatCurrency(p.mappingRate)}</Val></div>
                              <div>Val: <Val>{formatCurrency(p.validationRate)}</Val></div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-xs text-foreground">
                              <div><Val>{formatCurrency(p.spent)}</Val></div>
                              <div className="text-muted-foreground">of <Val>{formatCurrency(p.budget)}</Val></div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.difficulty === "Easy" ? "bg-green-100 text-green-800" :
                              p.difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {p.difficulty}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex gap-1 justify-end">
                              <button className="px-2 py-1 text-xs rounded border border-border text-muted-foreground hover:text-foreground">Edit</button>
                              <button className="px-2 py-1 text-xs rounded border border-border text-muted-foreground hover:text-foreground">Sync</button>
                              <button className="px-2 py-1 text-xs rounded border border-border text-muted-foreground hover:text-foreground">Users</button>
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
              <span className="text-sm text-muted-foreground">Showing 1–10 of 10 projects</span>
            </div>
          </div>
        </div>
      </main>

      {/* Add Project Modal (always open for screenshot) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Backdrop */}
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }} />

        {/* Modal */}
        <div style={{ position: "relative", zIndex: 101, backgroundColor: "var(--background)", borderRadius: 12, width: 560, maxHeight: "85vh", overflow: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
          {/* Header */}
          <div style={{ padding: "20px 24px 0" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Add New Project</h2>
            <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "4px 0 0" }}>Add a TM4 or MapRoulette project to Mikro for payment tracking</p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", margin: "16px 24px 0" }}>
            <button style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "var(--muted-foreground)" }}>Project Details</button>
            <button style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "#ff6b35", borderBottom: "2px solid #ff6b35" }}>Locations (4)</button>
            <button style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "var(--muted-foreground)" }}>Teams (2)</button>
          </div>

          {/* Locations tab body */}
          <div style={{ padding: "20px 24px" }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search countries..."
              style={{ width: "100%", padding: "8px 12px", fontSize: 13, borderRadius: 6, border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)", marginBottom: 16 }}
            />

            {/* Selected locations */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {["Wakanda", "Madripoor", "Genovia", "Zamunda"].map((c) => (
                <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", fontSize: 12, fontWeight: 500, borderRadius: 16, backgroundColor: "rgba(255, 107, 53, 0.1)", color: "#ff6b35" }}>
                  {c}
                  <span style={{ cursor: "pointer", fontSize: 14, lineHeight: 1 }}>&times;</span>
                </span>
              ))}
            </div>

            {/* Country list */}
            <div style={{ border: "1px solid var(--border)", borderRadius: 8, maxHeight: 280, overflowY: "auto" }}>
              {[
                { name: "Adrilankha", checked: false },
                { name: "Agrabah", checked: false },
                { name: "Ankh-Morpork", checked: false },
                { name: "Adua", checked: false },
                { name: "Elbonia", checked: false },
                { name: "Florin", checked: false },
                { name: "Genovia", checked: true },
                { name: "Freedonia", checked: false },
                { name: "Guilder", checked: false },
                { name: "Latveria", checked: false },
                { name: "Madripoor", checked: true },
                { name: "Narnia", checked: false },
                { name: "Petoria", checked: false },
                { name: "Sokovia", checked: false },
                { name: "Wakanda", checked: true },
                { name: "Zamunda", checked: true },
              ].map((c) => (
                <label key={c.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--border)", backgroundColor: c.checked ? "rgba(255, 107, 53, 0.05)" : "transparent" }}>
                  <input type="checkbox" defaultChecked={c.checked} style={{ accentColor: "#ff6b35" }} />
                  <span style={{ color: "var(--foreground)", fontWeight: c.checked ? 500 : 400 }}>{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
            <button style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, borderRadius: 6, border: "1px solid var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)", cursor: "pointer" }}>Cancel</button>
            <button style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, borderRadius: 6, border: "none", backgroundColor: "#ff6b35", color: "white", cursor: "pointer" }}>Create Project</button>
          </div>
        </div>
      </div>
    </div>
  );
}
