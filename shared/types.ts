/**
 * Every interface the API exchanges with the two frontends. Shared by the
 * public site and the CMS so they can never drift apart.
 */
import type { SectionTheme, ThemeTokens } from "./styles";

export type { SectionTheme, ThemeTokens };

export type SectionType =
  | "rich"
  | "cards"
  | "week"
  | "steps"
  | "split"
  | "video"
  | "gallery"
  | "quote"
  | "cta"
  | "callout"
  | "programs"
  | "bootcamp"
  | "faq"
  | "builder";

export type TechGroup = "front" | "back" | "data" | "mobile" | "ai" | "ops";

export type MediaKind = "image" | "video" | "file";

export type LessonSource = "upload" | "youtube" | "vimeo" | "url";

export type LeadStatus = "new" | "contacted" | "enrolled" | "closed";

export type UserRole = "admin" | "editor" | "trainee";

export interface Media {
  id: string;
  filename: string;
  originalName?: string;
  kind: MediaKind;
  mimeType?: string;
  size?: number;
  url: string;
  alt: string;
  folder: string;
  createdAt: string;
  updatedAt: string;
}

/** A populated reference comes back as an object, an unpopulated one as an id. */
export type Ref<T> = T | string | null;

export interface SectionItem {
  _id?: string;
  title?: string;
  text?: string;
  /** Bullet lines, one per line. */
  meta?: string;
  /** Small pill above the title. */
  badge?: string;
  /** Lifts this card above its siblings. */
  featured?: boolean;
  price?: string;
  priceNote?: string;
  ctaLabel?: string;
  href?: string;
  media?: Ref<Media>;
}

export interface Section {
  id: string;
  slug: string;
  type: SectionType;
  theme: SectionTheme;
  navLabel?: string;
  eyebrow?: string;
  title?: string;
  lede?: string;
  body?: string;
  items: SectionItem[];
  media?: Ref<Media>;
  videoUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  order: number;
  visible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  program: string;
  title: string;
  slug: string;
  description?: string;
  source: LessonSource;
  media?: Ref<Media>;
  videoUrl?: string;
  thumbnail?: Ref<Media>;
  duration?: string;
  /** Index into the program's `modules`, or null when unassigned. */
  module?: number | null;
  isFree: boolean;
  locked?: boolean;
  order: number;
  visible: boolean;
}

export interface LessonWithProgram extends Lesson {
  program: string;
  programInfo?: { id: string; title: string; slug: string };
}

/** One unit of a curriculum: a stretch of the course with its own topics. */
export interface ProgramModule {
  _id?: string;
  title: string;
  summary?: string;
  duration?: string;
  topics: string[];
}

export interface Program {
  id: string;
  title: string;
  slug: string;
  stack?: string;
  summary?: string;
  instructor?: string;
  badge?: string;
  price?: string;
  originalPrice?: string;
  outcomes: string[];
  modules: ProgramModule[];
  level?: string;
  length?: string;
  prerequisite?: string;
  finishWith?: string;
  cover?: Ref<Media>;
  order: number;
  visible: boolean;
  preview?: Lesson | null;
  lessons?: Lesson[];
  /** Totals computed by the API so the listing can show them without the lessons. */
  lessonCount?: number;
  freeCount?: number;
  runtime?: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  order: number;
  visible: boolean;
}

export interface Technology {
  id: string;
  name: string;
  group: TechGroup;
  weight: number;
  order: number;
  visible: boolean;
}

export interface Cta {
  label?: string;
  href?: string;
}

export interface HeroStat {
  value?: string;
  label?: string;
}

export interface WeekDay {
  day?: string;
  label?: string;
  highlight?: boolean;
}

export interface Announcement {
  text?: string;
  href?: string;
  active?: boolean;
}

export interface SiteSettings {
  id: string;
  brandName: string;
  brandTagline: string;
  logo?: Ref<Media>;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: Ref<Media>;
  heroTitle?: string;
  heroHighlight?: string;
  heroLede?: string;
  heroPrimaryCta?: Cta;
  heroSecondaryCta?: Cta;
  heroStats: HeroStat[];
  heroMedia?: Ref<Media>;
  week: WeekDay[];
  builderTitle?: string;
  builderNote?: string;
  enrollTitle?: string;
  enrollLede?: string;
  email?: string;
  whatsapp?: string;
  linkedin?: string;
  location?: string;
  footerNote?: string;
  announcement?: Announcement;
}

/** The theme document as stored: the tokens plus its own id. */
export interface Theme extends ThemeTokens {
  id: string;
  updatedAt?: string;
}

/** One request paints the whole landing page. */
export interface SitePayload {
  settings: SiteSettings;
  theme: Theme;
  sections: Section[];
  programs: Program[];
  faqs: Faq[];
  technologies: Technology[];
  generatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  program?: string;
  format?: string;
  message?: string;
  technologies: string[];
  estimatedWeeks?: number;
  source: "enroll" | "builder";
  status: LeadStatus;
  notes?: string;
  createdAt: string;
}

