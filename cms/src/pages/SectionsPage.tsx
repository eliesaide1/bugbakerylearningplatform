import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Chevron, EmptyState, SelectBox, TextBox } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { ConfirmButton } from "../components/ConfirmButton";
import { SECTION_THEME_OPTIONS } from "./themeOptions";
import { useCreate, useList, useRemove, useReorder, useUpdate } from "../api/queries";
import type { Section, SectionTheme, SectionType } from "@shared/types";

export const SECTION_TYPE_OPTIONS: Array<{ value: SectionType; label: string }> = [
  { value: "rich", label: "Text — a heading and paragraphs" },
  { value: "cards", label: "Cards — side-by-side panels" },
  { value: "steps", label: "Steps — a numbered row" },
  { value: "week", label: "Week — the day strip plus columns" },
  { value: "split", label: "Split — facts panel beside text" },
  { value: "video", label: "Video — an embed or an upload" },
  { value: "gallery", label: "Gallery — a grid of images" },
  { value: "quote", label: "Quote — a large pull quote" },
  { value: "callout", label: "Callout — a highlighted note" },
  { value: "cta", label: "Call to action — heading and a button" },
  { value: "programs", label: "Programs list (managed under Programs)" },
  { value: "faq", label: "Questions list (managed under Questions)" },
  { value: "builder", label: "Track builder" },
];

