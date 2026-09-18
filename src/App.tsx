import { useEffect, useMemo, useState } from 'react'
import type { Period } from './data/types'
import { config } from './config'
import { buildDayIndex, monthSpan, parseISO, today, toISO, upcoming } from './lib/dates'
import { fetchSnapshot } from './lib/gist'
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

type Load =
  | { state: 'loading' }
  | { state: 'ready'; periods: Period[]; recipients: string[] }
  | { state: 'error'; message: string }

/** Le calendrier vient du Gist, relu à chaque chargement de la page. */
function useCalendar(): Load {
  const [load, setLoad] = useState<Load>({ state: 'loading' })

  useEffect(() => {
    if (!config.gistId) {
      setLoad({ state: 'error', message: 'Le calendrier n’est pas encore branché.' })
      return
    }
    let cancelled = false
    fetchSnapshot(config.gistId)
      .then((snapshot) => {
        if (!cancelled) {
          setLoad({ state: 'ready', periods: snapshot.periods, recipients: snapshot.recipients })
        }
      })
      .catch((error: Error) => {
        if (!cancelled) setLoad({ state: 'error', message: error.message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return load
}

export default function App() {
  const isAdmin = useIsAdmin()
  const load = useCalendar()
  const start = useMemo(() => today(), [])
  const periods = load.state === 'ready' ? load.periods : []
  const recipients = load.state === 'ready' ? load.recipients : []
  const visible = useMemo(() => upcoming(periods, start), [periods, start])
  const dayIndex = useMemo(() => buildDayIndex(visible), [visible])
  const [selected, setSelected] = useState<Period | null>(null)
  const [extraMonths, setExtraMonths] = useState(0)

  // Une année devant soi, davantage si des dates vont plus loin, et autant de
  // fois douze mois de plus que le visiteur en demande.
  const monthCount = useMemo(() => {
    const last = visible.reduce((max, p) => (p.to > max ? p.to : max), toISO(start))
    return Math.max(config.monthsAhead + extraMonths, monthSpan(start, parseISO(last)))
  }, [visible, start, extraMonths])

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
            {load.state === 'loading' && <p className="empty-state">Chargement du calendrier…</p>}
            {load.state === 'error' && (
              <p className="empty-state">
                Le calendrier n&rsquo;a pas pu être chargé. Écrivez-nous, on vous dira de vive voix.
              </p>
            )}
            {load.state === 'ready' && (
              <>
                <Legend />
                <Calendar dayIndex={dayIndex} start={start} monthCount={monthCount} onPick={pick} />
                <div className="actions more">
                  <button
                    className="button"
                    onClick={() => setExtraMonths((months) => months + config.monthsAhead)}
                  >
                    Voir plus loin
                  </button>
                </div>
              </>
            )}
          </section>

          {load.state === 'ready' && (
            <section className="panel">
              <h2>Les périodes libres</h2>
              <OpenWindows periods={visible} start={start} selected={selected} onPick={pick} />
            </section>
          )}

          <section className="panel" id="ask">
            <RequestForm selected={selected} start={start} recipients={recipients} />
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
