// Server-side twin of src/lib/birthDate.js. Kept as its own file rather than
// imported from src/ so the serverless functions never pull in frontend code.
//
// Guards the one string that can turn a successful payment into a customer who
// got nothing: profiles.birth_date is a Postgres date, and an out-of-range
// value (22008) aborts the whole provisioning transaction. Happened for real
// on 2026-08-07 with "1963-15-06".

export function isStorableIsoDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!m) return false;
  const year = +m[1], month = +m[2], day = +m[3];
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1) return false;
  // Day 0 of the following month is the last day of this one — handles leap years.
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// profiles.birth_time is a strict `time` column — "99:99" kills the upsert
// exactly like the impossible date did. The form's mask enforces this, but the
// API is callable without the form, and the incident proved that "the client
// validates it" is not a thing the database gets to rely on.
export function isStorableTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));
}
