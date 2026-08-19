import { createHash } from 'crypto';

/**
 * Deterministic key used to detect the "same" address for a user so that
 * auto-saving at checkout is idempotent. Must stay byte-for-byte compatible with
 * the SQL backfill in migration 1738700000000-AddAddressBookFieldsToAddresses.
 *
 * Normalization: trim → lowercase → collapse internal whitespace. Phone keeps
 * digits only (so `0901234567` and `+84901234567` intentionally differ — we do
 * not normalize country codes).
 */
export function buildAddressDedupeKey(input: {
  recipientName: string;
  recipientPhone: string;
  provinceId: string;
  wardId: string;
  addressLine: string;
}): string {
  const norm = (s: string) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const phone = (input.recipientPhone ?? '').replace(/\D/g, '');
  const raw = [
    norm(input.recipientName),
    phone,
    input.provinceId ?? '',
    input.wardId ?? '',
    norm(input.addressLine),
  ].join('|');
  return createHash('md5').update(raw, 'utf8').digest('hex');
}
