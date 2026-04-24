"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useNotificationUnreadCount,
  useNotifications,
  useMarkNotificationsRead,
} from "@/hooks";
import type { Notification } from "@/types";

/**
 * F9 — bell + dropdown panel for in-app notifications. Polls the
 * unread count every 30s while the tab is visible. Fetches the full
 * list on panel open.
 *
 * Per the comms-platform plan, in-app bell rows are ALWAYS created
 * regardless of user preferences (prefs only control email delivery).
 */

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

export function NotificationBell() {
  const router = useRouter();
  const { data: unreadData, refetch: refetchUnread } =
    useNotificationUnreadCount();
  const { mutate: fetchList } = useNotifications();
  const { mutate: markRead } = useMarkNotificationsRead();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Poll unread count every 30s while tab is visible.
  useEffect(() => {
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      refetchUnread().catch(() => {});
    };
    const id = window.setInterval(tick, 30000);
    const onVis = () => { if (document.visibilityState === "visible") refetchUnread().catch(() => {}); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refetchUnread]);

  // Close the panel when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetchList({ limit: 20, offset: 0 });
      setItems(res?.notifications || []);
    } catch {
      setItems([]);
    } finally {
      setListLoading(false);
    }
  }, [fetchList]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  const handleItemClick = async (n: Notification) => {
    // Mark as read optimistically, then navigate.
    if (!n.is_read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
      );
      try {
        await markRead({ ids: [n.id] });
        refetchUnread().catch(() => {});
      } catch {
        /* swallow — best-effort */
      }
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markRead({});
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
      refetchUnread().catch(() => {});
    } catch {
      /* swallow */
    }
  };

  const unread = unreadData?.unread_count ?? 0;

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        style={{
          position: "relative",
          width: 36,
          height: 36,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--background)",
          cursor: "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
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
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: "absolute",
            top: 44,
            right: 0,
            width: 360,
            maxHeight: 480,
            overflow: "auto",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--background)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            zIndex: 60,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
            {items.some((x) => !x.is_read) && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  fontSize: 12,
                  color: "#ff6b35",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          {listLoading ? (
            <div style={{ padding: 20, fontSize: 13, color: "var(--muted-foreground)" }}>
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: 20, fontSize: 13, color: "var(--muted-foreground)", textAlign: "center" }}>
              You&apos;re all caught up.
            </div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleItemClick(n)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 14px",
                      border: "none",
                      borderBottom: "1px solid var(--border)",
                      background: n.is_read ? "transparent" : "rgba(255,107,53,0.06)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--foreground)",
                        fontWeight: n.is_read ? 400 : 600,
                        lineHeight: 1.35,
                      }}
                    >
                      {!n.is_read && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            background: "#ff6b35",
                            marginRight: 6,
                            verticalAlign: "middle",
                          }}
                        />
                      )}
                      {n.message}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
                      {relativeTime(n.created_at)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
