import type { OpenWindow } from '../lib/calendar'
import { formatDay, formatRange, nights } from '../lib/dates'

interface Props {
  windows: OpenWindow[]
  start: Date
  selected: OpenWindow | null
  onPick: (window: OpenWindow) => void
}

export function OpenWindows({ windows, start, selected, onPick }: Props) {
  if (windows.length === 0) {
    return (
      <p className="empty-state">
        Rien de libre sur les mois affichés. Écrivez-nous quand même, les plans bougent.
      </p>
    )
  }

  return (
    <ul className="windows">
      {windows.map((window) => {
        const count = nights(window)
        const isSelected = selected?.from === window.from && selected?.to === window.to
        return (
          <li key={`${window.from}-${window.to}`}>
            <button
              className={`window${isSelected ? ' selected' : ''}`}
              onClick={() => onPick(window)}
              aria-pressed={isSelected}
            >
              <span className="window-dates">
                {window.openEnded
                  ? `à partir du ${formatDay(window.from, start)}`
                  : formatRange(window, start)}
              </span>
              <span className="window-meta">
                {window.openEnded ? (
                  'et au-delà'
                ) : (
                  <>
                    {count} nuit{count === 1 ? '' : 's'}
                  </>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
