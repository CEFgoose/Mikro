"use client";

import { useFetchTeams } from "@/hooks";

export interface TeamScopeSelectorProps {
  /** Currently selected team id, or null for "All teams". */
  value: number | null;
  onChange: (teamId: number | null) => void;
  /** Disabled while parent is loading / refetching. */
  disabled?: boolean;
  className?: string;
}

/**
 * Compact team picker used on the admin dashboard to scope every
 * time-related panel to a single team. "All teams" is the no-filter
 * default. Renders a `<select>`; falls back gracefully while the team
 * list is loading by showing a disabled placeholder.
 */
export function TeamScopeSelector({
  value,
  onChange,
  disabled = false,
  className = "",
}: TeamScopeSelectorProps) {
  const { data, loading } = useFetchTeams();
  const teams = data?.teams ?? [];

  const selectValue = value == null ? "all" : String(value);

  return (
    <label
      className={`inline-flex items-center gap-2 text-xs text-muted-foreground ${className}`}
    >
      <span>Team scope:</span>
      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "all" ? null : parseInt(v, 10));
        }}
        disabled={disabled || loading}
        className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
      >
        <option value="all">All teams</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}
