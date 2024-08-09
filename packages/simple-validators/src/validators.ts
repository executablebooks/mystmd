import type { KeyOptions, ValidationOptions } from './types.js';
import { formatDate } from './utils.js';

export function defined<T = any>(val: T | null | undefined): val is T {
  return val != null;
}

export function locationSuffix(opts: Partial<ValidationOptions>) {
  if (opts.file && opts.location) return ` (at ${opts.file}#${opts.location})`;
  if (opts.file || opts.location) return ` (at ${opts.file || opts.location})`;
  return '';
}

export function incrementOptions(property: string, opts: ValidationOptions) {
  let location = opts.property;
  if (opts.location) location = `${opts.location}.${opts.property}`;
  return { ...opts, property, location };
}

export function validationError(message: string, opts: ValidationOptions) {
  if (opts.suppressErrors) return undefined;
  const { messages } = opts;
  if (!messages.errors) messages.errors = [];
  const fullMessage = `'${opts.property}' ${message}${locationSuffix(opts)}`;
  messages.errors.push({
    property: opts.property,
    message: fullMessage,
  });
  if (opts.errorLogFn) opts.errorLogFn(fullMessage);
  return undefined;
}

export function validationWarning(message: string, opts: ValidationOptions) {
  if (opts.suppressWarnings) return undefined;
  const { messages } = opts;
  if (!messages.warnings) messages.warnings = [];
  const fullMessage = `'${opts.property}' ${message}${locationSuffix(opts)}`;
  messages.warnings.push({
    property: opts.property,
    message: fullMessage,
  });
  if (opts.warningLogFn) opts.warningLogFn(fullMessage);
  return undefined;
}

/**
 * Validate value is boolean
 *
 * String 'true' and 'false' are coerced to booleans; error on any other value, including 1/0, 't'/'f', etc.
 */
export function validateBoolean(input: any, opts: ValidationOptions) {
  if (typeof input === 'string') {
    if (input.toLowerCase() === 'true') return true;
    if (input.toLowerCase() === 'false') return false;
  }
  if (input === true || input === false) return input;
  return validationError('must be boolean', opts);
}

/**
 * Validate value is number
 *
 * Attempts to coerce inputs to number with Number(input)
 */
export function validateNumber(
  input: any,
  opts: { min?: number; max?: number; integer?: boolean } & ValidationOptions,
) {
  const value = Number(input);
  if (Number.isNaN(value)) {
    return validationError(`must be a number: ${input}`, opts);
  }
  if (defined(opts.min) && value < opts.min) {
    return validationError(`must be greater than or equal to ${opts.min}: ${value}`, opts);
  }
  if (defined(opts.max) && value > opts.max) {
    return validationError(`must be less than or equal to ${opts.max}: ${value}`, opts);
  }
  if (opts.integer && !Number.isInteger(value)) {
    return validationError(`must be an integer: ${value}`, opts);
  }
  return value;
}

/**
 * Validates string value
 *
 * Ensures string length is less than `maxLength` and matches regular expression `regex`.
 * If `escapeFn` is provided, this will be applied to the output after other validation.
 */
export function validateString(
  input: any,
  opts: { coerceNumber?: boolean; maxLength?: number; regex?: string | RegExp } & ValidationOptions,
): string | undefined {
  let value = input as string;
  if (opts.coerceNumber && typeof value === 'number') {
    if (Number.isNaN(value)) validationWarning('is not a number', opts);
    value = String(value);
  }
  if (typeof value !== 'string') return validationError(`must be string`, opts);
  if (opts.maxLength && value.length > opts.maxLength) {
    return validationError(`must be less than ${opts.maxLength} chars`, opts);
  }
  if (opts.regex && !value.match(opts.regex)) {
    return validationError(`must match regex ${opts.regex}`, opts);
  }
  if (opts.escapeFn) {
    value = opts.escapeFn(value);
  }
  return value;
}

/**
 * Validate value is valid URL string of max length 2048
 *
 * If 'include' is provided, value must include it in the origin.
 */
export function validateUrl(input: any, opts: { includes?: string } & ValidationOptions) {
  const value = validateString(input, { ...opts, maxLength: 2048 });
  if (value === undefined) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return validationError(`must be valid URL: ${value}`, opts);
  }
  if (opts.includes && !url.origin.includes(opts.includes)) {
    return validationError(`must include "${opts.includes}": ${value}`, opts);
  }
  return value;
}

export function validateSubdomain(input: string, opts: ValidationOptions) {
  let value = validateString(input, { ...opts, maxLength: 2048 });
  if (value === undefined) return value;
  if (!value.startsWith('https://') && !value.startsWith('http://')) {
    value = `http://${value}`;
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return validationError(`must be valid domain: ${input}`, opts);
  }
  const { hash, host, pathname, protocol, search } = url;
  if (protocol !== 'http:' && protocol !== 'https:') {
    return validationError(`must have http/https protocol or no protocol: ${input}`, opts);
  }
  if ((pathname && pathname !== '/') || hash || search) {
    return validationError(`must not specify path, query, or fragment: ${input}`, opts);
  }
  if (!host.match(/^.+\..+\..+$/)) {
    return validationError(`must be a subdomain: ${input}`, opts);
  }
  // `host` is already lowercased, but we can be super explicit!
  return host.toLowerCase();
}

