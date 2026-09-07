import { addMinutes, minutesOf } from "@/utils/cleaners/access";

export const TYPE_MINUTES = Object.freeze({
  checkout: 150,
  regular: 120,
  deep: 240,
  emergency: 90,
  custom: 150,
});

export const SIMPLE_TYPES = Object.freeze([
  "checkout",
  "regular",
  "deep",
  "emergency",
]);

function padHm(total) {
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(wrapped % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function nowHm(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function roundUpMinutes(hhmm, step = 15) {
  const total = minutesOf(hhmm);
  const rounded = Math.ceil(total / step) * step;
  return padHm(rounded);
}

export function durationForType(type, settingsMinutes) {
  if (type === "checkout" && Number(settingsMinutes) > 0) {
    return Number(settingsMinutes);
  }
  return TYPE_MINUTES[type] || TYPE_MINUTES.regular;
}

/**
 * Derive a cleaning window from the property clock and the stay.
 * Hosts do not pick the clock — the stay and type do.
 */
export function planCleaningWindow({
  type = "checkout",
  checkOutTime = "11:00",
  checkInTime = "15:00",
  booking = null,
  nextBooking = null,
  todayYmd,
  nowClock,
  settingsMinutes,
}) {
  const kind = SIMPLE_TYPES.includes(type) ? type : "checkout";
  const duration = durationForType(kind, settingsMinutes);
  const now = nowClock || nowHm();
  const today = todayYmd;

  let scheduledDate;
  let scheduledStartTime;

  if (kind === "emergency") {
    if (booking && today < booking.checkOut) {
      scheduledDate = booking.checkOut;
      scheduledStartTime = checkOutTime;
    } else if (booking && today === booking.checkOut) {
      scheduledDate = today;
      scheduledStartTime =
        minutesOf(now) > minutesOf(checkOutTime)
          ? roundUpMinutes(addMinutes(now, 15))
          : checkOutTime;
    } else {
      scheduledDate = today;
      scheduledStartTime = roundUpMinutes(addMinutes(now, 15));
    }
  } else if (booking?.checkOut) {
    scheduledDate = booking.checkOut;
    scheduledStartTime = checkOutTime;
  } else {
    scheduledDate =
      minutesOf(now) >= minutesOf(checkOutTime)
        ? /* next civil day is decided by caller via addDaysYmd */ today
        : today;
    scheduledStartTime = checkOutTime;
  }

  let scheduledEndTime = addMinutes(scheduledStartTime, duration);

  const nextSameDay =
    nextBooking?.checkIn && nextBooking.checkIn === scheduledDate;
  if (nextSameDay && checkInTime) {
    const nextStart = minutesOf(checkInTime);
    const start = minutesOf(scheduledStartTime);
    if (nextStart > start) {
      const capped = Math.min(minutesOf(scheduledEndTime), nextStart);
      scheduledEndTime = padHm(capped);
    }
  }

  const actualMinutes = Math.max(
    30,
    minutesOf(scheduledEndTime) - minutesOf(scheduledStartTime) || duration,
  );

  return {
    scheduledDate,
    scheduledStartTime,
    scheduledEndTime,
    estimatedDuration: actualMinutes,
    cleaningType: kind,
    tightTurnaround: Boolean(
      nextSameDay && actualMinutes < durationForType(kind, settingsMinutes),
    ),
  };
}
