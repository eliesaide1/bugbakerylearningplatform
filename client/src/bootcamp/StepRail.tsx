import { Badge } from "@shared/ui";
import { LockGlyph, CheckGlyph } from "@shared/ui";
import type { PublicStep, Submission } from "@shared/types";
import { KIND_GLYPH, KIND_LABEL, minutes } from "./kinds";

interface StepRailProps {
  steps: PublicStep[];
  activeId: string;
  unlocked: string[];
  completed: string[];
  submissions: Record<string, Submission>;
  onSelect: (id: string) => void;
}

/**
 * The road so far, grouped by week — twelve of them, so the rail has to read as
 * a schedule rather than a list of twenty-three things. Locked steps stay
 * visible: seeing the shape of what is coming is most of what keeps someone
 * going.
 */
export function StepRail({
  steps,
  activeId,
  unlocked,
  completed,
  submissions,
  onSelect,
}: StepRailProps) {
  const open = new Set(unlocked);
  const done = new Set(completed);

  // Steps arrive in schedule order, so a change of week starts a new group.
  const numbering = new Map(steps.map((step, index) => [step.id, index]));
  const weeks: Array<{ week: number; steps: PublicStep[] }> = [];
  for (const step of steps) {
    const week = step.week ?? 1;
    const current = weeks[weeks.length - 1];
    if (current?.week === week) current.steps.push(step);
    else weeks.push({ week, steps: [step] });
  }

  return (
    <nav aria-label="Steps">
      {weeks.map((group) => {
        const groupDone = group.steps.every((s) => done.has(s.id));
        const groupOpen = group.steps.some((s) => open.has(s.id));

        return (
          <div key={group.week}>
            <div
              className={`flex items-center justify-between gap-2 border-b border-line px-3 py-2 ${
                groupOpen ? "bg-paper" : ""
              }`}
            >
              <span
                className={`font-mono text-[0.7rem] tracking-wide uppercase ${
                  groupDone
                    ? "text-secondary-deep"
                    : groupOpen
                      ? "text-primary"
                      : "text-muted"
                }`}
              >
                Week {group.week}
              </span>
              <span className="font-mono text-[0.68rem] tabular-nums text-muted">
                {group.steps.filter((s) => done.has(s.id)).length}/
                {group.steps.length}
              </span>
            </div>
            <div className="divide-y divide-line">
              {group.steps.map(renderStep)}
            </div>
          </div>
        );
      })}
    </nav>
  );

  function renderStep(step: PublicStep) {
    const index = numbering.get(step.id) ?? 0;
    const isDone = done.has(step.id);
    const isLocked = !open.has(step.id);
    const isActive = step.id === activeId;
    const waiting = submissions[step.id]?.status === "pending";

    return (
      <button
        key={step.id}
        type="button"
        disabled={isLocked}
        onClick={() => onSelect(step.id)}
        aria-current={isActive ? "step" : undefined}
        className={`group grid w-full grid-cols-[1.9rem_1fr] items-start gap-x-3 border-l-2 px-3 py-3 text-left transition-colors ${
          isActive
            ? "border-l-primary bg-primary-soft"
            : isLocked
              ? "border-l-transparent cursor-not-allowed"
              : "border-l-transparent cursor-pointer hover:border-l-line-strong hover:bg-paper"
        }`}
      >
        <span
          className={`mt-0.5 grid size-7 place-items-center rounded-full border font-mono text-[0.72rem] ${
            isDone
              ? "border-secondary bg-secondary text-ink"
              : isActive
                ? "border-primary bg-primary text-white"
                : isLocked
                  ? "border-line-strong text-muted"
                  : "border-line-strong text-ink-2"
          }`}
        >
          {isDone ? (
            <CheckGlyph className="size-3.5" />
          ) : isLocked ? (
            <LockGlyph className="size-3" />
          ) : (
            KIND_GLYPH[step.kind]
          )}
        </span>

        <span className="min-w-0">
          <span className="flex items-baseline gap-2">
            <span className="font-mono text-[0.68rem] tabular-nums text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-mono text-[0.68rem] tracking-wide text-muted uppercase">
              {KIND_LABEL[step.kind]}
            </span>
          </span>
          <span
            className={`mt-0.5 block text-[0.93rem] leading-snug font-semibold ${
              isLocked ? "text-muted" : isActive ? "text-primary" : "text-ink"
            }`}
          >
            {step.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            {step.estimateMinutes ? (
              <span className="font-mono text-[0.72rem] tabular-nums text-muted">
                {minutes(step.estimateMinutes)}
              </span>
            ) : null}
            {waiting ? <Badge>in review</Badge> : null}
            {step.milestone ? <Badge tone="primary">milestone</Badge> : null}
          </span>
        </span>
      </button>
    );
  }
}
