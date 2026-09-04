import type { ReactNode } from "react";
import { Button } from "@shared/ui";

interface OrderableListProps<T> {
  /** The rows to render — a single page when the list is paginated. */
  items: T[];
  getId: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  /** Receives the ids of the WHOLE list in their new order. */
  onReorder: (ids: string[]) => void;
  /**
   * The full list behind `items`. Ordering is computed against this, so moving
   * a row on page 2 lands it in the right global position rather than
   * renumbering that page from zero.
   */
  allItems?: T[];
  /** Index of `items[0]` within `allItems`. */
  offset?: number;
  disabled?: boolean;
}

/**
 * Move-up / move-down ordering. Keyboard reachable, which drag-and-drop is not,
 * and the order it produces is exactly what the reorder endpoint expects.
 */
export function OrderableList<T>({
  items,
  getId,
  renderItem,
  onReorder,
  allItems,
  offset = 0,
  disabled = false,
}: OrderableListProps<T>) {
  const all = allItems ?? items;

  const move = (pageIndex: number, delta: number) => {
    const from = offset + pageIndex;
    const to = from + delta;
    if (to < 0 || to >= all.length) return;

    const next = [...all];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next.map(getId));
  };

  return (
    <ul className="m-0 list-none border-t border-line-strong p-0">
      {items.map((item, pageIndex) => {
        const globalIndex = offset + pageIndex;

        return (
          <li
            key={getId(item)}
            className="flex items-start gap-4 border-b border-line-strong bg-panel px-4 py-4"
          >
            <div className="flex flex-none flex-col items-center gap-1 pt-0.5">
              <Button
                variant="quiet"
                size="sm"
                aria-label="Move up"
                disabled={disabled || globalIndex === 0}
                onClick={() => move(pageIndex, -1)}
                className="px-2 py-0.5"
              >
                ↑
              </Button>
              <span className="font-mono text-[0.7rem] tabular-nums text-muted">
                {globalIndex + 1}
              </span>
              <Button
                variant="quiet"
                size="sm"
                aria-label="Move down"
                disabled={disabled || globalIndex === all.length - 1}
                onClick={() => move(pageIndex, 1)}
                className="px-2 py-0.5"
              >
                ↓
              </Button>
            </div>

            <div className="min-w-0 flex-1">{renderItem(item, globalIndex)}</div>
          </li>
        );
      })}
    </ul>
  );
}
