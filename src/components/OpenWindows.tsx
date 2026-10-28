import type { OpenWindow } from '../lib/calendar'
import { formatDay, formatRange, nights } from '../lib/dates'
import { useLang } from '../lib/i18n'

const TEXT = {
  fr: {
    none: 'Rien de libre sur les mois affichés. Écrivez-nous quand même, les plans bougent.',
    from: (day: string) => `à partir du ${day}`,
    beyond: 'et au-delà',
    nights: (n: number) => `${n} nuit${n === 1 ? '' : 's'}`,
  },
  en: {
    none: 'Nothing free in the months shown. Write to us anyway, plans change.',
    from: (day: string) => `from ${day}`,
    beyond: 'and beyond',
    nights: (n: number) => `${n} night${n === 1 ? '' : 's'}`,
  },
}

interface Props {
  windows: OpenWindow[]
  start: Date
  selected: OpenWindow | null
  onPick: (window: OpenWindow) => void
}

export function OpenWindows({ windows, start, selected, onPick }: Props) {
  const lang = useLang()
  const t = TEXT[lang]
  if (windows.length === 0) {
    return <p className="empty-state">{t.none}</p>
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
                  ? t.from(formatDay(window.from, start, lang))
                  : formatRange(window, start, lang)}
              </span>
              <span className="window-meta">
                {window.openEnded ? t.beyond : t.nights(count)}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
