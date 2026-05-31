/**
 * Postgres DATE columns can come back from the driver as a plain "2026-05-31",
 * a full ISO timestamp ("2026-05-31T00:00:00.000Z"), or a Date object. Normalize
 * to a local-midnight Date so `new Date(value + 'T00:00:00')` never produces
 * "Invalid Date".
 */
export function parseDeliveryDate(value: unknown): Date | null {
  if (!value) return null;
  const iso =
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  const d = new Date(iso + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
}