export default function SectionsPage() {
  const { data: sections = [], isLoading } = useList("sections");
  const create = useCreate("sections");
  const update = useUpdate("sections");
  const remove = useRemove("sections");
  const reorder = useReorder("sections");

  const [title, setTitle] = useState("");
  const [type, setType] = useState<SectionType>("rich");
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    reorder.mutate(next.map((s) => s.id));
  };

  const addSection = () => {
    if (!title.trim()) return;
    create.mutate(
      { title: title.trim(), type, theme: "paper", order: sections.length, visible: true },
      {
        onSuccess: (section) => {
          setTitle("");
          setOpen((current) => new Set(current).add(section.id));
        },
      }
    );
  };

  const hidden = sections.filter((s) => !s.visible).length;
  const allOpen = sections.length > 0 && open.size >= sections.length;

  return (
    <>
      <PageHeader
        title="Page sections"
        description="The public page is this list, top to bottom, between the hero and the enrolment form. Open a card for quick edits, or the full editor for its content."
        badge={hidden ? `${sections.length} sections · ${hidden} hidden` : `${sections.length} sections`}
        actions={
          sections.length > 1 ? (
            <Button
              variant="quiet"
              onClick={() => setOpen(allOpen ? new Set() : new Set(sections.map((s) => s.id)))}
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </Button>
          ) : null
        }
      />

      <div className="mb-8 border border-line-strong bg-panel p-5">
        <h2 className="mb-4 text-step-1">Add a section</h2>
        <div className="grid gap-x-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <TextBox
            label="Title"
            placeholder="e.g. Student projects"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSection()}
          />
          <SelectBox
            label="Layout"
            options={SECTION_TYPE_OPTIONS}
            value={type}
            onChange={(e) => setType(e.target.value as SectionType)}
          />
          <div className="mb-4">
            <Button onClick={addSection} disabled={!title.trim() || create.isPending}>
              {create.isPending ? "Adding…" : "Add section"}
            </Button>
          </div>
        </div>
        {create.isError ? (
          <p className="text-[0.9rem] text-danger">{(create.error as Error).message}</p>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : !sections.length ? (
        <EmptyState title="No sections yet" message="Add one above and it appears on the site." />
      ) : (
        <div className="grid gap-2">
          {sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              isOpen={open.has(section.id)}
              first={index === 0}
              last={index === sections.length - 1}
              busy={reorder.isPending}
              saving={update.isPending}
              onToggle={() => toggle(section.id)}
              onUp={() => move(index, -1)}
              onDown={() => move(index, 1)}
              onSave={(patch) => update.mutate({ id: section.id, ...patch })}
              onDelete={() => remove.mutate(section.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function SectionCard({
  section,
  index,
  isOpen,
  first,
  last,
  busy,
  saving,
  onToggle,
  onUp,
  onDown,
  onSave,
  onDelete,
}: {
  section: Section;
  index: number;
  isOpen: boolean;
  first: boolean;
  last: boolean;
  busy: boolean;
  saving: boolean;
  onToggle: () => void;
  onUp: () => void;
  onDown: () => void;
  onSave: (patch: Partial<Section>) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState({
    title: section.title ?? "",
    slug: section.slug ?? "",
    navLabel: section.navLabel ?? "",
    theme: section.theme,
  });

  const dirty =
    draft.title !== (section.title ?? "") ||
    draft.slug !== (section.slug ?? "") ||
    draft.navLabel !== (section.navLabel ?? "") ||
    draft.theme !== section.theme;

  const panelId = `section-card-${section.id}`;

  return (
    <div className={`border bg-panel transition-colors ${isOpen ? "border-primary" : "border-line-strong"}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="group grid min-w-0 flex-1 cursor-pointer grid-cols-[auto_auto_1fr] items-center gap-x-3 px-4 py-3 text-left"
        >
          <Chevron open={isOpen} className="size-3.5 text-primary" />
          <span className="font-mono text-[0.76rem] tabular-nums text-muted">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0">
            <span
              className={`block truncate font-display text-[1rem] font-extrabold group-hover:text-primary ${
                section.visible ? "" : "text-muted"
              }`}
            >
              {section.title || section.slug}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[0.72rem] text-muted">
              <span>#{section.slug}</span>
              <span>· {section.type}</span>
              {section.theme !== "paper" ? <span>· {section.theme}</span> : null}
              {section.navLabel ? <span>· nav: {section.navLabel}</span> : null}
            </span>
          </span>
        </button>

        <div className="flex flex-none items-center gap-1.5 pr-3">
          {!section.visible ? <Badge>hidden</Badge> : null}
          <Button
            variant="quiet"
            size="sm"
            aria-label="Move up"
            disabled={first || busy}
            onClick={onUp}
            className="px-2"
          >
            ↑
          </Button>
          <Button
            variant="quiet"
            size="sm"
            aria-label="Move down"
            disabled={last || busy}
            onClick={onDown}
            className="px-2"
          >
            ↓
          </Button>
          <Link
            to={`/sections/${section.id}`}
            className="inline-flex items-center rounded-card border-[1.5px] border-primary bg-primary px-3.5 py-2 text-[0.9rem] font-semibold text-white no-underline hover:bg-primary-deep"
          >
            Edit
          </Link>
        </div>
      </div>

      {isOpen ? (
        <div id={panelId} className="animate-panel-open border-t border-line px-4 pt-4">
          <div className="grid gap-x-4 md:grid-cols-2">
            <TextBox
              label="Title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <TextBox
              label="Menu label"
              hint="leave empty to keep it out of the nav"
              value={draft.navLabel}
              onChange={(e) => setDraft({ ...draft, navLabel: e.target.value })}
            />
            <TextBox
              label="Anchor"
              hint="used in the url, e.g. #programs"
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            />
            <SelectBox
              label="Colour scheme"
              options={SECTION_THEME_OPTIONS}
              value={draft.theme}
              onChange={(e) => setDraft({ ...draft, theme: e.target.value as SectionTheme })}
            />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <Button disabled={!dirty || saving} onClick={() => onSave(draft)}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="quiet"
              disabled={!dirty}
              onClick={() =>
                setDraft({
                  title: section.title ?? "",
                  slug: section.slug ?? "",
                  navLabel: section.navLabel ?? "",
                  theme: section.theme,
                })
              }
            >
              Discard
            </Button>
            <Button variant="quiet" onClick={() => onSave({ visible: !section.visible })}>
              {section.visible ? "Hide from site" : "Show on site"}
            </Button>
            <ConfirmButton label="Delete section" onConfirm={onDelete} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
