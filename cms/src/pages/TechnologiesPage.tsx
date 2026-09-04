import { useState } from "react";
import { Button, EmptyState, SelectBox, TextBox } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { ConfirmButton } from "../components/ConfirmButton";
import { useCreate, useList, useRemove, useReorder, useUpdate } from "../api/queries";
import type { TechGroup, Technology } from "@shared/types";

/** Same labels and order the public track builder uses. */
const GROUPS: Array<{ value: TechGroup; label: string }> = [
  { value: "front", label: "Front end" },
  { value: "back", label: "Back end" },
  { value: "data", label: "Database" },
  { value: "mobile", label: "Mobile" },
  { value: "ai", label: "AI" },
  { value: "ops", label: "DevOps & cloud" },
];

export default function TechnologiesPage() {
  const { data: technologies = [], isLoading } = useList("technologies");
  const create = useCreate("technologies");
  const update = useUpdate("technologies");
  const remove = useRemove("technologies");
  const reorder = useReorder("technologies");

  const [name, setName] = useState("");
  const [group, setGroup] = useState<TechGroup>("front");
  const [weight, setWeight] = useState("3");

  const add = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), group, weight: Number(weight) || 2, order: technologies.length, visible: true },
      { onSuccess: () => setName("") }
    );
  };

  /**
   * Groups are a view over one ordered list, so a move inside a group swaps the
   * two rows where they actually sit globally — the reorder endpoint numbers
   * every id it receives, and a per-group list would collide with the others.
   */
  const swap = (a: Technology, b: Technology) => {
    const next = [...technologies];
    const i = next.indexOf(a);
    const j = next.indexOf(b);
    if (i < 0 || j < 0) return;
    [next[i], next[j]] = [next[j], next[i]];
    reorder.mutate(next.map((t) => t.id));
  };

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: technologies.filter((t) => t.group === g.value),
  }));

  const orphans = technologies.filter((t) => !GROUPS.some((g) => g.value === t.group));

  return (
    <>
      <PageHeader
        title="Track options"
        description="The chips in the “build your own track” panel, in the groups a visitor sees them. Weight is roughly how many weeks that technology adds; the estimate shown is the total × 0.8, capped between 4 and 20 weeks."
        badge={`${technologies.length} options`}
      />

      <div className="mb-8 border border-line-strong bg-panel p-5">
        <h2 className="mb-4 text-step-1">Add an option</h2>
        <div className="grid gap-x-4 md:grid-cols-[1fr_1fr_110px_auto] md:items-end">
          <TextBox
            label="Technology"
            placeholder="e.g. GraphQL"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <SelectBox
            label="Group"
            options={GROUPS}
            value={group}
            onChange={(e) => setGroup(e.target.value as TechGroup)}
          />
          <TextBox
            label="Weight"
            type="number"
            min={1}
            max={12}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <div className="mb-4">
            <Button onClick={add} disabled={!name.trim() || create.isPending}>
              Add
            </Button>
          </div>
        </div>
        {create.isError ? (
          <p className="text-[0.9rem] text-danger">{(create.error as Error).message}</p>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : !technologies.length ? (
        <EmptyState title="No track options yet" />
      ) : (
        <div className="grid gap-5">
          {grouped.map((g) => (
            <GroupPanel
              key={g.value}
              label={g.label}
              items={g.items}
              onSave={(id, patch) => update.mutate({ id, ...patch })}
              onDelete={(id) => remove.mutate(id)}
              onSwap={swap}
              busy={reorder.isPending}
            />
          ))}

          {orphans.length ? (
            <GroupPanel
              label="Ungrouped"
              items={orphans}
              onSave={(id, patch) => update.mutate({ id, ...patch })}
              onDelete={(id) => remove.mutate(id)}
              onSwap={swap}
              busy={reorder.isPending}
            />
          ) : null}
        </div>
      )}
    </>
  );
}

