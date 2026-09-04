import { useState } from "react";
import { Alert, Button, TextArea, TextBox } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { SaveBar } from "../components/SaveBar";
import { useDraft } from "../hooks/useDraft";
import { useAvailability, useSaveAvailability } from "../api/queries";
import type { Availability, AvailabilityRule } from "@shared/types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** A rough count so you can see what the hours actually produce. */
function slotsPerWeek(week: AvailabilityRule[], slotMinutes: number) {
  return week.reduce((total, rule) => {
    if (!rule.enabled) return total;
    const [sh, sm] = (rule.start || "0:00").split(":").map(Number);
    const [eh, em] = (rule.end || "0:00").split(":").map(Number);
    const minutes = eh * 60 + em - (sh * 60 + sm);
    return total + Math.max(0, Math.floor(minutes / slotMinutes));
  }, 0);
}

export default function AvailabilityPage() {
  const { data, isLoading } = useAvailability();
  const save = useSaveAvailability();
  const { draft, set, dirty, commit, reset } = useDraft<Availability>(data);
  const [blocked, setBlocked] = useState("");

  if (isLoading || !draft) return <p className="text-muted">Loading…</p>;

  const week = draft.week ?? [];
  const setRule = (day: number, patch: Partial<AvailabilityRule>) =>
    set({ week: week.map((r) => (r.day === day ? { ...r, ...patch } : r)) });

  const perWeek = slotsPerWeek(week, draft.slotMinutes || 60);

  return (
    <>
      <PageHeader
        title="1:1 availability"
        description="When students can book private hours. Written in your own timezone; the site shows each visitor the same slot in theirs."
        badge={`${perWeek} slots a week`}
      />

      <section className="mb-6 border border-line-strong bg-panel p-5">
        <h2 className="mb-4 text-step-1">The rules</h2>
        <div className="grid gap-x-4 md:grid-cols-2 lg:grid-cols-4 md:items-end">
          <TextBox
            label="Your timezone"
            hint="an IANA name, e.g. Asia/Beirut"
            value={draft.timezone ?? ""}
            onChange={(e) => set({ timezone: e.target.value })}
          />
          <TextBox
            label="Session length"
            hint="minutes"
            type="number"
            min={15}
            max={240}
            value={String(draft.slotMinutes ?? 60)}
            onChange={(e) => set({ slotMinutes: Number(e.target.value) })}
          />
          <TextBox
            label="Notice needed"
            hint="hours before a slot can be taken"
            type="number"
            min={0}
            max={336}
            value={String(draft.leadTimeHours ?? 12)}
            onChange={(e) => set({ leadTimeHours: Number(e.target.value) })}
          />
          <TextBox
            label="Book ahead"
            hint="how many days the calendar opens"
            type="number"
            min={1}
            max={120}
            value={String(draft.horizonDays ?? 28)}
            onChange={(e) => set({ horizonDays: Number(e.target.value) })}
          />
        </div>

        <div className="grid gap-x-4 md:grid-cols-2 md:items-end">
          <TextBox
            label="Rate"
            hint="shown on the booking page, currency included"
            value={draft.price ?? ""}
            onChange={(e) => set({ price: e.target.value })}
          />
          <TextBox
            label="Rate note"
            hint='e.g. "per hour"'
            value={draft.priceNote ?? ""}
            onChange={(e) => set({ priceNote: e.target.value })}
          />
        </div>

        <TextArea
          label="Note above the calendar"
          hint="(optional)"
          rows={2}
          value={draft.note ?? ""}
          onChange={(e) => set({ note: e.target.value })}
        />
      </section>

      <section className="mb-6 border border-line-strong bg-panel">
        <header className="border-b border-line px-5 py-3">
          <h2 className="text-step-1">Weekly hours</h2>
        </header>

        <ul className="m-0 list-none p-0">
          {week.map((rule) => (
            <li
              key={rule.day}
              className="grid grid-cols-[auto_9rem_1fr] items-center gap-x-4 border-b border-line px-5 py-2.5 last:border-b-0"
            >
              <input
                type="checkbox"
                aria-label={`Available on ${DAYS[rule.day]}`}
                checked={rule.enabled}
                onChange={(e) => setRule(rule.day, { enabled: e.target.checked })}
                className="size-4 accent-[var(--color-primary)]"
              />
              <span className={rule.enabled ? "font-semibold" : "text-muted"}>{DAYS[rule.day]}</span>

              {rule.enabled ? (
                <span className="flex items-center gap-2 font-mono text-[0.9rem]">
                  <input
                    type="time"
                    aria-label={`${DAYS[rule.day]} from`}
                    value={rule.start}
                    onChange={(e) => setRule(rule.day, { start: e.target.value })}
                    className="rounded-card border border-line-strong bg-panel px-2 py-1.5 outline-none focus:border-primary"
                  />
                  <span className="text-muted">to</span>
                  <input
                    type="time"
                    aria-label={`${DAYS[rule.day]} until`}
                    value={rule.end}
                    onChange={(e) => setRule(rule.day, { end: e.target.value })}
                    className="rounded-card border border-line-strong bg-panel px-2 py-1.5 outline-none focus:border-primary"
                  />
                </span>
              ) : (
                <span className="text-[0.9rem] text-muted">Closed</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6 border border-line-strong bg-panel p-5">
        <h2 className="mb-2 text-step-1">Days off</h2>
        <p className="mb-4 max-w-[64ch] text-[0.9rem] text-muted">
          Holidays and one-off closures. These override the weekly hours, so nothing can be booked
          on them.
        </p>

        <div className="flex flex-wrap gap-2">
          {(draft.blockedDates ?? []).map((date) => (
            <span
              key={date}
              className="inline-flex items-center gap-2 border border-line-strong px-2.5 py-1 font-mono text-[0.8rem] tabular-nums"
            >
              {date}
              <button
                type="button"
                aria-label={`Reopen ${date}`}
                onClick={() => set({ blockedDates: (draft.blockedDates ?? []).filter((d) => d !== date) })}
                className="cursor-pointer text-muted hover:text-danger"
              >
                ×
              </button>
            </span>
          ))}
          {!(draft.blockedDates ?? []).length ? (
            <span className="text-[0.9rem] text-muted">None yet.</span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <input
            type="date"
            aria-label="Date to close"
            value={blocked}
            onChange={(e) => setBlocked(e.target.value)}
            className="rounded-card border border-line-strong bg-panel px-3 py-2 font-mono text-[0.9rem] outline-none focus:border-primary"
          />
          <Button
            size="sm"
            disabled={!blocked || (draft.blockedDates ?? []).includes(blocked)}
            onClick={() => {
              set({ blockedDates: [...(draft.blockedDates ?? []), blocked].sort() });
              setBlocked("");
            }}
          >
            Close this day
          </Button>
        </div>
      </section>

      {!perWeek ? (
        <Alert tone="info" className="mb-6">
          No hours are open, so the booking calendar will tell visitors to get in touch instead.
        </Alert>
      ) : null}

      <SaveBar
        dirty={dirty}
        saving={save.isPending}
        error={save.error}
        saved={save.isSuccess}
        onSave={() => {
          const { id, ...payload } = draft;
          void id;
          save.mutate(payload, { onSuccess: (saved) => commit(saved) });
        }}
        onReset={reset}
        savedMessage="Saved — the booking calendar updated."
      />
    </>
  );
}
