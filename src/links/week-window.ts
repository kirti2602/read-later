export type WindowSchedule = {
  /** IANA name, e.g. "Asia/Kolkata". */
  timeZone: string;
  /** 0 = Sunday … 6 = Saturday. */
  digestDay: number;
  /** "HH:MM" or "HH:MM:SS" local time (Postgres `time` format). */
  digestTime: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
};

function localParts(instant: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)!.value;
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: WEEKDAYS.indexOf(get("weekday")),
  };
}

function offsetMs(instant: Date, timeZone: string): number {
  const p = localParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Converts a wall-clock time in `timeZone` to the UTC instant, re-checking the offset for DST. */
function zonedToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const firstGuess = wallAsUtc - offsetMs(new Date(wallAsUtc), timeZone);
  return new Date(wallAsUtc - offsetMs(new Date(firstGuess), timeZone));
}

/**
 * Start of the reading week containing `now`: the latest digest boundary
 * (e.g. Saturday 09:00 local) at or before `now`.
 */
export function windowStart(now: Date, schedule: WindowSchedule): Date {
  const [digestHour, digestMinute] = schedule.digestTime.split(":").map(Number);
  const local = localParts(now, schedule.timeZone);

  let daysBack = (local.weekday - schedule.digestDay + 7) % 7;
  const secondsNow = local.hour * 3600 + local.minute * 60 + local.second;
  const secondsAtDigest = digestHour * 3600 + digestMinute * 60;
  if (daysBack === 0 && secondsNow < secondsAtDigest) daysBack = 7;

  const startDate = new Date(Date.UTC(local.year, local.month - 1, local.day - daysBack));
  return zonedToUtc(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth() + 1,
    startDate.getUTCDate(),
    digestHour,
    digestMinute,
    schedule.timeZone,
  );
}
