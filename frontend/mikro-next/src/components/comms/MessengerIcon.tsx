"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useMessagesUnreadCount } from "@/hooks";

/**
 * Sidebar/header shortcut to the messenger page. Shows a red badge
 * with the user's total unread message count across all conversations.
 * Polls the count every 30s while the tab is visible.
 */
export function MessengerIcon() {
  const { data, refetch } = useMessagesUnreadCount();

  useEffect(() => {
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      refetch().catch(() => {});
    };
    const id = window.setInterval(tick, 30000);
    const onVis = () => {
      if (document.visibilityState === "visible") refetch().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refetch]);

  const unread = data?.unread_count ?? 0;

  return (
    <Link
      href="/messages"
      aria-label={unread > 0 ? `Messages (${unread} unread)` : "Messages"}
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
        color: "var(--foreground)",
        textDecoration: "none",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
    </Link>
  );
}
