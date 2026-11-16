// Service end dates are calendar dates. Preserve the saved date rather than
// shifting it into the viewer's timezone.
export function formatServiceExpiry(value?: string | null): string {
  if (!value) return 'Not set';
  const dateOnly = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return 'Not set';
  const date = new Date(`${dateOnly}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateOnly) return 'Not set';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
