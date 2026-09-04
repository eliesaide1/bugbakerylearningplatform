import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Alert, Button, CheckGlyph, SelectBox, TextArea, TextBox } from "@shared/ui";
import { ApiError } from "../api/client";
import { useCreateBooking, useSlots } from "../api/queries";
import type { Program, Slot } from "@shared/types";

/** "YYYY-MM-DD" for an instant, in the visitor's own timezone. */
const localKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const monthKey = (key: string) => key.slice(0, 7);
const todayKey = () => localKey(new Date().toISOString());

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const dayLabel = (key: string, opts: Intl.DateTimeFormatOptions = {}) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...opts,
  });
};

/** Weeks of a month, Monday first, padded so the grid stays rectangular. */
function monthGrid(month: string): Array<string | null> {
  const [y, m] = month.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  // getDay is Sunday-first; shift so Monday starts the row.
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;

  const cells: Array<string | null> = Array(lead).fill(null);
  for (let d = 1; d <= days; d += 1) {
    cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** A numbered panel, so the three things you must do read as a sequence. */
function Step({
  n,
  title,
  hint,
  children,
  muted = false,
}: {
  n: number;
  title: string;
  hint?: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <section
      className={`rounded-panel border bg-panel transition-colors ${
        muted ? "border-line" : "border-line-strong"
      }`}
    >
      <header className="flex items-baseline gap-3 border-b border-line px-4 py-3">
        <span
          className={`grid size-6 flex-none place-items-center rounded-full font-mono text-[0.72rem] ${
            muted ? "bg-paper text-muted" : "bg-primary text-white"
          }`}
        >
          {n}
        </span>
        <h2 className="font-display text-[1rem] font-extrabold">{title}</h2>
        {hint ? <span className="ml-auto text-[0.8rem] text-muted">{hint}</span> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/* ------------------------- add to calendar ------------------------- */

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, "");

function googleUrl(start: string, end: string, title: string) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: "Booked through the Bug Bakery site.",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function downloadIcs(start: string, end: string, title: string) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bug Bakery//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${stamp(start)}@bugbakery`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${title}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "bug-bakery-session.ics";
  link.click();
  URL.revokeObjectURL(url);
}

/* ----------------------------- calendar ----------------------------- */

export function BookingCalendar({ programs = [] }: { programs?: Program[] }) {
  const { data, isLoading, isError, error, refetch } = useSlots();
  const book = useCreateBooking();

  const byDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of data?.slots ?? []) {
      const key = localKey(slot.start);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return map;
  }, [data]);

  const openDays = useMemo(() => [...byDay.keys()].sort(), [byDay]);
  const months = useMemo(() => [...new Set(openDays.map(monthKey))].sort(), [openDays]);

  const [month, setMonth] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [booked, setBooked] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", program: "", note: "" });

  // Land on the first day that actually has something free.
  useEffect(() => {
    if (!openDays.length) return;
    setMonth((current) => current ?? monthKey(openDays[0]));
    setDay((current) => (current && byDay.has(current) ? current : openDays[0]));
  }, [openDays, byDay]);

  if (isLoading) {
    return (
      <div className="rounded-panel border border-line-strong bg-panel p-6 text-muted">
        Loading times…
      </div>
    );
  }

  if (isError) {
    return (
      <Alert tone="danger">
        {(error as Error).message}{" "}
        <button type="button" onClick={() => refetch()} className="font-semibold underline">
          Try again
        </button>
      </Alert>
    );
  }

  /* ------------------------ booked confirmation ------------------------ */

  if (book.isSuccess && booked) {
    const title = "1:1 session with Bug Bakery";
    return (
      <div className="rounded-panel border border-primary bg-panel p-6 md:p-8">
        <span className="grid size-11 place-items-center rounded-full bg-primary text-white">
          <CheckGlyph className="size-5" />
        </span>

        <h2 className="mt-4 font-display text-[1.4rem] font-extrabold">You are booked in</h2>
        <p className="mt-2 text-step-1 leading-[1.4] text-ink-2">
          {dayLabel(localKey(booked.start))} at <b className="text-ink">{timeLabel(booked.start)}</b>,
          for {data?.slotMinutes} minutes.
        </p>
        <p className="mt-3 max-w-[52ch] text-[0.95rem] text-muted">
          Keep the time free and bring the thing you are stuck on. If you need to move it, reply to
          the email you used to book.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => downloadIcs(booked.start, booked.end, title)}
          >
            Add to calendar
          </Button>
          <a
            href={googleUrl(booked.start, booked.end, title)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-card border-[1.5px] border-line-strong px-[22px] py-[13px] font-semibold text-ink-2 no-underline hover:border-ink-2"
          >
            Google Calendar ↗
          </a>
          <Button
            variant="quiet"
            onClick={() => {
              book.reset();
              setBooked(null);
            }}
          >
            Book another
          </Button>
        </div>
      </div>
    );
  }

  if (!openDays.length) {
    return (
      <Alert tone="info">
        There are no open times right now. Send an enrolment request and I will find a slot for you.
      </Alert>
    );
  }

  const fieldErrors = book.error instanceof ApiError ? book.error.fields : null;
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const monthIndex = month ? months.indexOf(month) : 0;
  const cells = month ? monthGrid(month) : [];
  const today = todayKey();
  const daySlots = byDay.get(day ?? "") ?? [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!slot) return;
    const chosen = slot;
    book.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        program: form.program || undefined,
        note: form.note.trim() || undefined,
        start: chosen.start,
      },
      {
        onSuccess: () => {
          setBooked(chosen);
          setForm({ name: "", email: "", phone: "", program: "", note: "" });
          setSlot(null);
        },
      }
    );
  };

  return (
    <div className="grid gap-4">
      {data?.note ? <Alert tone="info">{data.note}</Alert> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* --------------------------- pick a day --------------------------- */}
        <Step n={1} title="Pick a day" hint={`${openDays.length} days open`}>
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="quiet"
              size="sm"
              aria-label="Previous month"
              disabled={monthIndex <= 0}
              onClick={() => setMonth(months[monthIndex - 1])}
              className="px-2"
            >
              ‹
            </Button>
            <p className="font-display text-[0.98rem] font-extrabold">
              {month
                ? new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })
                : ""}
            </p>
            <Button
              variant="quiet"
              size="sm"
              aria-label="Next month"
              disabled={monthIndex >= months.length - 1}
              onClick={() => setMonth(months[monthIndex + 1])}
              className="px-2"
            >
              ›
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center font-mono text-[0.66rem] text-muted">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          <div className="mt-1.5 grid grid-cols-7 gap-1">
            {cells.map((key, i) => {
              if (!key) return <span key={i} />;
              const count = byDay.get(key)?.length ?? 0;
              const selected = key === day;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!count}
                  onClick={() => {
                    setDay(key);
                    setSlot(null);
                  }}
                  aria-pressed={selected}
                  aria-label={`${dayLabel(key)} — ${count} times`}
                  className={`relative grid aspect-square place-items-center rounded-card text-[0.85rem] tabular-nums transition-colors ${
                    selected
                      ? "bg-primary font-semibold text-white"
                      : count
                        ? "cursor-pointer bg-primary-soft text-primary hover:bg-primary hover:text-white"
                        : "text-line-strong"
                  } ${key === today && !selected ? "ring-1 ring-secondary ring-inset" : ""}`}
                >
                  {Number(key.slice(-2))}
                </button>
              );
            })}
          </div>

          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-[0.76rem] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] bg-primary-soft" /> open
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] ring-1 ring-secondary ring-inset" /> today
            </span>
          </p>
        </Step>

        {/* --------------------------- pick a time --------------------------- */}
        <Step
          n={2}
          title="Pick a time"
          hint={day ? dayLabel(day, { weekday: "short", month: "short" }) : undefined}
          muted={!day}
        >
          {daySlots.length ? (
            <div className="flex flex-wrap gap-2">
              {daySlots.map((s) => {
                const active = slot?.start === s.start;
                return (
                  <button
                    key={s.start}
                    type="button"
                    onClick={() => setSlot(s)}
                    aria-pressed={active}
                    className={`cursor-pointer rounded-card border px-3.5 py-2 font-mono text-[0.85rem] tabular-nums transition-colors ${
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-line-strong text-ink-2 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {timeLabel(s.start)}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[0.92rem] text-muted">Choose a day on the left.</p>
          )}

          <p className="mt-4 border-t border-line pt-3 text-[0.76rem] text-muted">
            Shown in your own timezone
            {data?.timezone ? ` — sessions run from ${data.timezone.replace("_", " ")}` : ""}.
          </p>
        </Step>
      </div>

      {/* ---------------------------- your details ---------------------------- */}
      <Step
        n={3}
        title="Your details"
        muted={!slot}
        hint={
          slot
            ? `${dayLabel(localKey(slot.start), { weekday: "short", month: "short" })} · ${timeLabel(slot.start)}`
            : undefined
        }
      >
        {!slot ? (
          <p className="text-[0.92rem] text-muted">Pick a time and I will hold it for you.</p>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="grid gap-x-4 md:grid-cols-2 md:items-end">
              <TextBox
                label="Your name"
                required
                value={form.name}
                onChange={set("name")}
                error={fieldErrors?.name?.[0]}
              />
              <TextBox
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                error={fieldErrors?.email?.[0]}
              />
              <TextBox
                label="Phone or WhatsApp"
                hint="(optional)"
                value={form.phone}
                onChange={set("phone")}
              />
              <SelectBox
                label="Program"
                placeholder="Not sure yet"
                options={programs.map((p) => p.title)}
                value={form.program}
                onChange={set("program")}
              />
            </div>

            <TextArea
              label="What do you want to cover?"
              rows={3}
              placeholder="A bug you are stuck on, a code review, interview prep…"
              value={form.note}
              onChange={set("note")}
            />

            {book.isError && !fieldErrors ? (
              <Alert tone="danger" className="mb-4">
                {(book.error as Error).message}
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={book.isPending}>
                {book.isPending ? "Booking…" : `Book this time${data?.price ? ` · ${data.price}` : ""}`}
              </Button>
              <Button variant="quiet" onClick={() => setSlot(null)}>
                Change time
              </Button>
            </div>
          </form>
        )}
      </Step>
    </div>
  );
}
