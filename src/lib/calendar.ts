import type { HostKey, Period } from '../data/types'
import { config } from '../config'
import { addDays, daysOf, formatDay, toISO } from './dates'
import type { Status } from './status'
import { HOST_KEYS, guestStatus, statusLabel } from './status'

/** Une suite de nuits libres, déduite de ce qui n'est pas pris. */
export interface OpenWindow {
  from: string
  to: string
  /**
   * Le créneau touche le bord des mois affichés : rien ne dit qu'il s'arrête
   * là, seulement que le calendrier ne va pas plus loin.
   */
  openEnded: boolean
}

/** Qui est à la maison, une fois les exceptions appliquées. */
export type Presence = 'both' | 'mathis' | 'julie' | 'none'

export interface DayInfo {
  status: Status
  presence: Presence
  hosts: Record<HostKey, boolean>
  note?: string
}

export interface CalendarView {
  /** Chaque jour de l'horizon. Tout est libre et habité, sauf exception. */
  days: Map<string, DayInfo>
  /** Les suites de nuits libres, dans l'ordre. */
  windows: OpenWindow[]
  /** De quel créneau libre fait partie un jour donné. */
  windowByDay: Map<string, OpenWindow>
}

/** Sans exception saisie, on considère que nous sommes là tous les deux. */
const BOTH_HOME: Record<HostKey, boolean> = { mathis: true, julie: true }

function presenceOf(hosts: Record<HostKey, boolean>): Presence {
  const home = HOST_KEYS.filter((key) => hosts[key])
  if (home.length === HOST_KEYS.length) return 'both'
  if (home.length === 0) return 'none'
  return home[0]
}

/** Le dernier jour du mois qui clôt l'horizon affiché. */
function horizonEnd(from: Date, months: number): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + months, 0))
}

/**
 * La chambre est libre par défaut : les périodes saisies sont des exceptions,
 * et tout ce qu'elles ne couvrent pas se propose aux visiteurs.
 */
export function buildCalendar(periods: Period[], from: Date, months: number): CalendarView {
  const exceptions = new Map<string, Period>()
  for (const period of periods) {
    for (const day of daysOf(period)) exceptions.set(day, period)
  }

  const days = new Map<string, DayInfo>()
  const windows: OpenWindow[] = []
  const windowByDay = new Map<string, OpenWindow>()

  const end = horizonEnd(from, months)
  let run: string[] = []

  const closeRun = () => {
    if (run.length === 0) return
    const last = run[run.length - 1]
    const window: OpenWindow = { from: run[0], to: last, openEnded: last === toISO(end) }
    windows.push(window)
    for (const day of run) windowByDay.set(day, window)
    run = []
  }

  for (let date = from; date <= end; date = addDays(date, 1)) {
    const iso = toISO(date)
    const exception = exceptions.get(iso)
    const hosts = exception ? exception.hosts : BOTH_HOME
    const status: Status = exception ? guestStatus(exception) : 'open'

    days.set(iso, {
      status,
      hosts,
      presence: presenceOf(hosts),
      note: exception?.note,
    })

    if (status === 'open') run.push(iso)
    else closeRun()
  }
  closeRun()

  return { days, windows, windowByDay }
}

/** Le créneau libre qui contient ce jour, s'il y en a un. */
export function windowOf(view: CalendarView, iso: string): OpenWindow | null {
  return view.windowByDay.get(iso) ?? null
}

const PRESENCE_TEXT: Record<Presence, string> = {
  both: `${config.hostNames.mathis} et ${config.hostNames.julie} sont là`,
  mathis: `${config.hostNames.mathis} est là, ${config.hostNames.julie} est absente`,
  julie: `${config.hostNames.julie} est là, ${config.hostNames.mathis} est absent`,
  none: 'personne à la maison',
}

/** La phrase qui s'affiche au survol d'un jour. */
export function describeDay(iso: string, info: DayInfo, reference?: Date): string {
  const parts = [formatDay(iso, reference), statusLabel[info.status], PRESENCE_TEXT[info.presence]]
  if (info.note) parts.push(info.note)
  return parts.join(' · ')
}
