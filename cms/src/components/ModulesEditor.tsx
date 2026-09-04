import { useState } from "react";
import { Button, Chevron, TextArea, TextBox } from "@shared/ui";
import type { ProgramModule } from "@shared/types";

interface ModulesEditorProps {
  modules: ProgramModule[];
  onChange: (modules: ProgramModule[]) => void;
}

/**
 * The curriculum, block by block. Each module is a card you can fold away, so a
 * thirteen-section course stays navigable; topics are edited one per line, the
 * same shape they render in.
 */
export function ModulesEditor({ modules, onChange }: ModulesEditorProps) {
  // Collapsed by default — the list is for finding a section, not reading it.
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  const toggle = (index: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const update = (index: number, patch: Partial<ProgramModule>) =>
    onChange(modules.map((module, i) => (i === index ? { ...module, ...patch } : module)));

  /** Moving a card has to carry its open/closed state with it. */
  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= modules.length) return;

    const next = [...modules];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    onChange(next);

    setOpen((current) => {
      const swapped = new Set(current);
      const hadFrom = current.has(index);
      const hadTo = current.has(to);
      swapped.delete(index);
      swapped.delete(to);
      if (hadFrom) swapped.add(to);
      if (hadTo) swapped.add(index);
      return swapped;
    });
  };

  /** Removing one shifts every index above it down by one. */
  const remove = (index: number) => {
    onChange(modules.filter((_, i) => i !== index));
    setOpen((current) => {
      const next = new Set<number>();
      current.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  const add = () => {
    onChange([...modules, { title: "", summary: "", duration: "", topics: [] }]);
    // A section you just created should be ready to type into.
    setOpen((current) => new Set(current).add(modules.length));
  };

  const topicCount = modules.reduce((sum, m) => sum + (m.topics?.length ?? 0), 0);
  const allOpen = modules.length > 0 && open.size >= modules.length;

  return (
    <section className="mt-8 border-t border-line pt-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-step-1">Curriculum</h2>
          <p className="mt-1 max-w-[64ch] text-[0.9rem] text-muted">
            {modules.length} sections · {topicCount} topics. This is what a visitor sees when they
            open the program. Assign lectures to a section under Video lessons.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {modules.length > 1 ? (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setOpen(allOpen ? new Set() : new Set(modules.map((_, i) => i)))}
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </Button>
          ) : null}
          <Button size="sm" onClick={add}>
            Add section
          </Button>
        </div>
      </div>

      {!modules.length ? (
        <p className="border border-dashed border-line-strong px-4 py-8 text-center text-[0.95rem] text-muted">
          No sections yet. Break the course into blocks and it reads as a syllabus rather than a
          list.
        </p>
      ) : null}

      <div className="grid gap-2">
        {modules.map((module, index) => {
          const isOpen = open.has(index);
          const panelId = `module-panel-${index}`;

          return (
            <div
              key={module._id ?? index}
              className={`border bg-panel transition-colors ${
                isOpen ? "border-primary" : "border-line-strong"
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggle(index)}
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
                        module.title ? "" : "text-muted italic"
                      }`}
                    >
                      {module.title || "Untitled section"}
                    </span>
                    {!isOpen ? (
                      <span className="mt-0.5 block truncate font-mono text-[0.74rem] text-muted">
                        {[module.duration, `${module.topics?.length ?? 0} topics`, module.summary]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    ) : null}
                  </span>
                </button>

                <div className="flex flex-none gap-1.5 pr-3">
                  <Button
                    variant="quiet"
                    size="sm"
                    aria-label="Move section up"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="px-2"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="quiet"
                    size="sm"
                    aria-label="Move section down"
                    disabled={index === modules.length - 1}
                    onClick={() => move(index, 1)}
                    className="px-2"
                  >
                    ↓
                  </Button>
                  <Button variant="quiet" size="sm" onClick={() => remove(index)}>
                    Remove
                  </Button>
                </div>
              </div>

              {isOpen ? (
                <div id={panelId} className="animate-panel-open border-t border-line px-4 pt-4">
                  <div className="grid gap-x-4 md:grid-cols-[1fr_180px] md:items-end">
                    <TextBox
                      label="Section title"
                      placeholder="e.g. Application Deployment"
                      value={module.title ?? ""}
                      onChange={(e) => update(index, { title: e.target.value })}
                    />
                    <TextBox
                      label="Length"
                      hint="e.g. 3 weeks"
                      value={module.duration ?? ""}
                      onChange={(e) => update(index, { duration: e.target.value })}
                    />
                  </div>

                  <TextBox
                    label="One-line summary"
                    placeholder="What this block is really about"
                    value={module.summary ?? ""}
                    onChange={(e) => update(index, { summary: e.target.value })}
                  />

                  <TextArea
                    label="Topics"
                    hint="one per line — only shown while the section has no lectures"
                    rows={5}
                    value={(module.topics ?? []).join("\n")}
                    onChange={(e) =>
                      update(index, {
                        topics: e.target.value.split("\n").map((line) => line.trimStart()),
                      })
                    }
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
