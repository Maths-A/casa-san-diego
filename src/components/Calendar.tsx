import type { Period } from '../data/availability'
import { monthGrid, monthLabel, monthsFrom, statusLabel, toISO } from '../lib/dates'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface Props {
  dayIndex: Map<string, Period>
  start: Date
  monthCount: number
  onPick: (period: Period) => void
}

export function Calendar({ dayIndex, start, monthCount, onPick }: Props) {
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
              const period = dayIndex.get(iso)
              const past = iso < todayISO
              const status = past ? undefined : period?.status
              const isOpen = status === 'open'
              const label = `${iso}${status ? `, ${statusLabel[status].toLowerCase()}` : ''}`

              const className = [
                'day',
                past ? 'past' : '',
                status ?? '',
                iso === todayISO ? 'today' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return isOpen && period ? (
                <button
                  className={className}
                  key={i}
                  onClick={() => onPick(period)}
                  aria-label={`${label}. Ask for these dates`}
                >
                  {date.getUTCDate()}
                </button>
              ) : (
                <span className={className} key={i} aria-label={label}>
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
