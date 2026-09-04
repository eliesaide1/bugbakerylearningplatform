/**
 * Slot arithmetic for 1:1 bookings.
 *
 * Availability is written the way a person thinks about it — "Tuesdays, 18:00
 * to 21:00, my time" — but a booking has to be a real instant, because the
 * student may be in another country. These helpers convert between the two
 * using Intl, so there is no timezone dependency to keep updated.
 */

/** Offset of `tz` from UTC, in minutes, at the given instant. */
function offsetMinutes(date, tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = Number(part.value);
      return acc;
    }, {});

  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour % 24,
    parts.minute,
    parts.second
  );
  return (asUtc - date.getTime()) / 60000;
}

/** A wall-clock time in `tz` -> the UTC instant it refers to. */
export function zonedToUtc(year, month, day, hour, minute, tz) {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const first = offsetMinutes(new Date(naive), tz);
  const candidate = new Date(naive - first * 60000);

  // Around a DST change the first guess can land on the wrong side; one
  // correction with the offset actually in force settles it.
  const second = offsetMinutes(candidate, tz);
  return second === first ? candidate : new Date(naive - second * 60000);
}

/** "YYYY-MM-DD" for an instant, as seen in `tz`. */
export function dayKey(date, tz) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts; // en-CA already formats as YYYY-MM-DD
}

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || "0:00").split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

/**
 * Every open slot in the window, as UTC instants.
 *
 * A slot is dropped when it is already booked, inside the lead time, on a
 * blocked date, or on a weekday with no hours set.
 */
export function openSlots(availability, bookings = [], { days } = {}) {
  const tz = availability.timezone || "UTC";
  const slotMinutes = availability.slotMinutes || 60;
  const horizon = days ?? availability.horizonDays ?? 28;
  const blocked = new Set(availability.blockedDates || []);

  const now = Date.now();
  const earliest = now + (availability.leadTimeHours ?? 12) * 3600000;

  const taken = new Set(
    bookings
      .filter((b) => b.status !== "cancelled")
      .map((b) => new Date(b.start).toISOString())
  );

  const byWeekday = new Map((availability.week || []).map((rule) => [rule.day, rule]));
  const slots = [];

  for (let i = 0; i < horizon; i += 1) {
    const key = dayKey(new Date(now + i * 86400000), tz);
    if (blocked.has(key)) continue;

    const [year, month, day] = key.split("-").map(Number);
    // Weekday of the local date, read in UTC to avoid a second conversion.
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

    const rule = byWeekday.get(weekday);
    if (!rule?.enabled) continue;

    const from = toMinutes(rule.start);
    const to = toMinutes(rule.end);

    for (let minute = from; minute + slotMinutes <= to; minute += slotMinutes) {
      const start = zonedToUtc(year, month, day, Math.floor(minute / 60), minute % 60, tz);
      if (start.getTime() < earliest) continue;
      if (taken.has(start.toISOString())) continue;

      slots.push({
        start: start.toISOString(),
        end: new Date(start.getTime() + slotMinutes * 60000).toISOString(),
        date: key,
      });
    }
  }

  return slots;
}
