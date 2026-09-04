import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Badge, Button, EmptyState, SelectBox, TextArea, TextBox } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { OrderableList } from "../components/OrderableList";
import { Pagination } from "../components/Pagination";
import { MediaPicker } from "../components/MediaPicker";
import { ConfirmButton } from "../components/ConfirmButton";
import { useCreate, useList, useRemove, useReorder, useUpdate } from "../api/queries";
import { hasVideo } from "@shared/media";
import type { Lesson, LessonSource, ProgramModule } from "@shared/types";

const SOURCES: Array<{ value: LessonSource; label: string }> = [
  { value: "upload", label: "Uploaded video file" },
  { value: "youtube", label: "YouTube link" },
  { value: "vimeo", label: "Vimeo link" },
  { value: "url", label: "Other video url" },
];

export default function LessonsPage() {
  const [params, setParams] = useSearchParams();
  const programId = params.get("program") ?? "";

  const { data: programs = [] } = useList("programs");
  const { data: lessons = [], isLoading } = useList("lessons", programId ? { program: programId } : undefined);
  const create = useCreate("lessons");
  const update = useUpdate("lessons");
  const remove = useRemove("lessons");
  const reorder = useReorder("lessons");

  const [title, setTitle] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const pages = Math.max(1, Math.ceil(lessons.length / perPage));
  // Deleting the last row on the last page must not strand you past the end.
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  // A different program is a different list; start at the top of it.
  useEffect(() => {
    setPage(1);
    setExpanded(null);
  }, [programId]);

  const visible = useMemo(
    () => lessons.slice((page - 1) * perPage, page * perPage),
    [lessons, page, perPage]
  );

  const programOptions = programs.map((p) => ({ value: p.id, label: p.title }));
  const targetProgram = programId || programs[0]?.id;

  const add = () => {
    if (!title.trim() || !targetProgram) return;
    create.mutate(
      { title: title.trim(), program: targetProgram, order: lessons.length, visible: true, source: "upload" },
      {
        onSuccess: (lesson) => {
          setTitle("");
          setExpanded(lesson.id);
          // New lessons go to the end, so follow them there.
          setPage(Math.max(1, Math.ceil((lessons.length + 1) / perPage)));
        },
      }
    );
  };

  return (
    <>
      <PageHeader
        title="Video lessons"
        description="Upload a recording or paste a link. Marking a lesson free publishes it as that program's open preview — no account needed to watch it."
        badge={
          lessons.filter((l) => !hasVideo(l)).length
            ? `${lessons.length} lessons · ${lessons.filter((l) => !hasVideo(l)).length} need a video`
            : `${lessons.length} lessons`
        }
      />

      {!programs.length ? (
        <Alert tone="info">Add a program first — every lesson belongs to one.</Alert>
      ) : (
        <>
          <div className="mb-8 border border-line-strong bg-panel p-5">
            <div className="grid gap-x-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <SelectBox
                label="Program"
                options={programOptions}
                value={targetProgram}
                onChange={(e) => setParams(e.target.value ? { program: e.target.value } : {})}
              />
              <TextBox
                label="New lesson"
                placeholder="e.g. Building your first Express API"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
              <div className="mb-4">
                <Button onClick={add} disabled={!title.trim() || create.isPending}>
                  Add lesson
                </Button>
              </div>
            </div>
            {create.isError ? (
              <p className="text-[0.9rem] text-danger">{(create.error as Error).message}</p>
            ) : null}
          </div>

          {isLoading ? (
            <p className="text-muted">Loading…</p>
          ) : !lessons.length ? (
            <EmptyState title="No lessons in this program yet" />
          ) : (
            <OrderableList
              items={visible}
              allItems={lessons}
              offset={(page - 1) * perPage}
              getId={(l) => l.id}
              disabled={reorder.isPending}
              onReorder={(ids) => reorder.mutate(ids)}
              renderItem={(lesson) => (
                <LessonRow
                  modules={programs.find((p) => p.id === lesson.program)?.modules ?? []}
                  lesson={lesson}
                  open={expanded === lesson.id}
                  onToggle={() => setExpanded(expanded === lesson.id ? null : lesson.id)}
                  onSave={(patch) => update.mutate({ id: lesson.id, ...patch })}
                  onDelete={() => remove.mutate(lesson.id)}
                  saving={update.isPending}
                />
              )}
            />
          )}

          {lessons.length ? (
            <Pagination
              page={page}
              perPage={perPage}
              total={lessons.length}
              onPage={setPage}
              onPerPage={(n) => {
                setPerPage(n);
                setPage(1);
              }}
              noun="lessons"
            />
          ) : null}
        </>
      )}
    </>
  );
}

