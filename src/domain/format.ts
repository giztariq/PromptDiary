const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export function formatRelativeDate(value: string, now: Date = new Date()): string {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return value;
  }

  const diff = now.getTime() - timestamp;

  if (diff < MINUTE) {
    return 'à l’instant';
  }

  if (diff < HOUR) {
    return `il y a ${Math.floor(diff / MINUTE)} min`;
  }

  if (diff < DAY) {
    return `il y a ${Math.floor(diff / HOUR)} h`;
  }

  if (diff < WEEK) {
    return `il y a ${Math.floor(diff / DAY)} j`;
  }

  if (diff < MONTH) {
    return `il y a ${Math.floor(diff / WEEK)} sem.`;
  }

  if (diff < YEAR) {
    return `il y a ${Math.floor(diff / MONTH)} mois`;
  }

  const years = Math.floor(diff / YEAR);
  return `il y a ${years} an${years === 1 ? '' : 's'}`;
}
