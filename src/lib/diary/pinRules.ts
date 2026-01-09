export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 12;
const PIN_PATTERN = /^[0-9]+$/;

export function isPinFormatValid(value: string): boolean {
  return (
    PIN_PATTERN.test(value) &&
    value.length >= PIN_MIN_LENGTH &&
    value.length <= PIN_MAX_LENGTH
  );
}

export function normalizePinInput(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}
