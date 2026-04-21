"use client";

import type { ActiveFilter } from "@/hooks/useFilters";

/**
 * Single source of truth for what filters are currently applied on the
 * Time Management page. Renders one removable pill per active filter;
 * renders nothing when no filter is active.
 *
 * Drives the visual answer to "what am I looking at right now?" —
 * before this existed, an admin had to peer at every control on the
 * filter panel to figure out what was in scope.
 */

interface Props {
  dateLabel: string | null;
  onClearDate: () => void;
  userSearch: string;
  onClearUserSearch: () => void;
  category: string;
  onClearCategory: () => void;
  activeFilters: ActiveFilter[];
  onRemoveFilter: (key: string, value: string) => void;
  onClearAll: () => void;
}

function titleCase(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

interface PillProps {
  label: string;
  value: string;
  onRemove: () => void;
}

function FilterPill({ label, value, onRemove }: PillProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-input bg-muted/50 px-2.5 py-0.5 text-xs font-medium">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
        aria-label={`Remove ${label} filter`}
      >
        ×
      </button>
    </span>
  );
}

export function TimeManagementFilterSummary({
  dateLabel,
  onClearDate,
  userSearch,
  onClearUserSearch,
  category,
  onClearCategory,
  activeFilters,
  onRemoveFilter,
  onClearAll,
}: Props) {
  const pills: PillProps[] = [];

  if (dateLabel) {
    pills.push({
      label: "Date",
      value: dateLabel,
      onRemove: onClearDate,
    });
  }

  if (userSearch.trim()) {
    pills.push({
      label: "User",
      value: userSearch.trim(),
      onRemove: onClearUserSearch,
    });
  }

  if (category && category !== "All") {
    pills.push({
      label: "Category",
      value: category,
      onRemove: onClearCategory,
    });
  }

  for (const f of activeFilters) {
    if (!f.values || f.values.length === 0) continue;
    for (const value of f.values) {
      pills.push({
        label: titleCase(f.key),
        value,
        onRemove: () => onRemoveFilter(f.key, value),
      });
    }
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase">
        Active:
      </span>
      {pills.map((p, i) => (
        <FilterPill key={`${p.label}-${p.value}-${i}`} {...p} />
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-1 text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-2"
      >
        Clear all
      </button>
    </div>
  );
}
