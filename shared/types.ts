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
  | "faq"
  | "builder";

export type TechGroup = "front" | "back" | "data" | "mobile" | "ai" | "ops";

export type MediaKind = "image" | "video" | "file";

export type LessonSource = "upload" | "youtube" | "vimeo" | "url";

export type LeadStatus = "new" | "contacted" | "enrolled" | "closed";

export type UserRole = "admin" | "editor";

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
