import type { Period } from '../data/types'
import { addDays, daysOf, toISO } from './dates'
import type { Status } from './status'
import { guestStatus } from './status'

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

export interface CalendarView {
  /** Statut de chaque jour de l'horizon. Tout est libre sauf exception. */
  status: Map<string, Status>
  /** La note à afficher sur un jour pris, s'il y en a une. */
  noteByDay: Map<string, string>
  /** Les suites de nuits libres, dans l'ordre. */
  windows: OpenWindow[]
  /** De quel créneau libre fait partie un jour donné. */
  windowByDay: Map<string, OpenWindow>
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

  const status = new Map<string, Status>()
  const noteByDay = new Map<string, string>()
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
    const state: Status = exception ? guestStatus(exception) : 'open'
    status.set(iso, state)
    if (exception?.note) noteByDay.set(iso, exception.note)

    if (state === 'open') run.push(iso)
    else closeRun()
  }
  closeRun()

  return { status, noteByDay, windows, windowByDay }
}

/** Le créneau libre qui contient ce jour, s'il y en a un. */
export function windowOf(view: CalendarView, iso: string): OpenWindow | null {
  return view.windowByDay.get(iso) ?? null
}
