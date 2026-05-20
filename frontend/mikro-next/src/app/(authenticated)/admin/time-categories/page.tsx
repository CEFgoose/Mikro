import { redirect } from "next/navigation";

/**
 * Legacy URL.
 *
 * On 2026-05-19 the Time Categories management UI was folded into the
 * Categories tab on /admin/time. Anyone who bookmarked this URL during
 * the brief interval where it was a top-level page gets bounced to the
 * tab — gentler than a 404. Once the team has fully migrated mentally
 * to /admin/time?tab=categories, this whole file (and its directory)
 * can be deleted in a follow-up.
 */
export default function TimeCategoriesRedirect(): never {
  redirect("/admin/time?tab=categories");
}