function GroupPanel({
  label,
  items,
  onSave,
  onDelete,
  onSwap,
  busy,
}: {
  label: string;
  items: Technology[];
  onSave: (id: string, patch: Partial<Technology>) => void;
  onDelete: (id: string) => void;
  onSwap: (a: Technology, b: Technology) => void;
  busy: boolean;
}) {
  const shown = items.filter((t) => t.visible);
  const weeks = shown.reduce((sum, t) => sum + (t.weight || 0), 0);

  return (
    <section className="border border-line-strong bg-panel">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="font-display text-[1.05rem] font-extrabold">{label}</h2>
        <p className="font-mono text-[0.74rem] tabular-nums text-muted">
          {items.length} options
          {items.length - shown.length ? ` · ${items.length - shown.length} hidden` : ""}
          {weeks ? ` · weight ${weeks}` : ""}
        </p>
      </header>

      {!items.length ? (
        <p className="px-4 py-5 text-[0.9rem] text-muted">Nothing in this group yet.</p>
      ) : (
        <>
          {/* Column headings once per group, instead of on every row. */}
          <div className="grid grid-cols-[3.2rem_1fr_5rem_8.5rem_auto] items-center gap-x-3 border-b border-line px-4 py-2 font-mono text-[0.68rem] tracking-wide text-muted uppercase">
            <span>Order</span>
            <span>Name</span>
            <span>Weight</span>
            <span>Group</span>
            <span className="text-right">On site</span>
          </div>

          <ul className="m-0 list-none p-0">
            {items.map((tech, i) => (
              <TechRow
                key={tech.id}
                tech={tech}
                first={i === 0}
                last={i === items.length - 1}
                busy={busy}
                onSave={(patch) => onSave(tech.id, patch)}
                onDelete={() => onDelete(tech.id)}
                onUp={() => onSwap(tech, items[i - 1])}
                onDown={() => onSwap(tech, items[i + 1])}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function TechRow({
  tech,
  first,
  last,
  busy,
  onSave,
  onDelete,
  onUp,
  onDown,
}: {
  tech: Technology;
  first: boolean;
  last: boolean;
  busy: boolean;
  onSave: (patch: Partial<Technology>) => void;
  onDelete: () => void;
  onUp: () => void;
  onDown: () => void;
}) {
  const [draft, setDraft] = useState({ name: tech.name, weight: tech.weight });
  const dirty = draft.name !== tech.name || draft.weight !== tech.weight;

  const input =
    "w-full rounded-card border border-transparent bg-transparent px-2 py-1.5 text-[0.95rem] outline-none hover:border-line-strong focus:border-primary focus:bg-panel";

  return (
    <li className="grid grid-cols-[3.2rem_1fr_5rem_8.5rem_auto] items-center gap-x-3 border-b border-line px-4 py-1.5 last:border-b-0 hover:bg-paper">
      <span className="flex gap-0.5">
        <Button
          variant="quiet"
          size="sm"
          aria-label={`Move ${tech.name} up`}
          disabled={first || busy}
          onClick={onUp}
          className="border-transparent px-1.5 py-0.5"
        >
          ↑
        </Button>
        <Button
          variant="quiet"
          size="sm"
          aria-label={`Move ${tech.name} down`}
          disabled={last || busy}
          onClick={onDown}
          className="border-transparent px-1.5 py-0.5"
        >
          ↓
        </Button>
      </span>

      <input
        aria-label="Name"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        className={`${input} font-mono ${tech.visible ? "" : "text-muted line-through"}`}
      />

      <input
        aria-label="Weight"
        type="number"
        min={1}
        max={12}
        value={draft.weight}
        onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) })}
        className={`${input} tabular-nums`}
      />

      <select
        aria-label="Group"
        value={tech.group}
        onChange={(e) => onSave({ group: e.target.value as TechGroup })}
        className={`${input} cursor-pointer text-[0.85rem]`}
      >
        {GROUPS.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </select>

      <span className="flex items-center justify-end gap-2">
        {dirty ? (
          <Button size="sm" onClick={() => onSave(draft)}>
            Save
          </Button>
        ) : null}
        <label className="flex cursor-pointer items-center gap-1.5 text-[0.82rem] text-muted">
          <input
            type="checkbox"
            checked={tech.visible}
            onChange={(e) => onSave({ visible: e.target.checked })}
            className="size-4 accent-[var(--color-primary)]"
          />
          <span className="sr-only">Show {tech.name} on the site</span>
        </label>
        <ConfirmButton label="Delete" onConfirm={onDelete} />
      </span>
    </li>
  );
}
