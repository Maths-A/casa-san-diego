import type { CalendarView, OpenWindow } from '../lib/calendar'
import { describeDay, windowOf } from '../lib/calendar'
import { monthGrid, monthLabel, monthsFrom, toISO } from '../lib/dates'
import { useLang } from '../lib/i18n'

/** La semaine commence le lundi, dans les deux langues. */
const WEEKDAYS = {
  fr: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
}

const ASK = { fr: 'Demander ces dates', en: 'Ask for these dates' }

interface Props {
  view: CalendarView
  start: Date
  monthCount: number
  /** Sans ce rappel, le calendrier se contente d'être lu. */
  onPick?: (window: OpenWindow) => void
}

export function Calendar({ view, start, monthCount, onPick }: Props) {
  const lang = useLang()
  const todayISO = toISO(start)

  return (
    <div className="calendar">
      {monthsFrom(start, monthCount).map(({ year, month }) => (
        <section className="month" key={`${year}-${month}`}>
          <h3>{monthLabel(year, month, lang)}</h3>
          <div className="weekdays" aria-hidden="true">
            {WEEKDAYS[lang].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="days">
            {monthGrid(year, month).map((date, i) => {
              if (!date) return <span className="day empty" key={i} />

              const iso = toISO(date)
              const past = iso < todayISO
              const info = past ? undefined : view.days.get(iso)
              const label = info ? describeDay(iso, info, start, lang) : iso
              const window = onPick && info?.status === 'open' ? windowOf(view, iso) : null

              const className = [
                'day',
                past ? 'past' : '',
                info?.status ?? '',
                info && info.presence !== 'both' ? `solo-${info.presence}` : '',
                iso === todayISO ? 'today' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return window && onPick ? (
                <button
                  className={className}
                  key={i}
                  onClick={() => onPick(window)}
                  title={label}
                  aria-label={`${label}. ${ASK[lang]}`}
                >
                  {date.getUTCDate()}
                </button>
              ) : (
                <span className={className} key={i} title={label} aria-label={label}>
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
