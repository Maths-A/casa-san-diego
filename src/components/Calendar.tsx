import type { CalendarView, OpenWindow } from '../lib/calendar'
import { windowOf } from '../lib/calendar'
import { monthGrid, monthLabel, monthsFrom, toISO } from '../lib/dates'
import { statusLabel } from '../lib/status'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface Props {
  view: CalendarView
  start: Date
  monthCount: number
  onPick: (window: OpenWindow) => void
}

export function Calendar({ view, start, monthCount, onPick }: Props) {
  const todayISO = toISO(start)

  return (
    <div className="calendar">
      {monthsFrom(start, monthCount).map(({ year, month }) => (
        <section className="month" key={`${year}-${month}`}>
          <h3>{monthLabel(year, month)}</h3>
          <div className="weekdays" aria-hidden="true">
            {WEEKDAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="days">
            {monthGrid(year, month).map((date, i) => {
              if (!date) return <span className="day empty" key={i} />

              const iso = toISO(date)
              const past = iso < todayISO
              const status = past ? undefined : view.status.get(iso)
              const note = view.noteByDay.get(iso)
              const window = status === 'open' ? windowOf(view, iso) : null
              const label = [iso, status ? statusLabel[status] : null, note]
                .filter(Boolean)
                .join(', ')

              const className = [
                'day',
                past ? 'past' : '',
                status ?? '',
                iso === todayISO ? 'today' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return window ? (
                <button
                  className={className}
                  key={i}
                  onClick={() => onPick(window)}
                  aria-label={`${label}. Demander ces dates`}
                >
                  {date.getUTCDate()}
                </button>
              ) : (
                <span className={className} key={i} aria-label={label} title={note}>
                  {date.getUTCDate()}
                </span>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
