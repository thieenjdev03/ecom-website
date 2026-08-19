import { buildAddressDedupeKey } from './address-dedupe.util';

describe('buildAddressDedupeKey', () => {
  const base = {
    recipientName: 'Nguyễn Văn A',
    recipientPhone: '0901234567',
    provinceId: '79',
    wardId: '26743',
    addressLine: '123 Nguyễn Thị Thập',
  };

  it('ignores extra whitespace and letter case', () => {
    const a = buildAddressDedupeKey(base);
    const b = buildAddressDedupeKey({
      ...base,
      recipientName: '  nguyễn   văn a ',
      addressLine: '123   nguyễn thị thập  ',
    });
    expect(a).toBe(b);
  });

  it('treats 0901234567 and +84901234567 as different (no country-code normalization)', () => {
    const a = buildAddressDedupeKey(base);
    const b = buildAddressDedupeKey({ ...base, recipientPhone: '+84901234567' });
    expect(a).not.toBe(b);
  });

  it('strips non-digit characters from the phone', () => {
    const a = buildAddressDedupeKey(base);
    const b = buildAddressDedupeKey({ ...base, recipientPhone: '090-123.4567' });
    expect(a).toBe(b);
  });

  it('changes when addressLine changes', () => {
    const a = buildAddressDedupeKey(base);
    const b = buildAddressDedupeKey({ ...base, addressLine: '124 Nguyễn Thị Thập' });
    expect(a).not.toBe(b);
  });

  it('changes when province/ward id changes', () => {
    expect(buildAddressDedupeKey(base)).not.toBe(
      buildAddressDedupeKey({ ...base, provinceId: '01' }),
    );
    expect(buildAddressDedupeKey(base)).not.toBe(
      buildAddressDedupeKey({ ...base, wardId: '00001' }),
    );
  });

  it('always returns a 32-char lowercase hex string', () => {
    const key = buildAddressDedupeKey(base);
    expect(key).toMatch(/^[0-9a-f]{32}$/);
  });

  it('tolerates missing/undefined fields without throwing', () => {
    const key = buildAddressDedupeKey({
      recipientName: undefined as any,
      recipientPhone: undefined as any,
      provinceId: undefined as any,
      wardId: undefined as any,
      addressLine: undefined as any,
    });
    expect(key).toMatch(/^[0-9a-f]{32}$/);
  });
});
