"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, useToastActions } from "@/components/ui";
import {
  useEmailCampaignsList,
  useCreateEmailCampaign,
  usePreviewEmailCampaign,
  useFetchTeams,
  useFetchRegions,
} from "@/hooks";
import type { TeamsResponse, RegionsResponse, EmailCampaign } from "@/types";

/**
 * Admin-only email campaign composer + history (F21 etc). Sends a
 * templated HTML email to an audience (all_org / team:{id} / region:{id}).
 * Respects notify_announcement prefs unless "force delivery" is checked.
 */

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function audienceLabel(a: string, teams: { id: number; name: string }[], regions: { id: number; name: string }[]): string {
  if (a === "all_org") return "All Organization";
  if (a.startsWith("team:")) {
    const id = Number(a.slice(5));
    const team = teams.find((t) => t.id === id);
    return team ? `Team: ${team.name}` : a;
  }
  if (a.startsWith("region:")) {
    const id = Number(a.slice(7));
    const region = regions.find((r) => r.id === id);
    return region ? `Region: ${region.name}` : a;
  }
  return a;
}

export default function AnnouncementsPage() {
  const toast = useToastActions();
  const { data: listData, refetch: refetchList } = useEmailCampaignsList();
  const { mutate: createCampaign, loading: sending } = useCreateEmailCampaign();
  const { mutate: previewCampaign } = usePreviewEmailCampaign();
  const { data: teamsData } = useFetchTeams();
  const { data: regionsData } = useFetchRegions();

  const teams = (teamsData as TeamsResponse | null | undefined)?.teams ?? [];
  const regions = (regionsData as RegionsResponse | null | undefined)?.regions ?? [];

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all_org");
  const [isForced, setIsForced] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const campaigns: EmailCampaign[] = listData?.campaigns ?? [];

  // Refresh preview count when audience/force changes.
  useEffect(() => {
    if (!audience) return;
    previewCampaign({ audience, is_forced: isForced })
      .then((res) => setPreviewCount(res?.recipient_count ?? null))
      .catch(() => setPreviewCount(null));
  }, [audience, isForced, previewCampaign]);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required.");
      return;
    }
    try {
      const result = await createCampaign({
        subject: subject.trim(),
        body_html: body,
        audience,
        is_forced: isForced,
      });
      toast.success(`Sent to ${result?.recipient_count ?? "?"} recipients`);
      setSubject("");
      setBody("");
      setIsForced(false);
      refetchList().catch(() => {});
    } catch {
      toast.error("Failed to send campaign.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground" style={{ marginTop: 8 }}>
          Compose and send emails to members of your organization.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: "grid", gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Subject</div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's the subject line?"
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: 14,
                }}
              />
            </label>

            <label>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Body (HTML supported)
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="<p>Message content…</p>"
                rows={10}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontFamily: "monospace",
                  fontSize: 13,
                  resize: "vertical",
                }}
              />
            </label>

            <label>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Audience</div>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: 14,
                }}
              >
                <option value="all_org">All Organization</option>
                <optgroup label="Teams">
                  {teams.map((t: { id: number; name: string }) => (
                    <option key={`team-${t.id}`} value={`team:${t.id}`}>
                      Team: {t.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Regions">
                  {regions.map((r: { id: number; name: string }) => (
                    <option key={`region-${r.id}`} value={`region:${r.id}`}>
                      Region: {r.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={isForced}
                onChange={(e) => setIsForced(e.target.checked)}
              />
              <span>
                Force delivery (bypass per-user opt-out).{" "}
                <em style={{ color: "var(--muted-foreground)" }}>
                  Use sparingly — only for payroll-critical or legal comms.
                </em>
              </span>
            </label>

            <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
              Preview recipients:{" "}
              <strong>
                {previewCount ?? "—"}{" "}
              </strong>
              {isForced ? "(forced — bypasses prefs)" : "(honors per-user prefs)"}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()}>
                {sending ? "Sending…" : "Send Campaign"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
              No campaigns sent yet.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: 8 }}>Subject</th>
                    <th style={{ padding: 8 }}>Audience</th>
                    <th style={{ padding: 8 }}>Recipients</th>
                    <th style={{ padding: 8 }}>Sent By</th>
                    <th style={{ padding: 8 }}>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: 8 }}>
                        {c.subject}
                        {c.is_forced && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: "#dc2626", fontWeight: 600 }}>
                            FORCED
                          </span>
                        )}
                      </td>
                      <td style={{ padding: 8 }}>{audienceLabel(c.audience, teams, regions)}</td>
                      <td style={{ padding: 8 }}>{c.recipient_count ?? "—"}</td>
                      <td style={{ padding: 8 }}>{c.sent_by_name ?? "—"}</td>
                      <td style={{ padding: 8 }}>{formatDateTime(c.sent_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
