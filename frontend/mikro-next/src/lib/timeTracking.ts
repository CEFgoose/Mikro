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
 * Category SSOT — mirrors `VALID_CATEGORIES` and `CATEGORY_DISPLAY_MAP`
 * on the backend (`backend/api/views/TimeTracking.py`). Every category
 * translation in the frontend should go through `resolveCategoryKey()`
 * or `categoryLabel()` rather than handcrafted reverse lookups, so any
 * locale-quirky `.toLowerCase()` (e.g. Turkish dotless I) or input we
 * don't recognize fails closed instead of being silently misrouted.
 */

/** Canonical category key → display label. */
export const CATEGORY_LABELS: Record<string, string> = {
  editing: "Editing",
  validating: "Validating",
  training: "Training",
  checklist: "Checklist",
  qc_review: "QC / Review",
  meeting: "Meeting",
  documentation: "Documentation",
  imagery_capture: "Imagery Capture",
  project_creation: "Project Creation",
  community: "Community",
  other: "Other",
};

/**
 * Legacy keys the backend still accepts. We don't render them in dropdowns
 * (the canonical equivalents already cover them) but if a stored entry's
 * category is one of these we display it via its canonical label.
 */
const LEGACY_CATEGORY_KEYS: Record<string, string> = {
  mapping: "editing",
  validation: "validating",
  review: "qc_review",
};

// Built once: case-insensitive label → canonical key.
const LABEL_TO_KEY: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
    out[label.toLowerCase()] = key;
  }
  return out;
})();

/**
 * Resolve any category-ish input to a canonical backend key.
 *
 * Accepts:
 * - canonical keys ("editing", "qc_review") — case-insensitive
 * - display labels ("Editing", "QC / Review") — case-insensitive
 * - legacy keys ("mapping", "validation", "review") — pass through
 * - surrounding whitespace
 *
 * Returns `null` for empty / "All" / unrecognized input. Callers should
 * treat null as "no category filter" rather than substituting a guess —
 * that's the failure mode the previous `.toLowerCase()` fallback hid.
 */
export function resolveCategoryKey(input: string | null | undefined): string | null {
  if (input == null) return null;
  const trimmed = String(input).trim().toLowerCase();
  if (!trimmed || trimmed === "all") return null;
  if (trimmed in CATEGORY_LABELS) return trimmed;
  if (trimmed in LEGACY_CATEGORY_KEYS) return trimmed;
  if (trimmed in LABEL_TO_KEY) return LABEL_TO_KEY[trimmed];
  return null;
}

/**
 * Display label for any category-ish input. Legacy keys render via their
 * canonical equivalent; unknown values get a Title-Cased fallback so the
 * UI never shows raw garbage even if a new key arrives from the backend
 * before this map is updated.
 */
export function categoryLabel(input: string | null | undefined): string {
  if (input == null) return "";
  const trimmed = String(input).trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower in CATEGORY_LABELS) return CATEGORY_LABELS[lower];
  if (lower in LEGACY_CATEGORY_KEYS) {
    return CATEGORY_LABELS[LEGACY_CATEGORY_KEYS[lower]];
  }
  if (lower in LABEL_TO_KEY) {
    return CATEGORY_LABELS[LABEL_TO_KEY[lower]];
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Filter-bar dropdown options: "All" plus every canonical label. */
export const CATEGORY_FILTER_LABELS: string[] = [
  "All",
  ...Object.values(CATEGORY_LABELS),
];

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

/** Start of the user's local NEXT Sunday — i.e. the exclusive upper
 *  bound for "this week" (Sunday–Saturday). On a Saturday this is
 *  midnight tonight; on a Sunday it's a week from now. */
export function localWeekEndIsoUtc(d: Date = new Date()): string {
  const day = d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day + 7).toISOString();
}

/** Start of the user's local Sunday N weeks ago as an ISO UTC string.
 *  weeksAgo=1 returns the Sunday that began the previous week. */
export function localWeekStartAgoIsoUtc(weeksAgo: number, d: Date = new Date()): string {
  const day = d.getDay();
  return new Date(
    d.getFullYear(), d.getMonth(),
    d.getDate() - day - 7 * weeksAgo,
  ).toISOString();
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
