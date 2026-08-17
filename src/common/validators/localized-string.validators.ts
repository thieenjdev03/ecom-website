import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Reusable validators for multi-language (LocalizedString) fields.
 *
 * A LocalizedString is an object keyed by locale, e.g. `{ en: 'Polo', vi: 'Áo Polo' }`.
 * Because every locale key is individually optional, class-validator's `@ValidateNested`
 * alone happily accepts an empty object `{}` — which would let a nameless / slug-less
 * product through. These decorators close that gap with clear, human-readable messages
 * so the admin UI can surface exactly what went wrong instead of a silent bad save.
 */

/** True for a plain object that is neither an array nor null. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Locale values that are present and hold a non-blank string. */
function nonEmptyLocaleEntries(
  value: Record<string, unknown>,
): [string, string][] {
  return Object.entries(value).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === 'string' && entry[1].trim() !== '',
  );
}

/**
 * Requires a localized field to contain at least one non-empty translation.
 * Rejects `undefined`, `null`, non-objects, `{}`, and objects whose every value
 * is empty/blank. Pair with `@ValidateNested` for per-locale type checks.
 */
export function IsLocalizedNotEmpty(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLocalizedNotEmpty',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return isPlainObject(value) && nonEmptyLocaleEntries(value).length > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must include at least one non-empty translation (e.g. { "en": "...", "vi": "..." }) / phải có ít nhất một ngôn ngữ được nhập`;
        },
      },
    });
  };
}

/** URL-safe slug: lowercase letters, digits and single hyphens, e.g. `premium-polo-shirt`. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Requires every provided locale value of a localized slug to be URL-safe:
 * lowercase, no spaces or special characters, words joined by single hyphens.
 * Empty/omitted locales are ignored here — combine with `@IsLocalizedNotEmpty`
 * when the slug itself is mandatory.
 */
export function IsLocalizedSlug(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLocalizedSlug',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (!isPlainObject(value)) return false;
          return nonEmptyLocaleEntries(value).every(([, slug]) =>
            SLUG_PATTERN.test(slug),
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be URL-safe: lowercase letters, numbers and single hyphens only, e.g. "premium-polo-shirt" / chỉ gồm chữ thường, số và dấu gạch ngang`;
        },
      },
    });
  };
}
