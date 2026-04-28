/**
 * Shared time tracking constants — single source of truth for all clock widgets.
 */

export const TOPIC_OPTIONS = [
  { value: "editing", label: "Editing" },
  { value: "validating", label: "Validating" },
  { value: "training", label: "Training" },
  { value: "checklist", label: "Checklist" },
  { value: "qc_review", label: "QC / Review" },
  { value: "meeting", label: "Meeting" },
  { value: "documentation", label: "Documentation" },
  { value: "imagery_capture", label: "Imagery Capture" },
  { value: "project_creation", label: "Project Creation" },
  // Added 2026-04 per F10 — covers Jorge's community-discussion /
  // outreach work that previously had no trackable category.
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
] as const;

/** Topics that require a project to be selected before clocking in */
export const PROJECT_REQUIRED_TOPICS = ["editing", "validating", "qc_review"];

export function topicRequiresProject(topic: string): boolean {
  return PROJECT_REQUIRED_TOPICS.includes(topic);
}

/**
 * SSOT duration formatter — `HH:MM:SS` everywhere, app-wide.
 *
 * Both live timers and completed/aggregated durations share this format
 * so the time-tracking UI is visually consistent.
 *
 * Returns "--:--:--" for null/invalid input.
 *
 * Aliases `formatDurationHM` and `formatLiveDuration` are retained for
 * backwards compatibility with existing imports — they all resolve here.
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds) || seconds < 0) return "--:--:--";
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Aliases — same function, kept so existing import sites still work.
export const formatDurationHM = formatDuration;
export const formatLiveDuration = formatDuration;

/*
 * Timezone-correct filter-window helpers.
 *
 * Backend filters time entries against UTC-stored `clock_in`. The frontend
 * sends ISO UTC *instants* aligned to the user's browser-local midnights —
 * e.g. in Manila (UTC+8), the local start of 2026-04-23 becomes
 * "2026-04-22T16:00:00.000Z" on the wire. Backend receives the explicit
 * instant and filters without adding a day.
 */

/** Start of the user's local day as an ISO UTC string (inclusive bound). */
export function localDayStartIsoUtc(d: Date = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

/** Start of the user's local NEXT day as an ISO UTC string (exclusive upper bound). */
export function localDayEndIsoUtc(d: Date = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
}

/** Start of the user's local week (Sunday) as an ISO UTC string. */
export function localWeekStartIsoUtc(d: Date = new Date()): string {
  const day = d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day).toISOString();
}

/** Start of the user's local month as an ISO UTC string. */
export function localMonthStartIsoUtc(d: Date = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

/** Start of the user's local NEXT month as an ISO UTC string (exclusive upper bound). */
export function localMonthEndIsoUtc(d: Date = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
}

/** Start of the user's local month N months ago as an ISO UTC string. */
export function localMonthStartAgoIsoUtc(monthsAgo: number, d: Date = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth() - monthsAgo, 1).toISOString();
}

/**
 * Convert a "YYYY-MM-DD" string (from <input type="date">) to the ISO UTC
 * instant that is local midnight of that calendar day. Undefined/empty input
 * returns null.
 */
export function dateInputToLocalStartIsoUtc(input: string | null | undefined): string | null {
  if (!input) return null;
  const [y, m, d] = input.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toISOString();
}

/**
 * Exclusive upper bound: local midnight of the day AFTER the picked day.
 * Intended for backend windows like `column < endIsoUtc`.
 */
export function dateInputToLocalEndIsoUtc(input: string | null | undefined): string | null {
  if (!input) return null;
  const [y, m, d] = input.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d + 1).toISOString();
}
