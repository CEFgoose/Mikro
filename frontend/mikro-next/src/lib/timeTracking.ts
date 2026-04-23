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
