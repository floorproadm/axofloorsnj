// AXO Floors tenant UUID — used for all insert operations
export const AXO_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Public-facing site URL. Always used when generating links that go OUT to
 * clients (emails, WhatsApp, copy-link), so they never see the lovable preview
 * or sandbox URL. Override per-environment via VITE_PUBLIC_SITE_URL if needed.
 */
export const PUBLIC_SITE_URL = (
  (import.meta as any).env?.VITE_PUBLIC_SITE_URL || 'https://axofloorsnj.com'
).replace(/\/$/, '');

// ─── Arrival Windows ───────────────────────────────────────
// Options offered in settings + per-appointment override (in minutes).
export const ARRIVAL_WINDOW_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
] as const;

/**
 * Format an appointment time as either a single time ("9:00 AM") or an
 * arrival window ("9:00 AM – 10:00 AM") depending on the resolved window.
 *
 * @param time      "HH:MM" or "HH:MM:SS"
 * @param windowMin Per-appointment override (nullable)
 * @param companyDefault Company default window (nullable)
 */
export function formatAppointmentTime(
  time: string | null | undefined,
  windowMin?: number | null,
  companyDefault?: number | null,
): string {
  if (!time) return '';
  const hhmm = time.slice(0, 5);
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;

  const fmt = (hh: number, mm: number) => {
    const period = hh >= 12 ? 'PM' : 'AM';
    const hr12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${hr12}:${String(mm).padStart(2, '0')} ${period}`;
  };

  const effective = windowMin ?? companyDefault ?? null;
  const start = fmt(h, m);
  if (!effective || effective <= 0) return start;

  const total = h * 60 + m + effective;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${start} – ${fmt(eh, em)}`;
}