/**
 * Validate value is valid email
 */
export function validateEmail(input: any, opts: ValidationOptions) {
  const value = validateString(input, opts);
  if (value === undefined) return value;
  const valid = value
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
  if (!valid) {
    return validationError(`must be valid email address: ${value}`, opts);
  }
  return value;
}

/**
 * Validate value against array of choices
 */
export function validateChoice<T>(
  input: any,
  opts: ValidationOptions & { choices: T[] },
): T | undefined {
  if (!opts.choices.includes(input)) {
    return validationError(
      `invalid value '${input}' - must be one of [${opts.choices.join(', ')}]`,
      opts,
    );
  }
  return input;
}

/**
 * Validate value against enum
 *
 * Must provide enum object as both option 'enum' and the type variable.
 */
export function validateEnum<T>(
  input: any,
  opts: ValidationOptions & { enum: Record<string | number | symbol, any> },
): T | undefined {
  if (!Object.values(opts.enum).includes(input)) {
    return validationError(
      `invalid value '${input}' - must be one of [${Object.values(opts.enum).join(', ')}]`,
      opts,
    );
  }
  return input;
}

/**
 * Validate date string or object
 *
 * Uses javascript Date() constructor; any input to the constructor that returns
 * a valid date is valid input. This includes ISO 8601 formatted strings and
 * IETF timestamps are valid.
 */
export function validateDate(input: any, opts: ValidationOptions) {
  const date = new Date(input);
  if (!date.getDate()) {
    return validationError(
      `invalid date "${input}" - must be ISO 8601 format or IETF timestamp`,
      opts,
    );
  }
  return formatDate(date);
}

/**
 * Validates value is an object with string keys
 */
export function validateObject(input: any, opts: ValidationOptions) {
  if (typeof input !== 'object') return validationError(`must be object`, opts);
  if (Array.isArray(input)) return validationError(`must be object, not array`, opts);
  return input as Record<string, any>;
}

/**
 * Validate an object has all required keys
 *
 * Returns new object with only required/optional keys
 */
export function validateKeys(
  input: Record<string, any>,
  keys: { required?: string[]; optional?: string[]; alias?: Record<string, string> },
  opts: KeyOptions,
) {
  const value: Record<string, any> = {};
  let required = keys.required || [];
  const optional = keys.optional || [];
  const aliasKeys = Object.entries(keys.alias ?? {})
    // Remove aliases that do not resolve to valid keys
    .filter((alias) => required.includes(alias[1]) || optional.includes(alias[1]))
    .map((alias) => alias[0]);
  const ignored: string[] = [];
  Object.keys(input).forEach((k) => {
    if (required.includes(k) || optional.includes(k)) {
      value[k] = input[k];
      required = required.filter((val) => val !== k);
    } else if (aliasKeys.includes(k)) {
      const normalized = keys.alias?.[k] as string;
      if (input[normalized] === undefined) {
        value[normalized] = input[k];
        required = required.filter((val) => val !== normalized);
      } else {
        validationWarning(
          `both "${normalized}" and "${k}" were provided, "${k}" was ignored.`,
          opts,
        );
      }
    } else {
      ignored.push(k);
      if (opts.keepExtraKeys) value[k] = input[k];
    }
  });
  if (required.length) {
    validationError(
      `missing required key${required.length > 1 ? 's' : ''}: ${required.join(', ')}`,
      opts,
    );
    if (!opts.returnInvalidPartial) return undefined;
  }
  if (ignored.length) {
    validationWarning(
      `extra key${ignored.length > 1 ? 's' : ''} ignored: ${ignored.join(', ')}`,
      opts,
    );
  }
  return value;
}

/**
 * Validates value is an object and has all required keys
 *
 * Returns new object with only required/optional keys
 */
export function validateObjectKeys(
  input: any,
  keys: { required?: string[]; optional?: string[]; alias?: Record<string, string> },
  opts: KeyOptions,
) {
  const value = validateObject(input, opts);
  if (value === undefined) return undefined;
  return validateKeys(value, keys, opts);
}

/**
 * Validate value is a list
 */
export function validateList<T>(
  input: any,
  opts: ValidationOptions & { coerce?: boolean },
  itemValidator: (item: any, index: number) => T | undefined,
) {
  let value: any[];
  if (Array.isArray(input)) {
    value = input;
  } else if (opts.coerce) {
    value = [input];
  } else {
    return validationError('must be an array', opts);
  }
  return value
    .map((item, index) => itemValidator(item, index))
    .filter((item): item is T => item !== undefined);
}

/**
 * Copy 'base' object and fill any 'keys' that are missing with their values from 'filler'
 */
export function fillMissingKeys<T extends Record<string, any>>(
  base: T,
  filler: T,
  keys: (keyof T | string)[],
): T {
  const output: T = { ...base };
  keys.forEach((key) => {
    if (!defined(output[key]) && defined(filler[key])) {
      const k = key as keyof T;
      output[k] = filler[k];
    }
  });
  return output;
}

export function filterKeys(value: Record<string, any>, keys: string[]): Record<string, any> {
  return fillMissingKeys({}, value, keys);
}
