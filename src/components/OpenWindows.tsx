import type { Period } from '../data/availability'
import { formatRange, nights } from '../lib/dates'

interface Props {
  periods: Period[]
  start: Date
  selected: Period | null
  onPick: (period: Period) => void
}

export function OpenWindows({ periods, start, selected, onPick }: Props) {
  const open = periods.filter((p) => p.status === 'open')

  if (open.length === 0) {
    return (
      <p className="empty-state">
        Nothing open on the calendar right now. Write to us anyway, plans move.
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
                {count} night{count === 1 ? '' : 's'}
                {period.note ? ` · ${period.note}` : ''}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
