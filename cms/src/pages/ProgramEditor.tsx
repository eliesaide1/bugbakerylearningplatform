import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Badge, Button, TextArea, TextBox } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { SaveBar } from "../components/SaveBar";
import { MediaPicker } from "../components/MediaPicker";
import { ModulesEditor } from "../components/ModulesEditor";
import { ConfirmButton } from "../components/ConfirmButton";
import { useDraft } from "../hooks/useDraft";
import { useList, useRemove, useUpdate } from "../api/queries";
import type { Program } from "@shared/types";

export default function ProgramEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: programs = [], isLoading } = useList("programs");
  const { data: lessons = [] } = useList("lessons");
  const update = useUpdate("programs");
  const remove = useRemove("programs");

  const source = programs.find((p) => p.id === id);
  const { draft, set, dirty, remoteChanged, commit, reset, adoptRemote } = useDraft<Program>(source);

  if (isLoading) return <p className="text-muted">Loading…</p>;
  if (!draft) {
    return (
      <>
        <PageHeader title="Program not found" />
        <Link to="/programs" className="text-primary underline-offset-4 hover:underline">
          ← Back to programs
        </Link>
      </>
    );
  }

  const own = lessons.filter((l) => l.program === draft.id);

  const save = () =>
    update.mutate(
      {
        id: draft.id,
        title: draft.title,
        slug: draft.slug,
        stack: draft.stack,
        summary: draft.summary,
        instructor: draft.instructor,
        badge: draft.badge,
        price: draft.price,
        originalPrice: draft.originalPrice,
        outcomes: draft.outcomes,
        modules: draft.modules,
        level: draft.level,
        length: draft.length,
        prerequisite: draft.prerequisite,
        finishWith: draft.finishWith,
        cover: draft.cover,
        visible: draft.visible,
      },
      { onSuccess: (saved) => commit(saved) }
    );

  return (
    <>
      <PageHeader
        title={draft.title}
        description="What a visitor sees in the programs list and on the program's own page."
        badge={draft.visible ? "Visible" : "Hidden"}
        actions={
          <>
            <Link
              to="/programs"
              className="inline-flex items-center rounded-card border-[1.5px] border-line-strong px-3.5 py-2 text-[0.9rem] font-semibold text-ink-2 no-underline hover:border-ink-2"
            >
              ← All programs
            </Link>
            <ConfirmButton
              label="Delete program"
              onConfirm={() => remove.mutate(draft.id, { onSuccess: () => navigate("/programs") })}
            />
          </>
        }
      />

      {remoteChanged && source ? (
        <Alert tone="info" className="mb-5">
          Someone else saved this program.{" "}
          <button
            type="button"
            onClick={() => adoptRemote(source)}
            className="cursor-pointer font-semibold underline underline-offset-4"
          >
            Load their version
          </button>
        </Alert>
      ) : null}

      <div className="grid gap-x-6 lg:grid-cols-2">
        <TextBox label="Title" value={draft.title ?? ""} onChange={(e) => set({ title: e.target.value })} />
        <TextBox
          label="Url slug"
          hint="leave empty to generate from the title"
          value={draft.slug ?? ""}
          onChange={(e) => set({ slug: e.target.value })}
        />
        <TextBox
          label="Stack line"
          hint="e.g. React · Node.js · Express · MongoDB"
          value={draft.stack ?? ""}
          onChange={(e) => set({ stack: e.target.value })}
        />
        <TextBox
          label="Instructor"
          hint="shown on the course card"
          value={draft.instructor ?? ""}
          onChange={(e) => set({ instructor: e.target.value })}
        />
        <TextBox
          label="Level"
          value={draft.level ?? ""}
          onChange={(e) => set({ level: e.target.value })}
        />
        <TextBox
          label="Length"
          hint="e.g. 12 weeks"
          value={draft.length ?? ""}
          onChange={(e) => set({ length: e.target.value })}
        />
        <TextBox
          label="Prerequisite"
          value={draft.prerequisite ?? ""}
          onChange={(e) => set({ prerequisite: e.target.value })}
        />
        <TextBox
          label="You finish with"
          value={draft.finishWith ?? ""}
          onChange={(e) => set({ finishWith: e.target.value })}
        />
      </div>

      <div className="grid gap-x-6 lg:grid-cols-3">
        <TextBox
          label="Card badge"
          hint='e.g. "Most popular" — leave empty for none'
          value={draft.badge ?? ""}
          onChange={(e) => set({ badge: e.target.value })}
        />
        <TextBox
          label="Price"
          hint="written as you want it read, currency included"
          value={draft.price ?? ""}
          onChange={(e) => set({ price: e.target.value })}
        />
        <TextBox
          label="Was"
          hint="struck through beside the price"
          value={draft.originalPrice ?? ""}
          onChange={(e) => set({ originalPrice: e.target.value })}
        />
      </div>

      <TextArea
        label="Summary"
        hint="one or two sentences, shown on the program page"
        rows={3}
        value={draft.summary ?? ""}
        onChange={(e) => set({ summary: e.target.value })}
      />

      <TextArea
        label="What you learn"
        hint="one bullet per line — only shown when there are no modules below"
        rows={10}
        value={(draft.outcomes ?? []).join("\n")}
        onChange={(e) =>
          set({ outcomes: e.target.value.split("\n").map((line) => line.trimStart()) })
        }
      />

      <MediaPicker
        label="Cover image"
        kind="image"
        folder="programs"
        value={draft.cover}
        onChange={(mediaRef) => set({ cover: mediaRef })}
      />

      <ModulesEditor modules={draft.modules ?? []} onChange={(modules) => set({ modules })} />

      <section className="mt-8 border-t border-line pt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-step-1">Lessons in this program</h2>
          <Link
            to={`/lessons?program=${draft.id}`}
            className="inline-flex items-center rounded-card border-[1.5px] border-primary bg-primary px-3.5 py-2 text-[0.9rem] font-semibold text-white no-underline hover:bg-primary-deep"
          >
            Manage lessons
          </Link>
        </div>

        {!own.length ? (
          <p className="text-[0.95rem] text-muted">
            No lessons yet. Add them under Video lessons — mark one free and it becomes this program's
            public preview.
          </p>
        ) : (
          <ul className="m-0 list-none border-t border-line-strong p-0">
            {own.map((lesson) => (
              <li
                key={lesson.id}
                className="flex flex-wrap items-center gap-3 border-b border-line-strong py-3"
              >
                <span className="font-semibold">{lesson.title}</span>
                {lesson.isFree ? <Badge tone="secondary">free preview</Badge> : null}
                {!lesson.visible ? <Badge>hidden</Badge> : null}
                <span className="ml-auto font-mono text-[0.78rem] text-muted">{lesson.source}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

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
