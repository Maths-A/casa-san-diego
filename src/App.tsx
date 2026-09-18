import { useEffect, useMemo, useState } from 'react'
import type { Period } from './data/types'
import { periods } from './data/availability'
import { config } from './config'
import { buildDayIndex, monthSpan, parseISO, today, toISO, upcoming } from './lib/dates'
import { scrollToElement } from './lib/scroll'
import { Admin } from './components/Admin'
import { Calendar } from './components/Calendar'
import { Legend } from './components/Legend'
import { OpenWindows } from './components/OpenWindows'
import { RequestForm } from './components/RequestForm'

/** Le tableau d'administration vit sur #admin, hors du chemin des visiteurs. */
function useIsAdmin(): boolean {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash === '#admin'
}

export default function App() {
  const isAdmin = useIsAdmin()
  const start = useMemo(() => today(), [])
  const visible = useMemo(() => upcoming(periods, start), [start])
  const dayIndex = useMemo(() => buildDayIndex(visible), [visible])
  const [selected, setSelected] = useState<Period | null>(null)

  // Le calendrier va jusqu'à la dernière nuit saisie, aussi loin qu'elle soit.
  const monthCount = useMemo(() => {
    const last = visible.reduce((max, p) => (p.to > max ? p.to : max), toISO(start))
    return Math.max(config.minMonths, monthSpan(start, parseISO(last)))
  }, [visible, start])

  function pick(period: Period) {
    setSelected(period)
    scrollToElement('ask')
  }

  return (
    <div className={isAdmin ? 'page wide' : 'page'}>
      <header className="hero">
        <p className="eyebrow">{config.location}</p>
        <h1>{config.siteName}</h1>
        {isAdmin ? (
          <p className="tagline">Tableau de bord</p>
        ) : (
          <>
            <p className="tagline">{config.tagline}</p>
            <p className="hosts">Chez {config.hosts}</p>
          </>
        )}
      </header>

      {isAdmin ? (
        <main>
          <Admin />
          <p className="hint centered">
            <a href="#">Revenir à la page des visiteurs</a>
          </p>
        </main>
      ) : (
        <main>
          <section className="panel">
            <h2>Quand la chambre est libre</h2>
            <Legend />
            <Calendar dayIndex={dayIndex} start={start} monthCount={monthCount} onPick={pick} />
          </section>

          <section className="panel">
            <h2>Les périodes libres</h2>
            <OpenWindows periods={visible} start={start} selected={selected} onPick={pick} />
          </section>

          <section className="panel" id="ask">
            <RequestForm selected={selected} start={start} />
          </section>

          <section className="panel">
            <h2>Bon à savoir</h2>
            <dl className="info">
              {config.practicalInfo.map((item) => (
                <div key={item.title}>
                  <dt>{item.title}</dt>
                  <dd>{item.body}</dd>
                </div>
              ))}
            </dl>
          </section>
        </main>
      )}

      <footer>
        <p>À très vite.</p>
      </footer>
    </div>
  )
}