function LessonRow({
  lesson,
  modules,
  open,
  onToggle,
  onSave,
  onDelete,
  saving,
}: {
  lesson: Lesson;
  modules: ProgramModule[];
  open: boolean;
  onToggle: () => void;
  onSave: (patch: Partial<Lesson>) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<Lesson>(lesson);
  const set = (patch: Partial<Lesson>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 cursor-pointer text-left font-display text-[1.05rem] font-extrabold hover:text-primary"
        >
          {lesson.title}
        </button>

        <div className="flex flex-none flex-wrap items-center gap-2">
          {lesson.isFree ? <Badge tone="secondary">free</Badge> : null}
          {hasVideo(lesson) ? null : <Badge tone="danger">needs video</Badge>}
          {lesson.module != null && modules[lesson.module] ? (
            <Badge tone="primary">{modules[lesson.module].title}</Badge>
          ) : null}
          {lesson.duration ? <Badge>{lesson.duration}</Badge> : null}
          <Badge>{lesson.source}</Badge>
          <Button variant="quiet" size="sm" onClick={() => onSave({ visible: !lesson.visible })}>
            {lesson.visible ? "Visible" : "Hidden"}
          </Button>
          <Button variant="quiet" size="sm" onClick={onToggle}>
            {open ? "Close" : "Edit"}
          </Button>
          <ConfirmButton label="Delete" onConfirm={onDelete} />
        </div>
      </div>

      {open ? (
        <div className="animate-panel-open mt-4 border-t border-line pt-4">
          <div className="grid gap-x-4 md:grid-cols-2">
            <TextBox label="Title" value={draft.title} onChange={(e) => set({ title: e.target.value })} />
            <TextBox
              label="Url slug"
              hint="leave empty to generate"
              value={draft.slug ?? ""}
              onChange={(e) => set({ slug: e.target.value })}
            />
            <SelectBox
              label="Where the video comes from"
              options={SOURCES}
              value={draft.source}
              onChange={(e) => set({ source: e.target.value as LessonSource })}
            />
            <TextBox
              label="Duration"
              hint="as written on the video, e.g. 13:32"
              value={draft.duration ?? ""}
              onChange={(e) => set({ duration: e.target.value })}
            />
            <SelectBox
              label="Module"
              hint="where it sits in the curriculum"
              options={[
                { value: "", label: "Not in a module" },
                ...modules.map((m, i) => ({
                  value: String(i),
                  label: `${String(i + 1).padStart(2, "0")} · ${m.title}`,
                })),
              ]}
              value={draft.module == null ? "" : String(draft.module)}
              onChange={(e) => set({ module: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </div>

          <TextArea
            label="Description"
            rows={3}
            value={draft.description ?? ""}
            onChange={(e) => set({ description: e.target.value })}
          />

          {draft.source === "upload" ? (
            <MediaPicker
              label="Video file"
              kind="video"
              folder="lessons"
              value={draft.media}
              onChange={(id) => set({ media: id })}
            />
          ) : (
            <TextBox
              label="Video link"
              placeholder="https://www.youtube.com/watch?v=…"
              value={draft.videoUrl ?? ""}
              onChange={(e) => set({ videoUrl: e.target.value })}
            />
          )}

          <MediaPicker
            label="Thumbnail"
            kind="image"
            folder="lessons"
            hint="(optional)"
            value={draft.thumbnail}
            onChange={(id) => set({ thumbnail: id })}
          />

          <label className="mb-4 flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={draft.isFree}
              onChange={(e) => set({ isFree: e.target.checked })}
              className="size-4 accent-[var(--color-primary)]"
            />
            <span className="text-[0.95rem]">
              Free preview — anyone can watch this without enrolling
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={saving}
              onClick={() =>
                onSave({
                  title: draft.title,
                  slug: draft.slug,
                  description: draft.description,
                  source: draft.source,
                  media: draft.media,
                  videoUrl: draft.videoUrl,
                  thumbnail: draft.thumbnail,
                  duration: draft.duration,
                  module: draft.module ?? null,
                  isFree: draft.isFree,
                })
              }
            >
              {saving ? "Saving…" : "Save lesson"}
            </Button>
            <Button variant="quiet" onClick={() => setDraft(lesson)}>
              Discard
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
