import { Link, useParams } from "react-router-dom";
import { Alert, SelectBox, TextArea, TextBox } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { SaveBar } from "../components/SaveBar";
import { MediaPicker } from "../components/MediaPicker";
import { StepsEditor } from "../components/StepsEditor";
import { useDraft } from "../hooks/useDraft";
import { useList, useUpdate } from "../api/queries";
import type { Track, TrackProtection } from "@shared/types";

/** A track created before these existed has none stored; treat them as on. */
const DEFAULT_PROTECTION: TrackProtection = {
  blockCopy: true,
  blockPaste: true,
  deterScreenshots: true,
};

const toLines = (values?: string[]) => (values ?? []).join("\n");
const fromLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export default function TrackEditor() {
  const { id } = useParams();
  const { data: tracks = [], isLoading } = useList("tracks");
  const { data: programs = [] } = useList("programs");
  const update = useUpdate("tracks");

  const track = tracks.find((t) => t.id === id);
  const { draft, set, dirty, remoteChanged, commit, reset, adoptRemote } = useDraft<Track>(track);

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (!track || !draft) {
    return (
      <>
        <PageHeader title="Track not found" />
        <Link to="/tracks" className="text-primary underline underline-offset-4">
          ← All tracks
        </Link>
      </>
    );
  }

  const save = () =>
    update.mutate(
      {
        id: draft.id,
        title: draft.title,
        slug: draft.slug,
        stack: draft.stack,
        summary: draft.summary,
        level: draft.level,
        weeks: draft.weeks,
        outcomes: draft.outcomes,
        technologies: draft.technologies,
        cover: draft.cover,
        program: draft.program,
        gate: draft.gate,
        protect: draft.protect,
      },
      { onSuccess: (saved) => commit(saved) }
    );

  return (
    <>
      <PageHeader
        title={draft.title || "Untitled track"}
        description="What a trainee enrols in. The steps below are the work itself."
        badge={draft.visible ? undefined : "hidden"}
        actions={
          <Link
            to="/tracks"
            className="rounded-card border-[1.5px] border-line-strong px-3.5 py-2 text-[0.9rem] font-semibold text-ink-2 no-underline hover:border-ink-2 hover:text-ink"
          >
            ← All tracks
          </Link>
        }
      />

      {remoteChanged ? (
        <Alert tone="info" className="mb-5">
          Someone else saved this track while you were editing.{" "}
          <button
            type="button"
            onClick={() => track && adoptRemote(track)}
            className="cursor-pointer underline underline-offset-4"
          >
            Load their version
          </button>{" "}
          — your unsaved changes will be lost.
        </Alert>
      ) : null}

      <div className="grid gap-x-4 md:grid-cols-2">
        <TextBox label="Title" value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        <TextBox
          label="Url slug"
          hint="what appears in /bootcamp/…"
          value={draft.slug ?? ""}
          onChange={(e) => set({ slug: e.target.value })}
        />
        <TextBox
          label="Stack line"
          placeholder="MongoDB · Express · React · Node.js"
          value={draft.stack ?? ""}
          onChange={(e) => set({ stack: e.target.value })}
        />
        <TextBox
          label="Level"
          placeholder="Beginner to job-ready"
          value={draft.level ?? ""}
          onChange={(e) => set({ level: e.target.value })}
        />
        <TextBox
          label="Weeks"
          type="number"
          value={draft.weeks ?? ""}
          onChange={(e) => set({ weeks: Number(e.target.value) || undefined })}
        />
        <SelectBox
          label="Step order"
          hint="sequential keeps each step locked until the one before it passes"
          options={[
            { value: "sequential", label: "Sequential" },
            { value: "open", label: "Any order" },
          ]}
          value={draft.gate}
          onChange={(e) => set({ gate: e.target.value as Track["gate"] })}
        />
      </div>

      <TextArea
        label="Summary"
        rows={3}
        value={draft.summary ?? ""}
        onChange={(e) => set({ summary: e.target.value })}
      />

      <TextArea
        label="They finish able to"
        hint="one per line"
        rows={4}
        value={toLines(draft.outcomes)}
        onChange={(e) => set({ outcomes: fromLines(e.target.value) })}
      />

      <TextArea
        label="Technologies"
        hint="one per line — shown as chips on the card"
        rows={3}
        value={toLines(draft.technologies)}
        onChange={(e) => set({ technologies: fromLines(e.target.value) })}
      />

      <div className="grid gap-x-4 md:grid-cols-2">
        <MediaPicker
          label="Cover image"
          kind="image"
          folder="tracks"
          value={draft.cover}
          onChange={(mediaId) => set({ cover: mediaId })}
        />
        <SelectBox
          label="Related program"
          hint="(optional) the course this track teaches"
          options={[
            { value: "", label: "Not linked" },
            ...programs.map((p) => ({ value: p.id, label: p.title })),
          ]}
          value={typeof draft.program === "string" ? draft.program : (draft.program?.id ?? "")}
          onChange={(e) => set({ program: e.target.value || null })}
        />
      </div>

      <fieldset className="mb-6 border border-line-strong bg-panel px-5 pt-4 pb-1">
        <legend className="px-2 font-display text-[1.05rem] font-extrabold">
          Keeping the exercises off a chatbot
        </legend>
        <p className="mb-4 max-w-[62ch] text-[0.88rem] text-muted">
          These raise the effort of moving an exercise into a chatbot and pasting the answer back.
          They are deterrents, not enforcement — anyone can open developer tools or photograph the
          screen, and no web page can prevent that. What they do reliably is{" "}
          <b>count the attempts</b>, and a submission that looks pasted lands in your review queue
          flagged.
        </p>

        {[
          {
            key: "blockCopy" as const,
            label: "Refuse selection and copying of the brief and the broken code",
            note: "Stops the exercise being lifted into a chatbot in one gesture.",
          },
          {
            key: "blockPaste" as const,
            label: "Refuse pasting into the answer fields",
            note: "Also stops a trainee pasting their own code from their editor — worth knowing before you leave it on.",
          },
          {
            key: "deterScreenshots" as const,
            label: "Blur the exercise when the tab loses focus, and refuse printing",
            note: "Costs a screen recorder something. Costs a phone camera nothing.",
          },
        ].map((option) => (
          <label key={option.key} className="mb-4 flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={draft.protect?.[option.key] !== false}
              onChange={(e) =>
                set({
                  protect: {
                    ...DEFAULT_PROTECTION,
                    ...(draft.protect ?? {}),
                    [option.key]: e.target.checked,
                  },
                })
              }
              className="mt-1 size-4 accent-[var(--color-primary)]"
            />
            <span className="text-[0.95rem]">
              {option.label}
              <span className="block text-[0.85rem] text-muted">{option.note}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <SaveBar
        dirty={dirty}
        saving={update.isPending}
        error={update.error}
        saved={update.isSuccess}
        onSave={save}
        onReset={reset}
      />

      <StepsEditor trackId={draft.id} />
    </>
  );
}
