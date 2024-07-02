export function defined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
