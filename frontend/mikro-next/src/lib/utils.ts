import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes.
 * Combines clsx for conditional classes with tailwind-merge
 * to properly handle Tailwind class conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with thousand separators (e.g., 1234 → "1,234").
 * Returns "0" for null/undefined/NaN.
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "0";
  return value.toLocaleString("en-US");
}

/**
 * Format a number as USD currency (e.g., 1234.5 → "$1,234.50").
 */
export function formatCurrency(amount: number | null | undefined): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount ?? 0);
}

/**
 * Build the canonical TM4 project URL from a project ID.
 * Always returns `https://tasks.kaart.com/projects/{id}` regardless
 * of whatever URL string might be stored in the database.
 */
export function getTM4ProjectUrl(projectId: number | string): string {
  return `https://tasks.kaart.com/projects/${projectId}`;
}

/**
 * Build the external URL for a project based on its source platform.
 * TM4 projects link to tasks.kaart.com, MR projects link to maproulette.org.
 */
export function getProjectExternalUrl(
  projectId: number | string,
  source?: string
): string {
  if (source === "mr") {
    return `https://maproulette.org/browse/challenges/${projectId}`;
  }
  return `https://tasks.kaart.com/projects/${projectId}`;
}
