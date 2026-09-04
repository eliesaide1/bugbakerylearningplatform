import { Button, SelectBox } from "@shared/ui";

interface PaginationProps {
  page: number;
  perPage: number;
  total: number;
  onPage: (page: number) => void;
  onPerPage: (perPage: number) => void;
  /** Word for one row, used in the count line. */
  noun?: string;
  perPageOptions?: number[];
}

/** Page numbers with ellipses, never more than seven buttons wide. */
function pageNumbers(page: number, pages: number): Array<number | "gap"> {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const out: Array<number | "gap"> = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);

  if (from > 2) out.push("gap");
  for (let i = from; i <= to; i += 1) out.push(i);
  if (to < pages - 1) out.push("gap");

  out.push(pages);
  return out;
}

export function Pagination({
  page,
  perPage,
  total,
  onPage,
  onPerPage,
  noun = "items",
  perPageOptions = [10, 25, 50],
}: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  const options = [
    ...perPageOptions.map((n) => ({ value: String(n), label: `${n} per page` })),
    { value: "all", label: "Show all" },
  ];

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
      <p className="font-mono text-[0.78rem] tabular-nums text-muted">
        Showing {first}–{last} of {total} {noun}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {pages > 1 ? (
          <nav aria-label="Pages" className="flex flex-wrap items-center gap-1.5">
            <Button variant="quiet" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}>
              ← Prev
            </Button>

            {pageNumbers(page, pages).map((entry, i) =>
              entry === "gap" ? (
                <span key={`gap-${i}`} className="px-1 font-mono text-[0.78rem] text-muted">
                  …
                </span>
              ) : (
                <Button
                  key={entry}
                  variant={entry === page ? "solid" : "quiet"}
                  size="sm"
                  aria-current={entry === page ? "page" : undefined}
                  onClick={() => onPage(entry)}
                  className="min-w-9 px-2 tabular-nums"
                >
                  {entry}
                </Button>
              )
            )}

            <Button
              variant="quiet"
              size="sm"
              disabled={page === pages}
              onClick={() => onPage(page + 1)}
            >
              Next →
            </Button>
          </nav>
        ) : null}

        <div className="w-[150px]">
          <SelectBox
            aria-label="Rows per page"
            options={options}
            value={perPage >= total && total > 0 && !perPageOptions.includes(perPage) ? "all" : String(perPage)}
            onChange={(e) => onPerPage(e.target.value === "all" ? Number.MAX_SAFE_INTEGER : Number(e.target.value))}
            wrapperClassName="mb-0"
          />
        </div>
      </div>
    </div>
  );
}
