"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  useConversations,
  useMessageThread,
  useSendMessage,
  useMarkMessagesRead,
  useMessagesContacts,
  useFetchTeams,
  useFetchRegions,
} from "@/hooks";
import type {
  Conversation,
  Message,
  MessageScopeType,
  TeamsResponse,
  RegionsResponse,
  MessagesContact,
} from "@/types";
import { useUserDetails } from "@/hooks";

/*
 * Messenger page — two-pane layout. Left: conversation list grouped
 * by scope. Right: thread view + composer. Polls the active thread
 * every 5s while open; conversation list refreshes every 30s.
 *
 * Targets: user (DM), team, region, org. Admin sees all scopes; plain
 * users see their own DMs + their teams + their region + org.
 */

const TARGET_LABELS: Record<MessageScopeType, string> = {
  user: "Direct Messages",
  team: "Teams",
  region: "Regions",
  org: "Organization",
};

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function MessagesPageInner() {
  const params = useSearchParams();
  const initialScopeType = (params.get("scope_type") || "") as MessageScopeType | "";
  const initialScopeKey = params.get("scope_key") || "";

  const { data: me } = useUserDetails();
  const { data: convData, refetch: refetchConversations } = useConversations();
  const { mutate: fetchThread } = useMessageThread();
  const { mutate: sendMessage, loading: sending } = useSendMessage();
  const { mutate: markRead } = useMarkMessagesRead();

  const [selected, setSelected] = useState<{
    scope_type: MessageScopeType;
    scope_key: string;
    label: string;
  } | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [composer, setComposer] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const conversations: Conversation[] = useMemo(
    () => convData?.conversations ?? [],
    [convData]
  );

  // Auto-select from URL on first load if provided.
  useEffect(() => {
    if (selected) return;
    if (initialScopeType && initialScopeKey && conversations.length > 0) {
      const match = conversations.find(
        (c) => c.scope_type === initialScopeType && c.scope_key === initialScopeKey
      );
      if (match) {
        setSelected({
          scope_type: match.scope_type,
          scope_key: match.scope_key,
          label: match.label,
        });
        return;
      }
      // Not in the list yet (first message never sent) — still select it.
      setSelected({
        scope_type: initialScopeType,
        scope_key: initialScopeKey,
        label: "Conversation",
      });
    }
  }, [conversations, initialScopeKey, initialScopeType, selected]);

  // Poll conversation list every 30s.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refetchConversations().catch(() => {});
      }
    }, 30000);
    return () => window.clearInterval(id);
  }, [refetchConversations]);

  const loadThread = useCallback(async () => {
    if (!selected) return;
    setThreadLoading(true);
    try {
      const res = await fetchThread({
        scope_type: selected.scope_type,
        scope_key: selected.scope_key,
        limit: 100,
        offset: 0,
      });
      setThread(res?.messages || []);
    } catch {
      setThread([]);
    } finally {
      setThreadLoading(false);
    }
  }, [selected, fetchThread]);

  // Load + poll the selected thread.
  useEffect(() => {
    if (!selected) {
      setThread([]);
      return;
    }
    loadThread();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") loadThread();
    }, 5000);
    return () => window.clearInterval(id);
  }, [selected, loadThread]);

  // Mark read on open + when new messages arrive.
  useEffect(() => {
    if (!selected || thread.length === 0) return;
    markRead({
      scope_type: selected.scope_type,
      scope_key: selected.scope_key,
    })
      .catch(() => {})
      .then(() => refetchConversations().catch(() => {}));
  }, [selected, thread.length, markRead, refetchConversations]);

  // Autoscroll to bottom on new messages.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length]);

  const handleSend = async () => {
    if (!selected || !composer.trim()) return;
    const body: Record<string, unknown> = {
      target_type: selected.scope_type,
      content: composer.trim(),
    };
    if (selected.scope_type === "user") body.target_user_id = selected.scope_key;
    if (selected.scope_type === "team") body.target_team_id = Number(selected.scope_key);
    if (selected.scope_type === "region") body.target_region_id = Number(selected.scope_key);
    try {
      await sendMessage(body);
      setComposer("");
      await loadThread();
      refetchConversations().catch(() => {});
    } catch {
      /* toast would be nice — add later */
    }
  };

  const grouped = useMemo(() => {
    const g: Record<MessageScopeType, Conversation[]> = {
      user: [],
      team: [],
      region: [],
      org: [],
    };
    conversations.forEach((c) => g[c.scope_type].push(c));
    return g;
  }, [conversations]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, height: "calc(100vh - 64px - 48px)" }}>
      {/* Left pane: conversation list */}
      <div
        style={{
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div style={{ padding: 12, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Messages</h2>
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 600,
              background: "#ff6b35",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            + New
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {(["user", "team", "region", "org"] as MessageScopeType[]).map((scope) => {
            const rows = grouped[scope];
            if (rows.length === 0) return null;
            return (
              <div key={scope}>
                <div
                  style={{
                    padding: "8px 12px",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: "var(--muted-foreground)",
                    background: "var(--muted)",
                  }}
                >
                  {TARGET_LABELS[scope]}
                </div>
                {rows.map((c) => {
                  const isActive =
                    selected?.scope_type === c.scope_type &&
                    selected.scope_key === c.scope_key;
                  return (
                    <button
                      key={`${c.scope_type}:${c.scope_key}`}
                      onClick={() =>
                        setSelected({
                          scope_type: c.scope_type,
                          scope_key: c.scope_key,
                          label: c.label,
                        })
                      }
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        border: "none",
                        borderBottom: "1px solid var(--border)",
                        background: isActive ? "rgba(255,107,53,0.1)" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{c.label}</span>
                        {c.unread_count > 0 && (
                          <span
                            style={{
                              minWidth: 18,
                              height: 18,
                              padding: "0 5px",
                              borderRadius: 9,
                              background: "#dc2626",
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {c.unread_count > 99 ? "99+" : c.unread_count}
                          </span>
                        )}
                      </div>
                      {c.last_message && (
                        <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <span style={{ fontWeight: 500 }}>{c.last_message.sender_name}:</span>{" "}
                          {c.last_message.content}
                        </div>
                      )}
                      {c.last_message && (
                        <div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 2 }}>
                          {relativeTime(c.last_message.created_at)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
          {conversations.length === 0 && (
            <div style={{ padding: 20, fontSize: 13, color: "var(--muted-foreground)" }}>
              No conversations yet. Click <strong>+ New</strong> to start one.
            </div>
          )}
        </div>
      </div>

      {/* Right pane: thread view */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        {!selected ? (
          <div style={{ padding: 40, color: "var(--muted-foreground)", textAlign: "center" }}>
            Select a conversation to view messages, or start a new one.
          </div>
        ) : (
          <>
            <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{selected.label}</h3>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {threadLoading && thread.length === 0 ? (
                <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>Loading…</p>
              ) : thread.length === 0 ? (
                <p style={{ color: "var(--muted-foreground)", fontSize: 13, textAlign: "center" }}>
                  No messages yet — say hi.
                </p>
              ) : (
                thread.map((m) => {
                  const isMe = m.sender_id === me?.id;
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isMe ? "flex-end" : "flex-start",
                        maxWidth: "70%",
                        background: isMe ? "#ff6b35" : "var(--muted)",
                        color: isMe ? "#fff" : "var(--foreground)",
                        padding: "8px 12px",
                        borderRadius: 12,
                        borderBottomLeftRadius: isMe ? 12 : 4,
                        borderBottomRightRadius: isMe ? 4 : 12,
                        wordBreak: "break-word",
                      }}
                    >
                      {!isMe && (
                        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2, opacity: 0.8 }}>
                          {m.sender_name}
                        </div>
                      )}
                      <div style={{ fontSize: 13, lineHeight: 1.4 }}>{m.content}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                        {relativeTime(m.created_at)}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={threadEndRef} />
            </div>
            <div style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
              <textarea
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                rows={2}
                style={{
                  flex: 1,
                  resize: "none",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!composer.trim() || sending}
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  background: "#ff6b35",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: composer.trim() && !sending ? "pointer" : "not-allowed",
                  opacity: composer.trim() && !sending ? 1 : 0.6,
                }}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {showNewModal && (
        <NewMessageModal
          onClose={() => setShowNewModal(false)}
          onStarted={(scope) => {
            setShowNewModal(false);
            setSelected(scope);
          }}
          isAdmin={me?.role === "admin"}
        />
      )}
    </div>
  );
}

function NewMessageModal({
  onClose,
  onStarted,
  isAdmin,
}: {
  onClose: () => void;
  onStarted: (scope: { scope_type: MessageScopeType; scope_key: string; label: string }) => void;
  isAdmin: boolean;
}) {
  const [tab, setTab] = useState<MessageScopeType>("user");
  const { data: contactsData } = useMessagesContacts();
  const { data: teamsData } = useFetchTeams();
  const { data: regionsData } = useFetchRegions();
  const [search, setSearch] = useState("");

  const contacts: MessagesContact[] = contactsData?.contacts ?? [];
  const teams = (teamsData as TeamsResponse | null | undefined)?.teams ?? [];
  const regions = (regionsData as RegionsResponse | null | undefined)?.regions ?? [];

  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  // Org-wide broadcasts don't appear here — admins use the
  // "Organization" entry in the sidebar directly (the backend always
  // lists one org conversation per user with the real org_id as scope).
  const tabs: { key: MessageScopeType; label: string; enabled: boolean }[] = [
    { key: "user", label: "Direct Message", enabled: true },
    { key: "team", label: "Team", enabled: true },
    { key: "region", label: "Region", enabled: isAdmin },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480,
          maxWidth: "90vw",
          background: "var(--background)",
          borderRadius: 10,
          border: "1px solid var(--border)",
          padding: 20,
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        }}
      >
        <h2 style={{ margin: "0 0 12px 0", fontSize: 18 }}>Start a Conversation</h2>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => t.enabled && setTab(t.key)}
              disabled={!t.enabled}
              title={!t.enabled ? "Admin only" : undefined}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: tab === t.key ? "#ff6b35" : "transparent",
                color: tab === t.key ? "#fff" : t.enabled ? "var(--foreground)" : "var(--muted-foreground)",
                cursor: t.enabled ? "pointer" : "not-allowed",
                opacity: t.enabled ? 1 : 0.5,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "user" && (
          <>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people…"
              style={{
                width: "100%",
                padding: 8,
                fontSize: 13,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
                marginBottom: 8,
              }}
            />
            <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 6 }}>
              {filteredContacts.length === 0 ? (
                <div style={{ padding: 16, color: "var(--muted-foreground)", fontSize: 13, textAlign: "center" }}>
                  No matches.
                </div>
              ) : (
                filteredContacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      onStarted({ scope_type: "user", scope_key: c.id, label: c.name })
                    }
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      border: "none",
                      borderBottom: "1px solid var(--border)",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{c.email}</div>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {tab === "team" && (
          <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 6 }}>
            {teams.length === 0 ? (
              <div style={{ padding: 16, color: "var(--muted-foreground)", fontSize: 13, textAlign: "center" }}>
                No teams available.
              </div>
            ) : (
              teams.map((t: { id: number; name: string }) => (
                <button
                  key={t.id}
                  onClick={() =>
                    onStarted({ scope_type: "team", scope_key: String(t.id), label: t.name })
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {t.name}
                </button>
              ))
            )}
          </div>
        )}

        {tab === "region" && (
          <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 6 }}>
            {regions.length === 0 ? (
              <div style={{ padding: 16, color: "var(--muted-foreground)", fontSize: 13, textAlign: "center" }}>
                No regions available.
              </div>
            ) : (
              regions.map((r: { id: number; name: string }) => (
                <button
                  key={r.id}
                  onClick={() =>
                    onStarted({ scope_type: "region", scope_key: String(r.id), label: r.name })
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {r.name}
                </button>
              ))
            )}
          </div>
        )}

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              padding: "6px 12px",
              fontSize: 13,
              background: "transparent",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesPageInner />
    </Suspense>
  );
}
