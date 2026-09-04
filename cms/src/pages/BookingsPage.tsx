import { useState } from "react";
import { Badge, Button, EmptyState, SelectBox } from "@shared/ui";
import { PageHeader } from "../components/Shell";
import { ConfirmButton } from "../components/ConfirmButton";
import { useBookings, useDeleteBooking, useUpdateBooking } from "../api/queries";
import { useRealtime } from "../realtime/RealtimeProvider";
import type { Booking, BookingStatus } from "@shared/types";

const STATUSES: Array<{ value: BookingStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

const TONE: Record<BookingStatus, "secondary" | "success" | "neutral"> = {
  pending: "secondary",
  confirmed: "success",
  cancelled: "neutral",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function BookingsPage() {
  const [status, setStatus] = useState("");
  const { data: bookings = [], isLoading } = useBookings(status ? { status } : undefined);
  const { connected } = useRealtime();

  const upcoming = bookings.filter((b) => new Date(b.start) >= new Date() && b.status !== "cancelled");

  return (
    <>
      <PageHeader
        title="1:1 sessions"
        description="Hours students have booked. New ones arrive here live."
        badge={connected ? `${upcoming.length} upcoming · live` : `${upcoming.length} upcoming`}
      />

      <div className="mb-6 max-w-[240px]">
        <SelectBox
          label="Filter"
          options={[{ value: "", label: "All sessions" }, ...STATUSES]}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : !bookings.length ? (
        <EmptyState
          title="Nothing booked yet"
          message="Open hours under 1:1 availability, and bookings appear here the moment someone takes one."
        />
      ) : (
        <div className="grid gap-3">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const update = useUpdateBooking();
  const remove = useDeleteBooking();
  const past = new Date(booking.start) < new Date();

  return (
    <article
      className={`border bg-panel p-5 ${
        booking.status === "cancelled" || past ? "border-line opacity-70" : "border-line-strong"
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-[1.1rem] font-extrabold tabular-nums">
            {when(booking.start)}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.9rem] text-muted">
            <Badge tone={TONE[booking.status]}>{booking.status}</Badge>
            {past ? <Badge>past</Badge> : null}
            <span>{booking.name}</span>
            {booking.program ? <span>· {booking.program}</span> : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`mailto:${booking.email}?subject=${encodeURIComponent("Your 1:1 session")}`}
            className="inline-flex items-center rounded-card border-[1.5px] border-primary bg-primary px-3.5 py-2 text-[0.9rem] font-semibold text-white no-underline hover:bg-primary-deep"
          >
            Email
          </a>
          {booking.status !== "confirmed" ? (
            <Button size="sm" onClick={() => update.mutate({ id: booking.id, status: "confirmed" })}>
              Confirm
            </Button>
          ) : null}
          {booking.status !== "cancelled" ? (
            <Button
              variant="quiet"
              size="sm"
              onClick={() => update.mutate({ id: booking.id, status: "cancelled" })}
            >
              Cancel
            </Button>
          ) : null}
          <ConfirmButton label="Delete" onConfirm={() => remove.mutate(booking.id)} />
        </div>
      </header>

      <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        <Row label="Email" value={booking.email} />
        <Row label="Phone" value={booking.phone} />
      </dl>

      {booking.note ? (
        <p className="mt-3 border-l-4 border-line-strong pl-4 text-ink-2">{booking.note}</p>
      ) : null}
    </article>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-[0.92rem]">
      <dt className="text-muted">{label}:</dt>
      <dd className="m-0 font-semibold">{value}</dd>
    </div>
  );
}
