import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, EmptyState, TextBox } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { OrderableList } from "../components/OrderableList";
import { ConfirmButton } from "../components/ConfirmButton";
import { useCreate, useList, useRemove, useReorder, useUpdate } from "../api/queries";

export default function ProgramsPage() {
  const { data: programs = [], isLoading } = useList("programs");
  const { data: lessons = [] } = useList("lessons");
  const create = useCreate("programs");
  const update = useUpdate("programs");
  const remove = useRemove("programs");
  const reorder = useReorder("programs");

  const [title, setTitle] = useState("");

  const add = () => {
    if (!title.trim()) return;
    create.mutate(
      { title: title.trim(), order: programs.length, visible: true, outcomes: [] },
      { onSuccess: () => setTitle("") }
    );
  };

  const countFor = (programId: string) => lessons.filter((l) => l.program === programId).length;

  return (
    <>
      <PageHeader
        title="Programs"
        description="The courses listed on the site. Their order here is their order on the page."
        badge={`${programs.length} programs`}
      />

      <div className="mb-8 border border-line-strong bg-panel p-5">
        <div className="grid gap-x-4 md:grid-cols-[1fr_auto] md:items-end">
          <TextBox
            label="New program"
            placeholder="e.g. Data engineering"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <div className="mb-4">
            <Button onClick={add} disabled={!title.trim() || create.isPending}>
              Add program
            </Button>
          </div>
        </div>
        {create.isError ? (
          <p className="text-[0.9rem] text-danger">{(create.error as Error).message}</p>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : !programs.length ? (
        <EmptyState title="No programs yet" />
      ) : (
        <OrderableList
          items={programs}
          getId={(p) => p.id}
          disabled={reorder.isPending}
          onReorder={(ids) => reorder.mutate(ids)}
          renderItem={(program) => (
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/programs/${program.id}`}
                  className="font-display text-[1.15rem] font-extrabold no-underline hover:text-primary"
                >
                  {program.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.82rem] text-muted">
                  <span className="font-mono">#{program.slug}</span>
                  {program.stack ? <span>{program.stack}</span> : null}
                  <Badge>{countFor(program.id)} lessons</Badge>
                  <Badge tone="neutral">{program.outcomes?.length ?? 0} outcomes</Badge>
                </p>
              </div>

              <div className="flex flex-none flex-wrap gap-2">
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => update.mutate({ id: program.id, visible: !program.visible })}
                >
                  {program.visible ? "Visible" : "Hidden"}
                </Button>
                <Link
                  to={`/programs/${program.id}`}
                  className="inline-flex items-center rounded-card border-[1.5px] border-primary bg-primary px-3.5 py-2 text-[0.9rem] font-semibold text-white no-underline hover:bg-primary-deep"
                >
                  Edit
                </Link>
                <ConfirmButton label="Delete" onConfirm={() => remove.mutate(program.id)} />
              </div>
            </div>
          )}
        />
      )}
    </>
  );
}
