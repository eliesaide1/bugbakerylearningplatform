import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, SelectBox, TextArea, TextBox } from "@shared/ui";
import { SECTION_THEME_OPTIONS } from "./themeOptions";
import { SECTION_TYPE_OPTIONS } from "./SectionsPage";
import { PageHeader } from "../components/Shell";
import { SaveBar } from "../components/SaveBar";
import { MediaPicker } from "../components/MediaPicker";
import { ItemsEditor } from "../components/ItemsEditor";
import { ConfirmButton } from "../components/ConfirmButton";
import { useDraft } from "../hooks/useDraft";
import { useList, useRemove, useUpdate } from "../api/queries";
import type { Section, SectionTheme, SectionType } from "@shared/types";

/** Which fields matter for each layout, so the form stays honest. */
const USES_ITEMS = new Set<SectionType>(["cards", "steps", "week", "split", "gallery", "quote"]);
const USES_MEDIA = new Set<SectionType>(["split", "video", "rich", "cta"]);
const USES_VIDEO = new Set<SectionType>(["video"]);
const USES_CTA = new Set<SectionType>(["cta", "callout", "rich"]);
const MANAGED_ELSEWHERE: Partial<Record<SectionType, { note: string; to: string; label: string }>> = {
  programs: { note: "The programs themselves are managed separately.", to: "/programs", label: "Edit programs" },
  faq: { note: "The questions are managed separately.", to: "/faqs", label: "Edit questions" },
  builder: {
    note: "The technologies offered in the builder are managed separately.",
    to: "/technologies",
    label: "Edit track options",
  },
};

export default function SectionEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: sections = [], isLoading } = useList("sections");
  const update = useUpdate("sections");
  const remove = useRemove("sections");

  const source = sections.find((s) => s.id === id);
  const { draft, set, dirty, remoteChanged, commit, reset, adoptRemote } = useDraft<Section>(source);

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (!draft) {
    return (
      <>
        <PageHeader title="Section not found" />
        <Link to="/sections" className="text-primary underline-offset-4 hover:underline">
          ← Back to sections
        </Link>
      </>
    );
  }

  const managed = MANAGED_ELSEWHERE[draft.type];

  const save = () =>
    update.mutate(
      {
        id: draft.id,
        slug: draft.slug,
        type: draft.type,
        theme: draft.theme,
        navLabel: draft.navLabel,
        eyebrow: draft.eyebrow,
        title: draft.title,
        lede: draft.lede,
        body: draft.body,
        items: draft.items,
        media: draft.media,
        videoUrl: draft.videoUrl,
        ctaLabel: draft.ctaLabel,
        ctaHref: draft.ctaHref,
        visible: draft.visible,
      },
      { onSuccess: (saved) => commit(saved) }
    );

  return (
    <>
      <PageHeader
        title={draft.title || draft.slug}
        description="Changes go live the moment you save."
        badge={draft.visible ? "Visible" : "Hidden"}
        actions={
          <>
            <Link
              to="/sections"
              className="inline-flex items-center rounded-card border-[1.5px] border-line-strong px-3.5 py-2 text-[0.9rem] font-semibold text-ink-2 no-underline hover:border-ink-2"
            >
              ← All sections
            </Link>
            <ConfirmButton
              label="Delete section"
              onConfirm={() => remove.mutate(draft.id, { onSuccess: () => navigate("/sections") })}
            />
          </>
        }
      />

      {remoteChanged && source ? (
        <Alert tone="info" className="mb-5">
          Someone else changed this section while you were editing.{" "}
          <button
            type="button"
            onClick={() => adoptRemote(source)}
            className="cursor-pointer font-semibold underline underline-offset-4"
          >
            Load their version
          </button>{" "}
          — your unsaved edits would be replaced.
        </Alert>
      ) : null}

      <div className="grid gap-x-6 lg:grid-cols-2">
        <SelectBox
          label="Layout"
          hint="what this section looks like"
          options={SECTION_TYPE_OPTIONS}
          value={draft.type}
          onChange={(e) => set({ type: e.target.value as SectionType })}
        />
        <SelectBox
          label="Colour scheme"
          options={SECTION_THEME_OPTIONS}
          value={draft.theme}
          onChange={(e) => set({ theme: e.target.value as SectionTheme })}
        />
        <TextBox
          label="Anchor"
          hint="used in the url, e.g. #programs"
          value={draft.slug ?? ""}
          onChange={(e) => set({ slug: e.target.value })}
        />
        <TextBox
          label="Menu label"
          hint="leave empty to keep it out of the nav"
          value={draft.navLabel ?? ""}
          onChange={(e) => set({ navLabel: e.target.value })}
        />
      </div>

      {managed ? (
        <Alert tone="info" className="mb-5">
          {managed.note}{" "}
          <Link to={managed.to} className="font-semibold underline underline-offset-4">
            {managed.label}
          </Link>
        </Alert>
      ) : null}

      <TextBox
        label="Eyebrow"
        hint="small label above the heading (optional)"
        value={draft.eyebrow ?? ""}
        onChange={(e) => set({ eyebrow: e.target.value })}
      />
      <TextBox label="Heading" value={draft.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
      <TextArea
        label="Intro"
        hint="the larger paragraph under the heading"
        rows={3}
        value={draft.lede ?? ""}
        onChange={(e) => set({ lede: e.target.value })}
      />
      <TextArea
        label="Body"
        hint="leave a blank line between paragraphs"
        rows={6}
        value={draft.body ?? ""}
        onChange={(e) => set({ body: e.target.value })}
      />

      {USES_MEDIA.has(draft.type) ? (
        <MediaPicker
          label="Image"
          kind="image"
          folder="sections"
          value={draft.media}
          onChange={(mediaRef) => set({ media: mediaRef })}
        />
      ) : null}

      {USES_VIDEO.has(draft.type) ? (
        <>
          <TextBox
            label="Video link"
            hint="YouTube, Vimeo or any direct video url"
            value={draft.videoUrl ?? ""}
            onChange={(e) => set({ videoUrl: e.target.value })}
          />
          <MediaPicker
            label="…or an uploaded video"
            kind="video"
            folder="sections"
            value={draft.media}
            onChange={(mediaRef) => set({ media: mediaRef })}
          />
        </>
      ) : null}

      {USES_CTA.has(draft.type) ? (
        <div className="grid gap-x-6 lg:grid-cols-2">
          <TextBox
            label="Button label"
            value={draft.ctaLabel ?? ""}
            onChange={(e) => set({ ctaLabel: e.target.value })}
          />
          <TextBox
            label="Button link"
            hint="e.g. #enroll"
            value={draft.ctaHref ?? ""}
            onChange={(e) => set({ ctaHref: e.target.value })}
          />
        </div>
      ) : null}

      {USES_ITEMS.has(draft.type) ? (
        <div className="mt-6">
          <ItemsEditor type={draft.type} items={draft.items ?? []} onChange={(items) => set({ items })} />
        </div>
      ) : null}

      <SaveBar
        dirty={dirty}
        saving={update.isPending}
        error={update.error}
        saved={update.isSuccess}
        onSave={save}
        onReset={reset}
      >
        <Button variant="quiet" onClick={() => set({ visible: !draft.visible })}>
          {draft.visible ? "Hide from site" : "Show on site"}
        </Button>
      </SaveBar>
    </>
  );
}
