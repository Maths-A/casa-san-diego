import type { Period, Status } from '../data/availability'

const DAY_MS = 86_400_000

/** Parse a 'YYYY-MM-DD' string as UTC midnight, so no time zone can shift it. */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/** Today in the browser's own time zone, as a UTC-midnight Date. */
export function today(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

/** Nights in a period: 'from' and 'to' are both nights slept here. */
export function nights(period: Period): number {
  return Math.round((parseISO(period.to).getTime() - parseISO(period.from).getTime()) / DAY_MS) + 1
}

/** Every date in the period, inclusive of both ends. */
export function daysOf(period: Period): string[] {
  const out: string[] = []
  const end = parseISO(period.to)
  for (let d = parseISO(period.from); d <= end; d = addDays(d, 1)) out.push(toISO(d))
  return out
}

/** Map of date -> the period covering it, for painting the calendar. */
export function buildDayIndex(periods: Period[]): Map<string, Period> {
  const index = new Map<string, Period>()
  for (const period of periods) {
    for (const day of daysOf(period)) index.set(day, period)
  }
  return index
}

/**
 * Periods that still have nights left, in date order. A period already under
 * way keeps its remaining nights only, so nothing advertises the past.
 */
export function upcoming(periods: Period[], from: Date): Period[] {
  const floor = toISO(from)
  return periods
    .filter((p) => p.to >= floor)
    .map((p) => (p.from < floor ? { ...p, from: floor } : p))
    .sort((a, b) => a.from.localeCompare(b.from))
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function monthLabel(year: number, month: number): string {
  return `${MONTHS[month]} ${year}`
}

/** A Monday-first grid of dates covering the month, padded with nulls. */
export function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(Date.UTC(year, month, 1))
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const lead = (first.getUTCDay() + 6) % 7 // shift Sunday=0 to Monday=0
  const cells: (Date | null)[] = Array(lead).fill(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(Date.UTC(year, month, day)))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/** The next N months, starting with the month that contains `start`. */
export function monthsFrom(start: Date, count: number): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1))
    out.push({ year: d.getUTCFullYear(), month: d.getUTCMonth() })
  }
  return out
}

/** 'Fri 2 Oct' style, adding the year only when it differs from the reference. */
export function formatDay(iso: string, reference?: Date): string {
  const d = parseISO(iso)
  const label = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  }).format(d)
  const sameYear = !reference || d.getUTCFullYear() === reference.getUTCFullYear()
  return sameYear ? label : `${label} ${d.getUTCFullYear()}`
}

export function formatRange(period: Period, reference?: Date): string {
  const arrive = formatDay(period.from, reference)
  const leave = formatDay(toISO(addDays(parseISO(period.to), 1)), reference)
  return `${arrive} to ${leave}`
}

export const statusLabel: Record<Status, string> = {
  open: 'Open',
  booked: 'Taken',
  blocked: 'Not this time',
}
