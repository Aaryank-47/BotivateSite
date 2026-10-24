/**
 * Working-day helpers for Botivate.
 * - Every Sunday is always a non-working day.
 * - Dates listed in the holidays table (and recurring yearly matches) are off.
 * - Expected close dates are extended so holidays/Sundays in the window
 *   do not unfairly hurt on-time metrics (which compare completed_at vs expected_date_to_close).
 */

/** @param {Date|string|number} value */
export function toDateOnly(value) {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** @param {Date} d */
export function formatDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** @param {Date} d */
export function formatMonthDay(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}-${day}`;
}

/** @param {Date} d @param {number} n */
export function addDays(d, n) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/** @param {Date} d */
export function isSunday(d) {
  return d.getDay() === 0;
}

/**
 * Build lookup sets from holiday rows.
 * @param {Array<{ holiday_date: string, is_recurring?: boolean }>} holidayRows
 */
export function buildHolidayLookups(holidayRows = []) {
  const exact = new Set();
  const recurring = new Set();
  for (const row of holidayRows || []) {
    if (!row?.holiday_date) continue;
    const d = toDateOnly(row.holiday_date);
    if (!d) continue;
    exact.add(formatDateKey(d));
    if (row.is_recurring) {
      recurring.add(formatMonthDay(d));
    }
  }
  return { exact, recurring };
}

/**
 * @param {Date} d
 * @param {{ exact: Set<string>, recurring: Set<string> }} lookups
 */
export function isHolidayDate(d, lookups) {
  if (!d || !lookups) return false;
  if (lookups.exact.has(formatDateKey(d))) return true;
  if (lookups.recurring.has(formatMonthDay(d))) return true;
  return false;
}

/**
 * Sunday OR listed holiday.
 * @param {Date} d
 * @param {{ exact: Set<string>, recurring: Set<string> }} lookups
 */
export function isNonWorkingDay(d, lookups) {
  if (!d) return false;
  return isSunday(d) || isHolidayDate(d, lookups);
}

/**
 * Count non-working days in (startExclusive, endInclusive].
 */
export function countNonWorkingDays(startExclusive, endInclusive, lookups) {
  const start = toDateOnly(startExclusive);
  const end = toDateOnly(endInclusive);
  if (!start || !end || end <= start) return 0;
  let count = 0;
  let d = addDays(start, 1);
  while (d <= end) {
    if (isNonWorkingDay(d, lookups)) count++;
    d = addDays(d, 1);
  }
  return count;
}

/**
 * Extend expected close date so Sundays + holidays between given_date and
 * the original expected date are compensated. Final date always lands on a
 * working day.
 *
 * @param {Date|string} givenDate
 * @param {Date|string} expectedDate
 * @param {Array} holidayRows  raw rows from public.holidays
 * @returns {Date} extended date (date-only local)
 */
export function extendExpectedDate(givenDate, expectedDate, holidayRows = []) {
  const start = toDateOnly(givenDate);
  const originalEnd = toDateOnly(expectedDate);
  if (!start || !originalEnd) return originalEnd || start;

  const lookups = buildHolidayLookups(holidayRows);
  let end = originalEnd;

  // Iterate until stable: non-working days in the window push the deadline out,
  // and the new window may introduce more non-working days.
  for (let i = 0; i < 400; i++) {
    const nonWorking = countNonWorkingDays(start, end, lookups);
    let candidate = addDays(originalEnd, nonWorking);
    while (isNonWorkingDay(candidate, lookups)) {
      candidate = addDays(candidate, 1);
    }
    if (candidate.getTime() === end.getTime()) break;
    end = candidate;
  }

  return end;
}

/**
 * Same as extendExpectedDate but returns ISO string (UTC noon to avoid TZ flip).
 */
export function extendExpectedDateISO(givenDate, expectedDate, holidayRows = []) {
  const extended = extendExpectedDate(givenDate, expectedDate, holidayRows);
  if (!extended) return null;
  // Store as local calendar date at UTC noon so date-only semantics stay stable
  const iso = new Date(
    Date.UTC(extended.getFullYear(), extended.getMonth(), extended.getDate(), 12, 0, 0)
  );
  return iso.toISOString();
}

/**
 * Whether a holiday date falls strictly after start and on/before end.
 */
export function holidayAffectsWindow(holidayDate, startDate, endDate, isRecurring = false) {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  const h = toDateOnly(holidayDate);
  if (!start || !end || !h) return false;

  if (isRecurring) {
    // Match any year in the window with same month/day
    const md = formatMonthDay(h);
    let d = addDays(start, 1);
    while (d <= end) {
      if (formatMonthDay(d) === md) return true;
      d = addDays(d, 1);
    }
    return false;
  }

  return h > start && h <= end;
}
