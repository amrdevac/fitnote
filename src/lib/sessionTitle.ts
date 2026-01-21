export function getDefaultSessionTitle(dateIso: string) {
  const date = new Date(dateIso);
  const weekday = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date);
  const normalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `Exercise ${normalizedWeekday}`;
}
