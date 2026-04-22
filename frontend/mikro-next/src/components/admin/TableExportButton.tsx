"use client";

import { useCallback } from "react";
import { exportRowsAsCsv, todayIso } from "@/lib/chartExport";

/**
 * Small CSV-export button for report tables. Accepts the rows +
 * column spec the table renders with; generates the CSV in-memory
 * and triggers a download.
 *
 * Filename: `mikro-<name>-<YYYY-MM-DD>.csv`.
 */
interface Props<T extends Record<string, unknown>> {
  rows: T[];
  columns: Array<{ key: keyof T & string; label: string }>;
  /** Human-readable filename stem, e.g. "editing-projects". */
  filename: string;
  className?: string;
  disabled?: boolean;
}

export function TableExportButton<T extends Record<string, unknown>>({
  rows,
  columns,
  filename,
  className,
  disabled,
}: Props<T>) {
  const onClick = useCallback(() => {
    exportRowsAsCsv(rows, columns, `mikro-${filename}-${todayIso()}.csv`);
  }, [rows, columns, filename]);

  const isEmpty = !rows.length;
  const isDisabled = disabled || isEmpty;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={
        "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-kaart-orange transition-colors px-2 py-1 rounded border border-border hover:border-kaart-orange bg-background/80 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-muted-foreground disabled:hover:border-border" +
        (className ? ` ${className}` : "")
      }
      title={isEmpty ? "No rows to export" : "Download table as CSV"}
      aria-label="Download table as CSV"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
      CSV
    </button>
  );
}
