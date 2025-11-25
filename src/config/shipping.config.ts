import { registerAs } from '@nestjs/config';

const parseMethods = (raw?: string) =>
  raw
    ?.split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0) ?? [];

export default registerAs('shipping', () => {
  const defaultMethods = ['standard', 'express'];
  const configuredMethods = parseMethods(process.env.SHIPPING_METHODS);

  return {
    sheetId: process.env.GOOGLE_SHEETS_ID ?? '',
    sheetRange: process.env.GOOGLE_SHEETS_RANGE ?? 'shipping_config!A2:H1000',
    countrySheetRange:
      process.env.SHIPPING_COUNTRY_RANGE ?? 'shipping_config!A2:F1000',
    cacheTtlMs: Number(process.env.SHIPPING_CACHE_TTL_MS ?? 10 * 60 * 1000),
    currency: process.env.SHIPPING_CURRENCY ?? 'VND',
    supportedMethods:
      configuredMethods.length > 0 ? configuredMethods : defaultMethods,
    credentialsJson: process.env.GOOGLE_SHEETS_SECRET_KEY,
  };
});