export interface LeadInput {
  name: string;
  email: string;
  phone?: string;
  program?: string;
  format?: string;
  message?: string;
  technologies?: string[];
  estimatedWeeks?: number;
  source?: "enroll" | "builder";
}

/* ---------------- 1:1 booking ---------------- */

export interface AvailabilityRule {
  /** 0 = Sunday, matching Date#getDay. */
  day: number;
  enabled: boolean;
  start: string;
  end: string;
}

export interface Availability {
  id: string;
  timezone: string;
  slotMinutes: number;
  leadTimeHours: number;
  horizonDays: number;
  week: AvailabilityRule[];
  /** "YYYY-MM-DD" dates closed regardless of the weekly hours. */
  blockedDates: string[];
  note?: string;
  price?: string;
  priceNote?: string;
}

/** An open slot, as UTC instants for the browser to show in local time. */
export interface Slot {
  start: string;
  end: string;
  date: string;
}

export interface SlotsPayload {
  timezone: string;
  slotMinutes: number;
  note?: string;
  price?: string;
  priceNote?: string;
  slots: Slot[];
}

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone?: string;
  program?: string;
  note?: string;
  start: string;
  end: string;
  timezone?: string;
  status: BookingStatus;
  createdAt: string;
}

export interface BookingInput {
  name: string;
  email: string;
  phone?: string;
  program?: string;
  note?: string;
  start: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLoginAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/* ---------------- realtime ---------------- */

export type ChangeAction = "created" | "updated" | "deleted" | "reordered";

/** Broadcast on every write. `resource` matches the query key to invalidate. */
export interface ContentChange<T = unknown> {
  resource: string;
  action: ChangeAction;
  id: string | null;
  doc: T | null;
  at: string;
}

export interface PresencePayload {
  editors: Array<{ id: string; name: string }>;
  count: number;
}

export interface EditingPayload {
  resource: string;
  id: string;
  user: { id: string; name: string };
}

/* ---------------- api plumbing ---------------- */

export interface ApiErrorBody {
  error: string;
  fields?: Record<string, string[]>;
}

export interface OkResponse {
  ok: boolean;
  id?: string;
}

/* ---------------- bootcamp ---------------- */

/** What a trainee does at one point in a track. */
export type StepKind = "watch" | "read" | "task" | "bug" | "push" | "quiz";

export type CheckKind = "contains" | "not-contains" | "regex";

/**
 * A deterministic pass/fail rule the server runs against a submission before
 * any AI sees it. Instant, free, and it cannot hallucinate — which is why the
 * hard requirements of a step belong here rather than in the rubric.
 */
export interface StepCheck {
  _id?: string;
  kind: CheckKind;
  /** The literal string, or the regex source when `kind` is "regex". */
  value: string;
  /** Shown to the trainee when this check fails. */
  message?: string;
  caseSensitive?: boolean;
  /** Which part of the submission to test. */
  field?: "code" | "notes" | "repoUrl" | "commitUrl" | "any";
}

/** The planted defect a "bug" step asks the trainee to fix. */
export interface BugScenario {
  language?: string;
  filename?: string;
  /** The broken source the trainee is handed. */
  code?: string;
  /** What the user of the app sees going wrong. */
  symptom?: string;
  stackTrace?: string;
  hints: string[];
  /** Never sent to the public API — it is the answer key. */
  rootCause?: string;
  /** Plain-language conditions a correct fix satisfies, fed to the reviewer. */
  acceptance: string[];
}

export interface PushRequirement {
  branch?: string;
  commitMessage?: string;
  requireRepoUrl?: boolean;
  requireCommitUrl?: boolean;
}

export interface QuizQuestion {
  _id?: string;
  prompt: string;
  /** Answer key. Stripped from the public payload. */
  expected?: string;
}

export interface Step {
  id: string;
  track: string;
  kind: StepKind;
  title: string;
  slug: string;
  summary?: string;
  /** The full instructions, paragraphs separated by blank lines. */
  brief?: string;
  estimateMinutes?: number;
  points: number;
  /** Which week of the track this belongs to. 1-based. */
  week: number;

  /** watch: an existing lesson, or a link of its own. */
  lesson?: Ref<Lesson>;
  videoUrl?: string;

  /** task: what the trainee hands back. */
  deliverables: string[];
  starterRepo?: string;

  bug?: BugScenario;
  push?: PushRequirement;
  quiz: QuizQuestion[];

