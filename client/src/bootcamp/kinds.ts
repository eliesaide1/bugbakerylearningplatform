import type { StepKind, SubmissionStatus } from "@shared/types";

/** One place naming the four beats, so the rail and the panel never disagree. */
export const KIND_LABEL: Record<StepKind, string> = {
  watch: "Watch",
  read: "Read",
  task: "Build",
  bug: "Fix the bug",
  push: "Ship it",
  quiz: "Check yourself",
};

export const KIND_GLYPH: Record<StepKind, string> = {
  watch: "▶",
  read: "§",
  task: "⌘",
  bug: "!",
  push: "↑",
  quiz: "?",
};

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending: "With a reviewer",
  passed: "Passed",
  "changes-requested": "Needs another go",
  failed: "Not there yet",
};

export const STATUS_TONE: Record<SubmissionStatus, "primary" | "secondary" | "danger" | "neutral"> =
  {
    pending: "neutral",
    passed: "secondary",
    "changes-requested": "primary",
    failed: "danger",
  };

export const minutes = (n?: number) => (n ? `${n} min` : "");
