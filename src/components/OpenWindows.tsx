import type { Period } from '../data/types'
import { formatRange, nights } from '../lib/dates'
import { guestStatus } from '../lib/status'

interface Props {
  periods: Period[]
  start: Date
  selected: Period | null
  onPick: (period: Period) => void
}

export function OpenWindows({ periods, start, selected, onPick }: Props) {
  const open = periods.filter((p) => guestStatus(p) === 'open')

  if (open.length === 0) {
    return (
      <p className="empty-state">
        Rien de libre au calendrier pour le moment. Écrivez-nous quand même, les plans bougent.
      </p>
    )
  }

  return (
    <ul className="windows">
      {open.map((period) => {
        const count = nights(period)
        const isSelected = selected?.from === period.from && selected?.to === period.to
        return (
          <li key={`${period.from}-${period.to}`}>
            <button
              className={`window${isSelected ? ' selected' : ''}`}
              onClick={() => onPick(period)}
              aria-pressed={isSelected}
            >
              <span className="window-dates">{formatRange(period, start)}</span>
              <span className="window-meta">
                {count} nuit{count === 1 ? '' : 's'}
                {period.note ? ` · ${period.note}` : ''}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
