import { useState } from "react";
import { Badge, Button, Chevron, TextArea, TextBox } from "@shared/ui";
import { MediaPicker } from "./MediaPicker";
import type { SectionItem, SectionType } from "@shared/types";

/** What each layout calls its item fields, so the labels make sense in context. */
const LABELS: Partial<Record<SectionType, { heading: string; meta: string; text: string; add: string; one: string }>> = {
  cards: { heading: "Card title", meta: "Bullet points (one per line)", text: "Card text", add: "Add card", one: "card" },
  steps: { heading: "Step title", meta: "Step label (e.g. Step 1)", text: "Step text", add: "Add step", one: "step" },
  week: { heading: "Column title", meta: "Label above the title", text: "Column text", add: "Add column", one: "column" },
  split: { heading: "Value", meta: "Label", text: "", add: "Add fact", one: "fact" },
  gallery: { heading: "Caption", meta: "", text: "", add: "Add image", one: "image" },
  quote: { heading: "Attribution", meta: "Role or company", text: "", add: "Add attribution", one: "attribution" },
};

const DEFAULT_LABELS = { heading: "Title", meta: "Label", text: "Text", add: "Add item", one: "item" };

interface ItemsEditorProps {
  type: SectionType;
  items: SectionItem[];
  onChange: (items: SectionItem[]) => void;
}

/**
 * Repeatable rows inside a section. Each one folds away, so a section with six
 * cards is a list you can scan rather than six stacked forms.
 */
export function ItemsEditor({ type, items, onChange }: ItemsEditorProps) {
  const labels = LABELS[type] ?? DEFAULT_LABELS;
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  const toggle = (index: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const update = (index: number, patch: Partial<SectionItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  /** Moving a card carries its open state with it. */
  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= items.length) return;

    const next = [...items];
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

  /** Removing one shifts every index above it down. */
  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
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
    onChange([...items, {}]);
    setOpen((current) => new Set(current).add(items.length));
  };

  const allOpen = items.length > 0 && open.size >= items.length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-step-1">
          Items <span className="font-sans text-[0.85rem] font-normal text-muted">({items.length})</span>
        </h3>
        <div className="flex gap-2">
          {items.length > 1 ? (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setOpen(allOpen ? new Set() : new Set(items.map((_, i) => i)))}
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </Button>
          ) : null}
          <Button size="sm" onClick={add}>
            {labels.add}
          </Button>
        </div>
      </div>

      {!items.length ? (
        <p className="border border-dashed border-line-strong px-4 py-6 text-center text-[0.95rem] text-muted">
          No items yet. This layout uses them for its repeated blocks.
        </p>
      ) : null}

      <div className="grid gap-2">
        {items.map((item, index) => {
          const isOpen = open.has(index);
          const panelId = `item-panel-${index}`;
          const summary = [item.text, item.meta?.split("\n")[0]].filter(Boolean).join(" · ");

          return (
            <div
              key={item._id ?? index}
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
                      className={`block truncate font-semibold group-hover:text-primary ${
                        item.title ? "" : "text-muted italic"
                      }`}
                    >
                      {item.title || `Untitled ${labels.one}`}
                    </span>
                    {!isOpen && summary ? (
                      <span className="mt-0.5 block truncate text-[0.82rem] text-muted">{summary}</span>
                    ) : null}
                  </span>
                </button>

                <div className="flex flex-none items-center gap-1.5 pr-3">
                  {item.featured ? <Badge tone="primary">featured</Badge> : null}
                  <Button
                    variant="quiet"
                    size="sm"
                    aria-label="Move up"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="px-2"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="quiet"
                    size="sm"
                    aria-label="Move down"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
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
                  <div className="grid gap-x-4 md:grid-cols-2">
                    <TextBox
                      label={labels.heading}
                      value={item.title ?? ""}
                      onChange={(e) => update(index, { title: e.target.value })}
                    />
                    {labels.meta ? (
                      type === "cards" ? (
                        <TextArea
                          label={labels.meta}
                          rows={5}
                          value={item.meta ?? ""}
                          onChange={(e) => update(index, { meta: e.target.value })}
                        />
                      ) : (
                        <TextBox
                          label={labels.meta}
                          value={item.meta ?? ""}
                          onChange={(e) => update(index, { meta: e.target.value })}
                        />
                      )
                    ) : null}
                  </div>

                  {labels.text ? (
                    <TextArea
                      label={labels.text}
                      value={item.text ?? ""}
                      onChange={(e) => update(index, { text: e.target.value })}
                    />
                  ) : null}

                  {type === "cards" ? (
                    <>
                      <div className="grid gap-x-4 md:grid-cols-2">
                        <TextBox
                          label="Badge"
                          hint="small pill above the title, e.g. Most attention"
                          value={item.badge ?? ""}
                          onChange={(e) => update(index, { badge: e.target.value })}
                        />
                        <TextBox
                          label="Button label"
                          hint="leave empty for no button"
                          value={item.ctaLabel ?? ""}
                          onChange={(e) => update(index, { ctaLabel: e.target.value })}
                        />
                        <TextBox
                          label="Price"
                          hint="currency included, e.g. $50"
                          value={item.price ?? ""}
                          onChange={(e) => update(index, { price: e.target.value })}
                        />
                        <TextBox
                          label="Price note"
                          hint='e.g. "per hour"'
                          value={item.priceNote ?? ""}
                          onChange={(e) => update(index, { priceNote: e.target.value })}
                        />
                      </div>

                      <label className="mb-4 flex cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={Boolean(item.featured)}
                          onChange={(e) => update(index, { featured: e.target.checked })}
                          className="size-4 accent-[var(--color-primary)]"
                        />
                        <span className="text-[0.95rem]">
                          Feature this card — accent bar, tint and a stronger border
                        </span>
                      </label>
                    </>
                  ) : null}

                  <div className="grid gap-x-4 md:grid-cols-2">
                    <MediaPicker
                      label="Image"
                      kind="image"
                      folder="sections"
                      value={item.media}
                      onChange={(id) => update(index, { media: id })}
                    />
                    <TextBox
                      label="Link"
                      hint={type === "cards" ? "where the button goes, e.g. #enroll" : "(optional)"}
                      value={item.href ?? ""}
                      onChange={(e) => update(index, { href: e.target.value })}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
