/**
 * Canonical VN phone form used to key guest accounts: digits only, "0" leading
 * prefix rewritten to "84" so "0909090909" and "+84909090909" resolve to the
 * same user. Kept as the single source of truth — reused by guest checkout,
 * register and account-claim lookups so they never diverge.
 */
export function normalizeVnPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('84')) return digits;
  if (digits.startsWith('0')) return `84${digits.slice(1)}`;
  return digits;
}
