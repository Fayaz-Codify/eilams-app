/** Display helpers — PKR everywhere, no decimals, the way the website shows money. */

export function money(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `Rs ${Math.round(value).toLocaleString('en-PK')}`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "12 Dec 2026" → short enough for a list row, unambiguous for a receipt. */
export function date(value: string): string {
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function shortDate(value: string): string {
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn}T12:00:00Z`).getTime();
  const b = new Date(`${checkOut}T12:00:00Z`).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

export function addDays(iso: string, days: number): string {
  const parsed = new Date(`${iso}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function initials(name: string | null | undefined): string {
  if (!name) return 'E';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

export const BOOKING_STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'muted' }> = {
  pending: { label: 'Awaiting payment', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  checked_in: { label: 'Checked in', tone: 'success' },
  completed: { label: 'Completed', tone: 'muted' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  no_show: { label: 'No show', tone: 'muted' },
};

export const PAYMENT_STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'muted' }> = {
  unpaid: { label: 'Unpaid', tone: 'warning' },
  partial: { label: 'Part paid', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  refunded: { label: 'Refunded', tone: 'muted' },
};

export function providerLabel(provider: string): string {
  return (
    {
      jazzcash: 'JazzCash',
      easypaisa: 'EasyPaisa',
      sandbox: 'Test wallet',
      at_hotel: 'Pay at hotel',
      online: 'Online payment',
    }[provider] ?? provider
  );
}
