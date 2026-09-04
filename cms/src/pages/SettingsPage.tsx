import { useState, type ReactNode } from "react";
import { Button, CollapsibleCard, TextArea, TextBox } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { SaveBar } from "../components/SaveBar";
import { MediaPicker } from "../components/MediaPicker";
import { useDraft } from "../hooks/useDraft";
import { useSaveSettings, useSettings } from "../api/queries";
import type { HeroStat, SiteSettings, WeekDay } from "@shared/types";

/** The groups, in the order they appear down the public page. */
const GROUPS = [
  "brand",
  "meta",
  "hero",
  "week",
  "builder",
  "enrol",
  "contact",
  "announcement",
] as const;
type Group = (typeof GROUPS)[number];

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const save = useSaveSettings();
  const { draft, set, dirty, commit, reset } = useDraft<SiteSettings>(data);
  const [open, setOpen] = useState<Set<Group>>(() => new Set<Group>(["brand"]));

  const toggle = (group: Group) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  if (isLoading || !draft) return <p className="text-muted">Loading…</p>;

  const stats = draft.heroStats ?? [];
  const week = draft.week ?? [];
  const allOpen = open.size >= GROUPS.length;

  const setStat = (index: number, patch: Partial<HeroStat>) =>
    set({ heroStats: stats.map((s, i) => (i === index ? { ...s, ...patch } : s)) });

  const setDay = (index: number, patch: Partial<WeekDay>) =>
    set({ week: week.map((d, i) => (i === index ? { ...d, ...patch } : d)) });

  /** Every card is the same shape; only its summary line differs. */
  const card = (group: Group, title: string, summary: string, children: ReactNode) => (
    <CollapsibleCard
      key={group}
      open={open.has(group)}
      onToggle={() => toggle(group)}
      title={title}
      collapsedSubtitle={summary}
    >
      {children}
    </CollapsibleCard>
  );

  return (
    <>
      <PageHeader
        title="Site details"
        description="The parts of the page that are not a section: the header, the hero, the week strip, the contact links and the enrolment form's copy."
        actions={
          <Button
            variant="quiet"
            onClick={() => setOpen(allOpen ? new Set<Group>() : new Set<Group>(GROUPS))}
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </Button>
        }
      />

      <div className="grid gap-2">
        {card(
          "brand",
          "Brand",
          [draft.brandName, draft.brandTagline, draft.logo ? "logo set" : "no logo"]
            .filter(Boolean)
            .join(" · "),
          <>
            <div className="grid gap-x-4 lg:grid-cols-2">
              <TextBox
                label="Brand name"
                value={draft.brandName ?? ""}
                onChange={(e) => set({ brandName: e.target.value })}
              />
              <TextBox
                label="Tagline"
                hint="the small text beside the name"
                value={draft.brandTagline ?? ""}
                onChange={(e) => set({ brandTagline: e.target.value })}
              />
            </div>
            <MediaPicker
              label="Logo"
              kind="image"
              folder="brand"
              hint="the mark shown beside the name"
              value={draft.logo}
              onChange={(id) => set({ logo: id })}
            />
          </>
        )}

        {card(
          "meta",
          "Search and sharing",
          draft.metaTitle || "No page title set",
          <>
            <TextBox
              label="Page title"
              value={draft.metaTitle ?? ""}
              onChange={(e) => set({ metaTitle: e.target.value })}
            />
            <TextArea
              label="Meta description"
              rows={3}
              value={draft.metaDescription ?? ""}
              onChange={(e) => set({ metaDescription: e.target.value })}
            />
            <MediaPicker
              label="Share image"
              kind="image"
              folder="brand"
              value={draft.ogImage}
              onChange={(id) => set({ ogImage: id })}
            />
          </>
        )}

        {card(
          "hero",
          "Hero",
          [`${draft.heroTitle ?? ""} ${draft.heroHighlight ?? ""}`.trim(), `${stats.length} stats`]
            .filter(Boolean)
            .join(" · "),
          <>
            <div className="grid gap-x-4 lg:grid-cols-2">
              <TextBox
                label="Headline"
                value={draft.heroTitle ?? ""}
                onChange={(e) => set({ heroTitle: e.target.value })}
              />
              <TextBox
                label="Underlined words"
                hint="drawn in the secondary colour"
                value={draft.heroHighlight ?? ""}
                onChange={(e) => set({ heroHighlight: e.target.value })}
              />
            </div>
            <TextArea
              label="Intro"
              rows={3}
              value={draft.heroLede ?? ""}
              onChange={(e) => set({ heroLede: e.target.value })}
            />

            <div className="grid gap-x-4 lg:grid-cols-2">
              <TextBox
                label="Main button label"
                value={draft.heroPrimaryCta?.label ?? ""}
                onChange={(e) => set({ heroPrimaryCta: { ...draft.heroPrimaryCta, label: e.target.value } })}
              />
              <TextBox
                label="Main button link"
                value={draft.heroPrimaryCta?.href ?? ""}
                onChange={(e) => set({ heroPrimaryCta: { ...draft.heroPrimaryCta, href: e.target.value } })}
              />
              <TextBox
                label="Second button label"
                value={draft.heroSecondaryCta?.label ?? ""}
                onChange={(e) =>
                  set({ heroSecondaryCta: { ...draft.heroSecondaryCta, label: e.target.value } })
                }
              />
              <TextBox
                label="Second button link"
                value={draft.heroSecondaryCta?.href ?? ""}
                onChange={(e) =>
                  set({ heroSecondaryCta: { ...draft.heroSecondaryCta, href: e.target.value } })
                }
              />
            </div>

            <MediaPicker
              label="Hero image"
              kind="image"
              folder="brand"
              hint="(optional)"
              value={draft.heroMedia}
              onChange={(id) => set({ heroMedia: id })}
            />

            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="text-[1.05rem] font-semibold">Stats under the hero</h3>
              <Button size="sm" onClick={() => set({ heroStats: [...stats, { value: "", label: "" }] })}>
                Add stat
              </Button>
            </div>
            {stats.map((stat, i) => (
              <div key={i} className="grid items-end gap-x-4 md:grid-cols-[120px_1fr_auto]">
                <TextBox
                  label="Value"
                  value={stat.value ?? ""}
                  onChange={(e) => setStat(i, { value: e.target.value })}
                />
                <TextBox
                  label="Label"
                  value={stat.label ?? ""}
                  onChange={(e) => setStat(i, { label: e.target.value })}
                />
                <div className="mb-4">
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => set({ heroStats: stats.filter((_, j) => j !== i) })}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </>
        )}

        {card(
          "week",
          "The week strip",
          `${week.length} days · highlighted: ${week.filter((d) => d.highlight).map((d) => d.day).join(", ") || "none"}`,
          <>
            <p className="mb-4 text-[0.92rem] text-muted">
              Shown by any section using the “Week” layout. Tick a day to highlight it.
            </p>
            {week.map((day, i) => (
              <div key={i} className="grid items-end gap-x-4 md:grid-cols-[110px_1fr_auto_auto]">
                <TextBox
                  label="Day"
                  value={day.day ?? ""}
                  onChange={(e) => setDay(i, { day: e.target.value })}
                />
                <TextBox
                  label="Label"
                  value={day.label ?? ""}
                  onChange={(e) => setDay(i, { label: e.target.value })}
                />
                <label className="mb-6 flex cursor-pointer items-center gap-2 text-[0.9rem]">
                  <input
                    type="checkbox"
                    checked={Boolean(day.highlight)}
                    onChange={(e) => setDay(i, { highlight: e.target.checked })}
                    className="size-4 accent-[var(--color-primary)]"
                  />
                  Highlight
                </label>
                <div className="mb-4">
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => set({ week: week.filter((_, j) => j !== i) })}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button size="sm" onClick={() => set({ week: [...week, { day: "", label: "" }] })}>
              Add day
            </Button>
          </>
        )}

        {card(
          "builder",
          "Track builder",
          draft.builderTitle || "No panel title set",
          <>
            <TextBox
              label="Panel title"
              value={draft.builderTitle ?? ""}
              onChange={(e) => set({ builderTitle: e.target.value })}
            />
            <TextArea
              label="Panel note"
              rows={2}
              value={draft.builderNote ?? ""}
              onChange={(e) => set({ builderNote: e.target.value })}
            />
          </>
        )}

        {card(
          "enrol",
          "Enrolment form",
          draft.enrollTitle || "No heading set",
          <>
            <TextBox
              label="Heading"
              value={draft.enrollTitle ?? ""}
              onChange={(e) => set({ enrollTitle: e.target.value })}
            />
            <TextArea
              label="Intro"
              rows={3}
              value={draft.enrollLede ?? ""}
              onChange={(e) => set({ enrollLede: e.target.value })}
            />
          </>
        )}

        {card(
          "contact",
          "Contact",
          [draft.email, draft.whatsapp ? `+${draft.whatsapp}` : "", draft.location]
            .filter(Boolean)
            .join(" · ") || "Nothing set",
          <>
            <div className="grid gap-x-4 lg:grid-cols-2">
              <TextBox
                label="Email"
                value={draft.email ?? ""}
                onChange={(e) => set({ email: e.target.value })}
              />
              <TextBox
                label="WhatsApp"
                hint="digits only, international format"
                value={draft.whatsapp ?? ""}
                onChange={(e) => set({ whatsapp: e.target.value })}
              />
              <TextBox
                label="LinkedIn"
                value={draft.linkedin ?? ""}
                onChange={(e) => set({ linkedin: e.target.value })}
              />
              <TextBox
                label="Location"
                value={draft.location ?? ""}
                onChange={(e) => set({ location: e.target.value })}
              />
            </div>
            <TextBox
              label="Footer line"
              value={draft.footerNote ?? ""}
              onChange={(e) => set({ footerNote: e.target.value })}
            />
          </>
        )}

        {card(
          "announcement",
          "Announcement bar",
          draft.announcement?.active
            ? `On — ${draft.announcement.text || "(no message)"}`
            : "Off",
          <>
            <label className="mb-4 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={Boolean(draft.announcement?.active)}
                onChange={(e) => set({ announcement: { ...draft.announcement, active: e.target.checked } })}
                className="size-4 accent-[var(--color-primary)]"
              />
              <span className="text-[0.95rem]">Show a strip above the page</span>
            </label>
            <div className="grid gap-x-4 lg:grid-cols-2">
              <TextBox
                label="Message"
                value={draft.announcement?.text ?? ""}
                onChange={(e) => set({ announcement: { ...draft.announcement, text: e.target.value } })}
              />
              <TextBox
                label="Link"
                hint="(optional)"
                value={draft.announcement?.href ?? ""}
                onChange={(e) => set({ announcement: { ...draft.announcement, href: e.target.value } })}
              />
            </div>
          </>
        )}
      </div>

      <SaveBar
        dirty={dirty}
        saving={save.isPending}
        error={save.error}
        saved={save.isSuccess}
        onSave={() => {
          const { id, ...payload } = draft;
          void id;
          save.mutate(payload, { onSuccess: (saved) => commit(saved) });
        }}
        onReset={reset}
      />
    </>
  );
}