  checks: StepCheck[];
  /** Free text telling the AI reviewer what a good answer looks like. */
  rubric?: string;
  /** Steps like "watch" finish with a button rather than a submission. */
  requiresSubmission: boolean;
  /** A milestone always goes to a human, whatever the checks and AI said. */
  milestone: boolean;
  /** Trainees who passed this step may review other people's attempts at it. */
  peerReviewable: boolean;
  order: number;
  visible: boolean;
}

/** A step as the public API serves it: answer keys removed. */
export interface PublicStep extends Omit<Step, "bug" | "quiz" | "checks" | "rubric"> {
  bug?: Omit<BugScenario, "rootCause">;
  quiz: Array<Omit<QuizQuestion, "expected">>;
}

export type TrackGate = "sequential" | "open";

export interface TrackProtection {
  blockCopy: boolean;
  blockPaste: boolean;
  deterScreenshots: boolean;
}

export interface Track {
  id: string;
  title: string;
  slug: string;
  stack?: string;
  summary?: string;
  level?: string;
  weeks?: number;
  outcomes: string[];
  /** Names matching the Technology list, for the track cards. */
  technologies: string[];
  cover?: Ref<Media>;
  /** Optional link back to the marketing program this track teaches. */
  program?: Ref<Program>;
  /** "sequential" locks each step until the one before it passes. */
  gate: TrackGate;
  /** Deterrents against lifting the exercise into a chatbot and back. */
  protect: TrackProtection;
  order: number;
  visible: boolean;
  steps?: PublicStep[];
  stepCount?: number;
  totalMinutes?: number;
}

export type SubmissionStatus = "pending" | "passed" | "changes-requested" | "failed";

export interface CheckResult {
  kind: CheckKind;
  value: string;
  passed: boolean;
  message?: string;
}

export interface ReviewIssue {
  title: string;
  detail?: string;
  severity?: "blocker" | "major" | "minor";
}

/** What the AI reviewer returns, normalised across providers. */
export interface AiReview {
  provider: string;
  model?: string;
  verdict: "pass" | "revise" | "fail";
  score?: number;
  /** 0-1. Low confidence is the main reason a submission reaches a person. */
  confidence?: number;
  summary: string;
  issues: ReviewIssue[];
  hints: string[];
  /** Set when the provider was unreachable — the submission still saves. */
  error?: string;
  at?: string;
}

export interface SubmissionPayload {
  code?: string;
  notes?: string;
  repoUrl?: string;
  commitUrl?: string;
  answers?: string[];
}

/** Why a submission was routed to a person rather than settled automatically. */
export type Escalation =
  | "low-confidence"
  | "repeat-failure"
  | "milestone"
  | "requested"
  | "audit"
  | "peer-split"
  | "integrity";

/** One trainee reviewing another's attempt at a step they have already passed. */
export interface PeerReview {
  _id?: string;
  reviewer: string;
  reviewerName?: string;
  verdict: "pass" | "revise";
  note: string;
  at: string;
}

/** How far the automatic review has got. The workspace waits on "reviewing". */
export type ReviewState = "skipped" | "reviewing" | "done" | "timeout";

/**
 * What the browser observed while the answer was being written. Blocking a
 * paste is a speed bump; counting the attempts is the part that survives.
 */
export interface Integrity {
  pasteAttempts: number;
  pastedCharacters: number;
  copyAttempts: number;
  awayEvents: number;
  typedCharacters: number;
  durationMs: number;
}

export interface Submission {
  id: string;
  trainee: string;
  traineeInfo?: { id: string; name: string; email: string };
  track: string;
  step: string;
  stepInfo?: { id: string; title: string; kind: StepKind };
  attempt: number;
  payload: SubmissionPayload;
  checks: CheckResult[];
  review?: AiReview | null;
  reviewState: ReviewState;
  peerReviews: PeerReview[];
  integrity?: Integrity;
  status: SubmissionStatus;
  /** What the review queue filters on. */
  needsHuman: boolean;
  escalation?: Escalation;
  humanRequested?: boolean;
  mentor?: { name?: string; note?: string; at?: string };
  createdAt: string;
}

export type EnrollmentStatus = "active" | "completed" | "paused";

export interface Enrollment {
  id: string;
  trainee: string;
  traineeInfo?: { id: string; name: string; email: string };
  track: string;
  trackInfo?: { id: string; title: string; slug: string };
  status: EnrollmentStatus;
  /** Ids of the steps that have been passed. */
  completed: string[];
  points: number;
  startedAt: string;
  completedAt?: string;
  lastActivityAt?: string;
}

/** Everything the learning workspace needs for one track, in one request. */
export interface WorkspacePayload {
  track: Track;
  steps: PublicStep[];
  enrollment: Enrollment | null;
  /** Latest submission per step id. */
  submissions: Record<string, Submission>;
  /** Step ids the trainee may open right now. */
  unlocked: string[];
}

export interface AiStatus {
  provider: string;
  model?: string;
  configured: boolean;
  /** Human-readable note about what to set to enable it. */
  note?: string;
}
