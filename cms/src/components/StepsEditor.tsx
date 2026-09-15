import { useState } from "react";
import { Badge, Button, CollapsibleCard, SelectBox, TextArea, TextBox } from "@shared/ui";
import { ConfirmButton } from "./ConfirmButton";
import { ChecksEditor } from "./ChecksEditor";
import { useCreate, useList, useRemove, useReorder, useUpdate } from "../api/queries";
import type { Lesson, Step, StepKind } from "@shared/types";

const KINDS: Array<{ value: StepKind; label: string }> = [
  { value: "watch", label: "Watch — a video, no exercise" },
  { value: "read", label: "Read — a brief, no exercise" },
  { value: "task", label: "Build — they write code" },
  { value: "bug", label: "Fix the bug — they debug code you broke" },
  { value: "push", label: "Ship it — they push and submit links" },
  { value: "quiz", label: "Check yourself — short answers" },
];

/** Line-per-item text fields, the same convention the rest of the CMS uses. */
const toLines = (values?: string[]) => (values ?? []).join("\n");
const fromLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export function StepsEditor({ trackId }: { trackId: string }) {
  const { data: steps = [], isLoading } = useList("steps", { track: trackId });
  const { data: lessons = [] } = useList("lessons");
  const create = useCreate("steps");
  const update = useUpdate("steps");
  const remove = useRemove("steps");
  const reorder = useReorder("steps");

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<StepKind>("task");
  const [open, setOpen] = useState<string | null>(null);

  const add = () => {
    if (!title.trim()) return;
    create.mutate(
      {
        title: title.trim(),
        kind,
        track: trackId,
        order: steps.length,
        visible: true,
        requiresSubmission: kind !== "watch" && kind !== "read",
      },
      { onSuccess: (step) => {
          setTitle("");
          setOpen(step.id);
        } }
    );
  };

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= steps.length) return;
    const next = [...steps];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    reorder.mutate(next.map((s) => s.id));
  };

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-step-2">Steps</h2>
          <p className="mt-1 max-w-[62ch] text-[0.92rem] text-ink-2">
            The loop is watch, build, fix, ship. Steps you can state as rules stay out of your review
            queue forever — a bug with concrete acceptance criteria is gradeable without you.
          </p>
        </div>
      </div>

      <div className="mb-6 border border-line-strong bg-panel p-5">
        <div className="grid gap-x-4 md:grid-cols-[1fr_20rem_auto] md:items-end">
          <TextBox
            label="New step"
            placeholder="e.g. The list is always empty"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <SelectBox
            label="What kind"
            options={KINDS}
            value={kind}
            onChange={(e) => setKind(e.target.value as StepKind)}
          />
          <div className="mb-4">
            <Button onClick={add} disabled={!title.trim() || create.isPending}>
              Add step
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? <p className="text-muted">Loading…</p> : null}

      <div className="grid gap-2">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            total={steps.length}
            lessons={lessons}
            open={open === step.id}
            saving={update.isPending}
            onToggle={() => setOpen(open === step.id ? null : step.id)}
            onMove={(delta) => move(index, delta)}
            onSave={(patch) => update.mutate({ id: step.id, ...patch })}
            onDelete={() => remove.mutate(step.id)}
          />
        ))}
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
  total,
  lessons,
  open,
  saving,
  onToggle,
  onMove,
  onSave,
  onDelete,
}: {
  step: Step;
  index: number;
  total: number;
  lessons: Lesson[];
  open: boolean;
  saving: boolean;
  onToggle: () => void;
  onMove: (delta: number) => void;
  onSave: (patch: Partial<Step>) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<Step>(step);
  const set = (patch: Partial<Step>) => setDraft((d) => ({ ...d, ...patch }));
  const setBug = (patch: Partial<NonNullable<Step["bug"]>>) =>
    setDraft((d) => ({
      ...d,
      bug: { hints: [], acceptance: [], ...(d.bug ?? {}), ...patch },
    }));
  const setPush = (patch: Partial<NonNullable<Step["push"]>>) =>
    setDraft((d) => ({ ...d, push: { ...(d.push ?? {}), ...patch } }));

  const save = () =>
    onSave({
      title: draft.title,
      slug: draft.slug,
      kind: draft.kind,
      week: draft.week,
      summary: draft.summary,
      brief: draft.brief,
      estimateMinutes: draft.estimateMinutes,
      points: draft.points,
      lesson: draft.lesson,
      videoUrl: draft.videoUrl,
      deliverables: draft.deliverables,
      starterRepo: draft.starterRepo,
      bug: draft.bug,
      push: draft.push,
      quiz: draft.quiz,
      checks: draft.checks,
      rubric: draft.rubric,
      requiresSubmission: draft.requiresSubmission,
      milestone: draft.milestone,
      peerReviewable: draft.peerReviewable,
    });

  return (
    <CollapsibleCard
      open={open}
      onToggle={onToggle}
      eyebrow={String(index + 1).padStart(2, "0")}
      title={step.title}
      muted={!step.visible}
      collapsedSubtitle={[
        `Week ${step.week ?? 1}`,
        KINDS.find((k) => k.value === step.kind)?.label.split(" — ")[0],
        step.summary,
      ]
        .filter(Boolean)
        .join(" · ")}
      actions={
        <>
          {step.milestone ? <Badge tone="primary">you review</Badge> : null}
          {step.checks?.length ? <Badge>{step.checks.length} checks</Badge> : null}
          <Button variant="quiet" size="sm" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)} className="px-2">
            ↑
          </Button>
          <Button
            variant="quiet"
            size="sm"
            aria-label="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="px-2"
          >
            ↓
          </Button>
          <Button variant="quiet" size="sm" onClick={() => onSave({ visible: !step.visible })}>
            {step.visible ? "Visible" : "Hidden"}
          </Button>
          <ConfirmButton label="Delete" onConfirm={onDelete} />
        </>
      }
    >
      <div className="grid gap-x-4 md:grid-cols-2">
        <TextBox label="Title" value={draft.title} onChange={(e) => set({ title: e.target.value })} />
        <TextBox
          label="Url slug"
          hint="leave empty to generate"
          value={draft.slug ?? ""}
          onChange={(e) => set({ slug: e.target.value })}
        />
        <SelectBox
          label="What kind"
          options={KINDS}
          value={draft.kind}
          onChange={(e) => set({ kind: e.target.value as StepKind })}
        />
        <TextBox
          label="Week"
          hint="which week of the track this falls in"
          type="number"
          value={draft.week ?? 1}
          onChange={(e) => set({ week: Number(e.target.value) || 1 })}
        />
        <TextBox
          label="Estimated minutes"
          type="number"
          value={draft.estimateMinutes ?? ""}
          onChange={(e) => set({ estimateMinutes: Number(e.target.value) || undefined })}
        />
        <TextBox
          label="Points"
          type="number"
          value={draft.points ?? 10}
          onChange={(e) => set({ points: Number(e.target.value) || 0 })}
        />
      </div>

      <TextBox
        label="One-line summary"
        value={draft.summary ?? ""}
        onChange={(e) => set({ summary: e.target.value })}
      />

      <TextArea
        label="The brief"
        hint="what they read before starting — blank lines make paragraphs"
        rows={6}
        value={draft.brief ?? ""}
        onChange={(e) => set({ brief: e.target.value })}
      />

      {draft.kind === "watch" ? (
        <div className="grid gap-x-4 md:grid-cols-2">
          <SelectBox
            label="Lesson"
            hint="reuse a video from the library"
            options={[
              { value: "", label: "Not from the library" },
              ...lessons.map((l) => ({ value: l.id, label: l.title })),
            ]}
            value={typeof draft.lesson === "string" ? draft.lesson : (draft.lesson?.id ?? "")}
            onChange={(e) => set({ lesson: e.target.value || null })}
          />
          <TextBox
            label="Or a video link"
            placeholder="https://www.youtube.com/watch?v=…"
            value={draft.videoUrl ?? ""}
            onChange={(e) => set({ videoUrl: e.target.value })}
          />
        </div>
      ) : null}

      {draft.kind === "task" ? (
        <>
          <TextArea
            label="Deliverables"
            hint="one per line — this is what the reviewer judges against"
            rows={4}
            value={toLines(draft.deliverables)}
            onChange={(e) => set({ deliverables: fromLines(e.target.value) })}
          />
          <TextBox
            label="Starter repository"
            hint="(optional)"
            value={draft.starterRepo ?? ""}
            onChange={(e) => set({ starterRepo: e.target.value })}
          />
        </>
      ) : null}

      {draft.kind === "bug" ? (
        <div className="mb-4 border-l-4 border-danger bg-danger/5 px-5 pt-4">
          <p className="mb-3 font-display text-[1.05rem] font-extrabold">The planted bug</p>
          <div className="grid gap-x-4 md:grid-cols-2">
            <TextBox
              label="Language"
              value={draft.bug?.language ?? "javascript"}
              onChange={(e) => setBug({ language: e.target.value })}
            />
            <TextBox
              label="Filename"
              placeholder="routes/recipes.js"
              value={draft.bug?.filename ?? ""}
              onChange={(e) => setBug({ filename: e.target.value })}
            />
          </div>
          <TextArea
            label="Reported symptom"
            hint="what a user saw — not what is wrong"
            rows={3}
            value={draft.bug?.symptom ?? ""}
            onChange={(e) => setBug({ symptom: e.target.value })}
          />
          <TextArea
            label="The broken code"
            rows={12}
            className="font-mono text-[0.85rem]"
            value={draft.bug?.code ?? ""}
            onChange={(e) => setBug({ code: e.target.value })}
          />
          <TextArea
            label="Stack trace"
            hint="(optional)"
            rows={3}
            className="font-mono text-[0.85rem]"
            value={draft.bug?.stackTrace ?? ""}
            onChange={(e) => setBug({ stackTrace: e.target.value })}
          />
          <TextArea
            label="Hints"
            hint="one per line — the trainee opens them one at a time"
            rows={4}
            value={toLines(draft.bug?.hints)}
            onChange={(e) => setBug({ hints: fromLines(e.target.value) })}
          />
          <TextArea
            label="A correct fix satisfies all of these"
            hint="one per line — the clearer these are, the less of this step reaches you"
            rows={4}
            value={toLines(draft.bug?.acceptance)}
            onChange={(e) => setBug({ acceptance: fromLines(e.target.value) })}
          />
          <TextArea
            label="Root cause (answer key)"
            hint="never sent to the browser — only the reviewer sees it"
            rows={4}
            value={draft.bug?.rootCause ?? ""}
            onChange={(e) => setBug({ rootCause: e.target.value })}
          />
        </div>
      ) : null}

      {draft.kind === "push" ? (
        <div className="grid gap-x-4 md:grid-cols-2">
          <TextBox
            label="Branch"
            placeholder="fix/empty-recipes"
            value={draft.push?.branch ?? ""}
            onChange={(e) => setPush({ branch: e.target.value })}
          />
          <TextBox
            label="Commit message convention"
            placeholder="imperative mood, explains why"
            value={draft.push?.commitMessage ?? ""}
            onChange={(e) => setPush({ commitMessage: e.target.value })}
          />
          <label className="mb-4 flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={draft.push?.requireRepoUrl ?? true}
              onChange={(e) => setPush({ requireRepoUrl: e.target.checked })}
              className="size-4 accent-[var(--color-primary)]"
            />
            <span className="text-[0.95rem]">Repository url required</span>
          </label>
          <label className="mb-4 flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={draft.push?.requireCommitUrl ?? false}
              onChange={(e) => setPush({ requireCommitUrl: e.target.checked })}
              className="size-4 accent-[var(--color-primary)]"
            />
            <span className="text-[0.95rem]">Commit url required</span>
          </label>
        </div>
      ) : null}

      {draft.kind === "quiz" ? (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h4 className="font-display text-[1.05rem] font-extrabold">Questions</h4>
            <Button
              size="sm"
              onClick={() => set({ quiz: [...(draft.quiz ?? []), { prompt: "", expected: "" }] })}
            >
              Add question
            </Button>
          </div>
          {(draft.quiz ?? []).map((question, i) => (
            <div key={question._id ?? i} className="mb-2 border border-line-strong bg-panel px-4 pt-4">
              <TextBox
                label={`Question ${i + 1}`}
                value={question.prompt}
                onChange={(e) =>
                  set({
                    quiz: draft.quiz.map((q, j) =>
                      j === i ? { ...q, prompt: e.target.value } : q
                    ),
                  })
                }
              />
              <TextBox
                label="Answer key"
                hint="never sent to the browser"
                value={question.expected ?? ""}
                onChange={(e) =>
                  set({
                    quiz: draft.quiz.map((q, j) =>
                      j === i ? { ...q, expected: e.target.value } : q
                    ),
                  })
                }
              />
              <div className="mb-4">
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => set({ quiz: draft.quiz.filter((_, j) => j !== i) })}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <ChecksEditor checks={draft.checks ?? []} onChange={(checks) => set({ checks })} />

      <TextArea
        label="Rubric"
        hint="what the reviewer judges against — say what a pass looks like, and what should be a revise"
        rows={5}
        value={draft.rubric ?? ""}
        onChange={(e) => set({ rubric: e.target.value })}
      />

      <div className="mb-4 space-y-2">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={draft.requiresSubmission}
            onChange={(e) => set({ requiresSubmission: e.target.checked })}
            className="mt-1 size-4 accent-[var(--color-primary)]"
          />
          <span className="text-[0.95rem]">
            Needs a submission
            <span className="block text-[0.85rem] text-muted">
              Off means the trainee finishes it with a button — right for watch and read steps.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={Boolean(draft.milestone)}
            onChange={(e) => set({ milestone: e.target.checked })}
            className="mt-1 size-4 accent-[var(--color-primary)]"
          />
          <span className="text-[0.95rem]">
            Milestone — always send this one to a person
            <span className="block text-[0.85rem] text-muted">
              This is the dial on your workload. Gate one step in six, not six in six.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={draft.peerReviewable !== false}
            onChange={(e) => set({ peerReviewable: e.target.checked })}
            className="mt-1 size-4 accent-[var(--color-primary)]"
          />
          <span className="text-[0.95rem]">
            Trainees who passed this step may review other people's attempts
          </span>
        </label>
      </div>

      <div className="flex flex-wrap gap-2 pb-4">
        <Button disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save step"}
        </Button>
        <Button variant="quiet" onClick={() => setDraft(step)}>
          Discard
        </Button>
      </div>
    </CollapsibleCard>
  );
}
