/** Presentation-only formatting helpers. */

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Unknown currency code → plain fallback.
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => Number(n));
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt);
}
