// dd.mm.yyyy → ISO, shared by the anonymous order form and the signed-in setup
// page. Both used to trust their two-digit mask and hand the slots straight to
// the ISO string, so a US-style "06.15.1963" turned into "1963-15-06". Postgres
// rejects that date, and on 2026-08-07 it killed a paid guest checkout: the
// charge went through, provisioning threw, the customer got nothing. Impossible
// dates now never leave the input.

const DISPLAY_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

export function isRealDate(year, month, day) {
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1) return false;
  // Day 0 of the following month is the last day of this one — handles leap years.
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// ISO date, or '' when the input is still half-typed or names a day that
// doesn't exist. Callers treat '' as "no usable date yet".
export function isoFromDisplayDate(display) {
  const m = DISPLAY_RE.exec(String(display || ''));
  if (!m) return '';
  return isRealDate(+m[3], +m[2], +m[1]) ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

// True only once all eight digits are in and they name a day that doesn't
// exist — the case that earns an inline hint instead of silence.
export function isImpossibleDisplayDate(display) {
  const m = DISPLAY_RE.exec(String(display || ''));
  return !!m && !isRealDate(+m[3], +m[2], +m[1]);
}
