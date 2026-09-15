import { Button, SelectBox, TextBox } from "@shared/ui";
import type { CheckKind, StepCheck } from "@shared/types";

const KINDS: Array<{ value: CheckKind; label: string }> = [
  { value: "contains", label: "must contain" },
  { value: "not-contains", label: "must not contain" },
  { value: "regex", label: "must match (regex)" },
];

const FIELDS = [
  { value: "any", label: "anywhere" },
  { value: "code", label: "in the code" },
  { value: "notes", label: "in their notes" },
  { value: "repoUrl", label: "in the repo url" },
  { value: "commitUrl", label: "in the commit url" },
];

/**
 * The first rung of the review ladder. Anything you can state as a rule belongs
 * here rather than in the rubric: these run instantly, cost nothing, and cannot
 * be talked out of a verdict. Every check you write is work that never reaches
 * your queue.
 */
export function ChecksEditor({
  checks,
  onChange,
}: {
  checks: StepCheck[];
  onChange: (checks: StepCheck[]) => void;
}) {
  const update = (index: number, patch: Partial<StepCheck>) =>
    onChange(checks.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  return (
    <div className="mb-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-[1.05rem] font-extrabold">Automatic checks</h3>
          <p className="text-[0.85rem] text-muted">
            Run before the reviewer. A failing check sends the trainee straight back with the reason.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => onChange([...checks, { kind: "contains", value: "", field: "any" }])}
        >
          Add check
        </Button>
      </div>

      {!checks.length ? (
        <p className="border border-dashed border-line-strong px-4 py-4 text-center text-[0.9rem] text-muted">
          No checks yet. Every rule you add here is a submission that never reaches your queue.
        </p>
      ) : null}

      {checks.map((check, index) => (
        <div key={check._id ?? index} className="mb-2 border border-line-strong bg-panel px-4 pt-4">
          <div className="grid gap-x-3 md:grid-cols-[13rem_1fr_11rem]">
            <SelectBox
              label="Rule"
              options={KINDS}
              value={check.kind}
              onChange={(e) => update(index, { kind: e.target.value as CheckKind })}
            />
            <TextBox
              label={check.kind === "regex" ? "Pattern" : "Text"}
              value={check.value}
              onChange={(e) => update(index, { value: e.target.value })}
            />
            <SelectBox
              label="Look"
              options={FIELDS}
              value={check.field ?? "any"}
              onChange={(e) => update(index, { field: e.target.value as StepCheck["field"] })}
            />
          </div>

          <TextBox
            label="What the trainee is told when this fails"
            placeholder="Your code should await the query."
            value={check.message ?? ""}
            onChange={(e) => update(index, { message: e.target.value })}
          />

          <div className="mb-4 flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={Boolean(check.caseSensitive)}
                onChange={(e) => update(index, { caseSensitive: e.target.checked })}
                className="size-4 accent-[var(--color-primary)]"
              />
              <span className="text-[0.9rem]">Case sensitive</span>
            </label>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => onChange(checks.filter((_, i) => i !== index))}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
