import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { CountryConfig } from './interfaces/country-config.interface';
import { ShippingRule } from './interfaces/shipping-rule.interface';

interface GetPriceParams {
  country: string;
  province: string;
  district: string;
  weight: number;
  method?: string;
}

export interface CacheMeta {
  lastLoadedAt: Date | null;
  ttlMs: number;
  expiresAt: Date | null;
  totalRules: number;
  totalCountryConfigs: number;
}

type CountryConfigInternal = CountryConfig & { rowIndex: number };

@Injectable()
export class ShippingConfigService {
  private readonly logger = new Logger(ShippingConfigService.name);
  private readonly sheetId: string;
  private readonly sheetRange: string;
  private readonly countrySheetRange: string | null;
  private readonly cacheTtlMs: number;
  private readonly currency: string;
  private readonly supportedMethods: string[];
  private readonly defaultMethod: string;
  private readonly credentialsJson?: string;

  private rules: ShippingRule[] = [];
  private countryConfigs: CountryConfigInternal[] = [];
  private lastLoadedAt: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    this.sheetId = this.configService.get<string>('shipping.sheetId') ?? '';
    this.sheetRange =
      this.configService.get<string>('shipping.sheetRange') ??
      'shipping_config!A2:H1000';
    const configuredCountryRange =
      this.configService.get<string>('shipping.countrySheetRange') ?? '';
    this.countrySheetRange = configuredCountryRange.trim()
      ? configuredCountryRange
      : null;
    this.cacheTtlMs =
      this.configService.get<number>('shipping.cacheTtlMs') ??
      10 * 60 * 1000;
    this.currency =
      this.configService.get<string>('shipping.currency') ?? 'VND';
    this.supportedMethods =
      this.configService.get<string[]>('shipping.supportedMethods') ??
      ['standard'];
    this.defaultMethod = this.supportedMethods[0] ?? 'standard';
    this.credentialsJson =
      this.configService.get<string>('shipping.credentialsJson') ?? undefined;
  }

  async getPrice(
    params: GetPriceParams,
  ): Promise<{ price: number; rule: ShippingRule } | null> {
    await this.ensureLoaded();
    const requestedMethod = params.method ?? this.defaultMethod;
    this.ensureSupportedMethod(requestedMethod);
    const method = this.normalize(requestedMethod);

    const normalizedCountry = this.normalize(params.country);
    const normalizedProvince = this.normalize(params.province);
    const normalizedDistrict = this.normalize(params.district);
    const weight = params.weight;

    const candidates = this.rules.filter((rule) => {
      if (!rule.active) return false;
      if (this.normalize(rule.country) !== normalizedCountry) return false;

      if (
        rule.province &&
        this.normalize(rule.province) !== normalizedProvince
      ) {
        return false;
      }

      if (
        rule.district &&
        this.normalize(rule.district) !== normalizedDistrict
      ) {
        return false;
      }

      if (this.normalize(rule.shippingMethod) !== method) return false;
      if (weight < rule.minWeight || weight > rule.maxWeight) return false;
      return true;
    });

    if (!candidates.length) {
      return null;
    }

    const sorted = candidates.sort((a, b) => {
      const weightSpanA = a.maxWeight - a.minWeight;
      const weightSpanB = b.maxWeight - b.minWeight;
      if (weightSpanA !== weightSpanB) {
        return weightSpanA - weightSpanB;
      }

      const districtSpecificityA = a.district ? 1 : 0;
      const districtSpecificityB = b.district ? 1 : 0;
      if (districtSpecificityA !== districtSpecificityB) {
        return districtSpecificityB - districtSpecificityA;
      }

      const provinceSpecificityA = a.province ? 1 : 0;
      const provinceSpecificityB = b.province ? 1 : 0;
      if (provinceSpecificityA !== provinceSpecificityB) {
        return provinceSpecificityB - provinceSpecificityA;
      }

      return a.rowIndex - b.rowIndex;
    });

    const rule = sorted[0];
    return {
      price: rule.price,
      rule,
    };
  }

  async getAllRules(): Promise<ShippingRule[]> {
    await this.ensureLoaded();
    return this.rules.map((rule) => ({ ...rule }));
  }

  async getCountryConfigs(): Promise<CountryConfig[]> {
    await this.ensureLoaded();
    return this.countryConfigs.map((config) => ({
      country_code: config.country_code,
      label: config.label,
      currency: config.currency,
      shippingCost: config.shippingCost,
      taxRate: config.taxRate,
      freeShippingThres: config.freeShippingThres,
    }));
  }

  async loadFromSheet(): Promise<void> {
    if (!this.sheetId) {
      throw new InternalServerErrorException(
        'GOOGLE_SHEETS_ID environment variable is not set',
      );
    }

    try {
      const auth = this.buildAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });
      const [ruleResponse, countryResponse] = await Promise.all([
        this.fetchSheetValues(sheets, this.sheetRange),
        this.countrySheetRange
          ? this.fetchSheetValues(sheets, this.countrySheetRange)
          : Promise.resolve(null),
      ]);
      const rows = ruleResponse.data.values ?? [];
      const mapped = rows
        .map((row, idx) => this.mapRow(row, idx + 2))
        .filter((rule): rule is ShippingRule => Boolean(rule));
      const countryRows =
        (countryResponse as any)?.data?.values ?? [];
      const countryMapped = countryRows
        .map((row, idx) => this.mapCountryRow(row, idx + 2))
        .filter((row): row is CountryConfigInternal => Boolean(row));

      this.rules = mapped;
      this.countryConfigs = countryMapped;
      this.lastLoadedAt = new Date();
      this.logger.log(`Loaded ${mapped.length} shipping rules from Google Sheet`);
      if (this.countrySheetRange) {
        this.logger.log(
          `Loaded ${countryMapped.length} country configs from Google Sheet`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to load shipping config from Google Sheets', error);
      throw new InternalServerErrorException(
        'Unable to load shipping configuration',
      );
    }
  }

  getCurrency(): string {
    return this.currency;
  }

  getDefaultMethod(): string {
    return this.defaultMethod;
  }

  getSupportedMethods(): string[] {
    return this.supportedMethods;
  }

  getCacheMeta(): CacheMeta {
    const expiresAt =
      this.lastLoadedAt && this.cacheTtlMs
        ? new Date(this.lastLoadedAt.getTime() + this.cacheTtlMs)
        : null;

    return {
      lastLoadedAt: this.lastLoadedAt,
      ttlMs: this.cacheTtlMs,
      expiresAt,
      totalRules: this.rules.length,
      totalCountryConfigs: this.countryConfigs.length,
    };
  }

  private async ensureLoaded(): Promise<void> {
    if (this.rules.length === 0 || this.isExpired()) {
      await this.loadFromSheet();
    }
  }

  private isExpired(): boolean {
    if (!this.lastLoadedAt) {
      return true;
    }
    const age = Date.now() - this.lastLoadedAt.getTime();
    return age > this.cacheTtlMs;
  }

  private ensureSupportedMethod(method: string) {
    if (!this.supportedMethods.length) {
      return;
    }

    const normalizedMethod = this.normalize(method);
    const allowed = this.supportedMethods.some(
      (item) => this.normalize(item) === normalizedMethod,
    );

    if (!allowed) {
      throw new BadRequestException(
        `Unsupported shipping method "${method}". Supported methods: ${this.supportedMethods.join(', ')}`,
      );
    }
  }

  private normalize(value?: string): string {
    return value?.trim().toLowerCase() ?? '';
  }

  private mapRow(row: string[], rowIndex: number): ShippingRule | null {
    const [
      country,
      province,
      district,
      shippingMethod,
      minWeight,
      maxWeight,
      price,
      active,
    ] = row;

    if (!country || !shippingMethod || !minWeight || !maxWeight || !price) {
      return null;
    }

    const parsedMinWeight = Number(minWeight);
    const parsedMaxWeight = Number(maxWeight);
    const parsedPrice = Number(price);
    const isActive = (active ?? '').toString().toLowerCase() !== 'false';

    if (
      Number.isNaN(parsedMinWeight) ||
      Number.isNaN(parsedMaxWeight) ||
      Number.isNaN(parsedPrice)
    ) {
      this.logger.warn(
        `Skipping row ${rowIndex}: invalid numeric values (${minWeight}, ${maxWeight}, ${price})`,
      );
      return null;
    }

    return {
      country: country.trim(),
      province: province?.trim() ?? '',
      district: district?.trim() ?? '',
      shippingMethod: shippingMethod.trim(),
      minWeight: parsedMinWeight,
      maxWeight: parsedMaxWeight,
      price: parsedPrice,
      active: isActive,
      rowIndex,
    };
  }

  private mapCountryRow(row: string[], rowIndex: number): CountryConfigInternal | null {
    const [
      countryCode,
      label,
      currency,
      shippingCost,
      taxRate,
      freeShippingThres,
    ] = row;

    if (!countryCode || !label || !currency) {
      this.logger.warn(
        `Skipping country row ${rowIndex}: missing required fields (${countryCode}, ${label}, ${currency})`,
      );
      return null;
    }

    const parsedShippingCost = Number(shippingCost ?? 0);
    const parsedTaxRate = Number(taxRate ?? 0);
    const parsedFreeShipping = Number(freeShippingThres ?? 0);

    return {
      country_code: countryCode.trim(),
      label: label.trim(),
      currency: currency.trim(),
      shippingCost: Number.isNaN(parsedShippingCost)
        ? 0
        : parsedShippingCost,
      taxRate: Number.isNaN(parsedTaxRate) ? 0 : parsedTaxRate,
      freeShippingThres: Number.isNaN(parsedFreeShipping)
        ? 0
        : parsedFreeShipping,
      rowIndex,
    };
  }

  private async fetchSheetValues(
    sheets: sheets_v4.Sheets,
    range: string,
  ): Promise<any> {
    try {
      return await sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range,
      });
    } catch (error) {
      const fallbackRange = await this.resolveRangeFallback(sheets, range, error);
      if (fallbackRange) {
        this.logger.warn(
          `Retrying Google Sheets read with resolved range "${fallbackRange}" (configured "${range}")`,
        );
        return await sheets.spreadsheets.values.get({
          spreadsheetId: this.sheetId,
          range: fallbackRange,
        });
      }
      throw error;
    }
  }

  private async resolveRangeFallback(
    sheets: sheets_v4.Sheets,
    range: string,
    error: any,
  ): Promise<string | null> {
    if (!this.isRangeParseError(error)) {
      return null;
    }
    const parsed = this.parseRange(range);
    if (!parsed.sheetName) {
      return null;
    }

    try {
      const meta = await sheets.spreadsheets.get({
        spreadsheetId: this.sheetId,
        fields: 'sheets.properties.title',
      });

      const availableSheets =
        meta.data.sheets
          ?.map((sheet) => sheet.properties?.title)
          .filter((title): title is string => Boolean(title)) ?? [];

      const normalizedTarget = this.normalizeSheetTitle(parsed.sheetName);
      const match = availableSheets.find(
        (title) => this.normalizeSheetTitle(title) === normalizedTarget,
      );

      if (!match) {
        this.logger.error(
          `Configured sheet "${parsed.sheetName}" not found. Available sheets: ${availableSheets.join(', ')}`,
        );
        return null;
      }

      const safeSheetTitle = match.includes(' ')
        ? `'${match}'`
        : match;

      return parsed.cellRange
        ? `${safeSheetTitle}!${parsed.cellRange}`
        : safeSheetTitle;
    } catch (metaError) {
      this.logger.error('Failed to inspect spreadsheet metadata', metaError);
      return null;
    }
  }

  private parseRange(range: string): { sheetName: string | null; cellRange: string } {
    if (!range.includes('!')) {
      return { sheetName: null, cellRange: range };
    }
    const [rawSheet, rawCells] = range.split('!');
    const sheetName = rawSheet.replace(/^'+|'+$/g, '').trim();
    const cellRange = rawCells.trim();
    return { sheetName: sheetName || null, cellRange };
  }

  private normalizeSheetTitle(title: string): string {
    return title
      .trim()
      .replace(/['"]/g, '')
      .replace(/[\s_-]+/g, '')
      .toLowerCase();
  }

  private isRangeParseError(error: any): boolean {
    const message: string | undefined = error?.message || error?.cause?.message;
    if (!message) {
      return false;
    }
    const normalizedMessage = message.toLowerCase();
    return (
      normalizedMessage.includes('unable to parse range') &&
      (error?.code === 400 || error?.status === 400)
    );
  }

  private buildAuthClient(): GoogleAuth {
    let parsedCredentials: Record<string, any> | undefined;
    if (this.credentialsJson) {
      try {
        parsedCredentials = JSON.parse(this.credentialsJson);
      } catch (error) {
        this.logger.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON', error);
        throw new InternalServerErrorException(
          'Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON value',
        );
      }
    }

    return new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      credentials: parsedCredentials,
    });
  }
}


