import { formatRelativeDate } from './format';

const now = new Date('2026-10-21T12:00:00.000Z');

function ago(milliseconds: number): string {
  return new Date(now.getTime() - milliseconds).toISOString();
}

describe('formatRelativeDate', () => {
  it('describes a very recent usage as happening now', () => {
    expect(formatRelativeDate(ago(5_000), now)).toBe('à l’instant');
    expect(formatRelativeDate(ago(59_000), now)).toBe('à l’instant');
  });

  it('describes minutes, hours, and days', () => {
    expect(formatRelativeDate(ago(5 * 60_000), now)).toBe('il y a 5 min');
    expect(formatRelativeDate(ago(3 * 3_600_000), now)).toBe('il y a 3 h');
    expect(formatRelativeDate(ago(2 * 86_400_000), now)).toBe('il y a 2 j');
  });

  it('describes weeks, months, and years', () => {
    expect(formatRelativeDate(ago(10 * 86_400_000), now)).toBe('il y a 1 sem.');
    expect(formatRelativeDate(ago(45 * 86_400_000), now)).toBe('il y a 1 mois');
    expect(formatRelativeDate(ago(400 * 86_400_000), now)).toBe('il y a 1 an');
  });

  it('keeps the raw value for an invalid date', () => {
    expect(formatRelativeDate('not-a-date', now)).toBe('not-a-date');
  });

  it('treats a future date as happening now', () => {
    expect(formatRelativeDate(ago(-60_000), now)).toBe('à l’instant');
  });
});
