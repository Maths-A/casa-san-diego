/** Tout ce dont ces fonctions ont besoin : deux bornes. */
export interface Span {
  from: string
  to: string
}

const DAY_MS = 86_400_000
const LOCALE = 'fr-FR'

/** Lit une date 'AAAA-MM-JJ' à minuit UTC, pour qu'aucun fuseau ne la décale. */
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

/** La date du jour dans le fuseau du visiteur, ramenée à minuit UTC. */
export function today(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

/** Nombre de nuits : 'from' et 'to' sont deux nuits passées ici. */
export function nights(period: Span): number {
  return Math.round((parseISO(period.to).getTime() - parseISO(period.from).getTime()) / DAY_MS) + 1
}

/** Toutes les dates de la période, bornes comprises. */
export function daysOf(period: Span): string[] {
  const out: string[] = []
  const end = parseISO(period.to)
  for (let d = parseISO(period.from); d <= end; d = addDays(d, 1)) out.push(toISO(d))
  return out
}

/**
 * Les périodes qui ont encore des nuits devant elles, par ordre de date. Une
 * période déjà commencée ne garde que ses nuits restantes, pour ne jamais
 * afficher le passé comme disponible.
 */
export function upcoming<T extends Span>(periods: T[], from: Date): T[] {
  const floor = toISO(from)
  return periods
    .filter((p) => p.to >= floor)
    .map((p) => (p.from < floor ? { ...p, from: floor } : p))
    .sort((a, b) => a.from.localeCompare(b.from))
}

/** 'octobre 2026'. La majuscule est mise par la feuille de style. */
export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month, 1)),
  )
}

/** Une grille commençant le lundi, complétée par des cases vides. */
export function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(Date.UTC(year, month, 1))
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const lead = (first.getUTCDay() + 6) % 7 // dimanche = 0 devient lundi = 0
  const cells: (Date | null)[] = Array(lead).fill(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(Date.UTC(year, month, day)))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/** Nombre de mois couverts, bornes comprises, de `from` à `to`. */
export function monthSpan(from: Date, to: Date): number {
  const months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth())
  return Math.max(1, months + 1)
}

/** Les N prochains mois, en commençant par celui qui contient `start`. */
export function monthsFrom(start: Date, count: number): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1))
    out.push({ year: d.getUTCFullYear(), month: d.getUTCMonth() })
  }
  return out
}

/** 'ven. 2 oct.', avec l'année seulement si elle diffère de la référence. */
export function formatDay(iso: string, reference?: Date): string {
  const d = parseISO(iso)
  const label = new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  }).format(d)
  const sameYear = !reference || d.getUTCFullYear() === reference.getUTCFullYear()
  return sameYear ? label : `${label} ${d.getUTCFullYear()}`
}

/** 'du ven. 2 oct. au lun. 12 oct.', le départ étant le lendemain de la dernière nuit. */
export function formatRange(period: Span, reference?: Date): string {
  const arrivee = formatDay(period.from, reference)
  const depart = formatDay(toISO(addDays(parseISO(period.to), 1)), reference)
  return `du ${arrivee} au ${depart}`
}
