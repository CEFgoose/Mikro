"use client";

import { useMemo } from "react";
import { Select } from "@/components/ui";
import { useFetchTeams } from "@/hooks";

export interface TeamScopeSelectorProps {
  /** Currently selected team id, or null for "All teams". */
  value: number | null;
  onChange: (teamId: number | null) => void;
  /** Disabled while parent is loading / refetching. */
  disabled?: boolean;
  className?: string;
}

const ALL_TEAMS_VALUE = "__all__";

/**
 * Team picker used on the admin dashboard to scope every time-related
 * panel to a single team. "All teams" is the no-filter default. Uses
 * the same styled Select primitive as RegionFilter so the dashboard
 * toolbar reads as one cohesive filter row.
 */
export function TeamScopeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: TeamScopeSelectorProps) {
  const { data, loading } = useFetchTeams();

  const options = useMemo(() => {
    const teams = (data?.teams ?? []).slice().sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return [
      { value: ALL_TEAMS_VALUE, label: "All teams" },
      ...teams.map((t) => ({ value: String(t.id), label: t.name })),
    ];
  }, [data]);

  const selected = value == null ? ALL_TEAMS_VALUE : String(value);

  return (
    <Select
      label="Team"
      options={options}
      value={selected}
      onChange={(v) => onChange(v === ALL_TEAMS_VALUE ? null : Number(v))}
      disabled={disabled || loading}
      searchable
      className={className}
    />
  );
}
