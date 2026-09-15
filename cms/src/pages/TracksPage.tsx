import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, EmptyState, TextBox } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { OrderableList } from "../components/OrderableList";
import { ConfirmButton } from "../components/ConfirmButton";
import { useCreate, useList, useRemove, useReorder, useUpdate } from "../api/queries";

export default function TracksPage() {
  const { data: tracks = [], isLoading } = useList("tracks");
  const { data: steps = [] } = useList("steps");
  const create = useCreate("tracks");
  const update = useUpdate("tracks");
  const remove = useRemove("tracks");
  const reorder = useReorder("tracks");

  const [title, setTitle] = useState("");

  const stepsIn = (trackId: string) => steps.filter((s) => s.track === trackId);

  const add = () => {
    if (!title.trim()) return;
    create.mutate({ title: title.trim(), order: tracks.length, visible: true }, {
      onSuccess: () => setTitle(""),
    });
  };

  return (
    <>
      <PageHeader
        title="Bootcamp tracks"
        description="A track is what someone enrols in. The steps inside it are what they actually do — watch, build, fix a bug, ship."
        badge={`${tracks.length} tracks`}
      />

      <div className="mb-8 border border-line-strong bg-panel p-5">
        <div className="grid gap-x-4 md:grid-cols-[1fr_auto] md:items-end">
          <TextBox
            label="New track"
            placeholder="e.g. MERN Stack Bootcamp"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <div className="mb-4">
            <Button onClick={add} disabled={!title.trim() || create.isPending}>
              Add track
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : !tracks.length ? (
        <EmptyState
          title="No tracks yet"
          message="Add one above, then fill it with steps."
        />
      ) : (
        <OrderableList
          items={tracks}
          getId={(t) => t.id}
          disabled={reorder.isPending}
          onReorder={(ids) => reorder.mutate(ids)}
          renderItem={(track) => {
            const own = stepsIn(track.id);
            const milestones = own.filter((s) => s.milestone).length;

            return (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={`/tracks/${track.id}`}
                  className="min-w-0 flex-1 font-display text-[1.05rem] font-extrabold no-underline hover:text-primary"
                >
                  {track.title}
                </Link>

                <div className="flex flex-none flex-wrap items-center gap-2">
                  <Badge>{own.length} steps</Badge>
                  {milestones ? <Badge tone="primary">{milestones} reviewed by you</Badge> : null}
                  <Badge>{track.gate === "open" ? "open order" : "sequential"}</Badge>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => update.mutate({ id: track.id, visible: !track.visible })}
                  >
                    {track.visible ? "Visible" : "Hidden"}
                  </Button>
                  <Link
                    to={`/tracks/${track.id}`}
                    className="rounded-card border-[1.5px] border-line-strong px-3.5 py-2 text-[0.9rem] font-semibold text-ink-2 no-underline hover:border-ink-2 hover:text-ink"
                  >
                    Edit
                  </Link>
                  <ConfirmButton label="Delete" onConfirm={() => remove.mutate(track.id)} />
                </div>
              </div>
            );
          }}
        />
      )}
    </>
  );
}
