import { useEffect, useMemo, useState } from 'react'
import type { Period } from './data/types'
import { config } from './config'
import { monthSpan, parseISO, today, toISO, upcoming } from './lib/dates'
import type { OpenWindow } from './lib/calendar'
import { buildCalendar } from './lib/calendar'
import { fetchSnapshot } from './lib/gist'
import { scrollToElement } from './lib/scroll'
import type { Lang } from './lib/i18n'
import { LangContext, detectLang, rememberLang } from './lib/i18n'
import { Admin } from './components/Admin'
import { Hero } from './components/Hero'
import { Calendar } from './components/Calendar'
import { LangSwitch } from './components/LangSwitch'
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

const TEXT = {
  fr: {
    hostedBy: 'Chez',
    whenFree: 'Quand l’appartement est libre',
    loading: 'Chargement du calendrier…',
    loadError: 'Le calendrier n’a pas pu être chargé. Écrivez-nous, on vous dira de vive voix.',
    more: 'Voir plus loin',
    freePeriods: 'Les périodes libres',
    goodToKnow: 'Bon à savoir',
    bye: 'À très vite.',
  },
  en: {
    hostedBy: 'Hosted by',
    whenFree: 'When the apartment is free',
    loading: 'Loading the calendar…',
    loadError: 'The calendar couldn’t be loaded. Write to us and we’ll tell you directly.',
    more: 'See further ahead',
    freePeriods: 'Free periods',
    goodToKnow: 'Good to know',
    bye: 'See you soon.',
  },
}

/**
 * La langue du visiteur. Seul un choix fait avec le bouton est retenu d'une
 * visite à l'autre : la langue devinée du navigateur, elle, se redevine.
 */
function useLangState(): [Lang, (lang: Lang) => void] {
  const [lang, setLang] = useState<Lang>(detectLang)
  const choose = (next: Lang) => {
    rememberLang(next)
    setLang(next)
  }
  return [lang, choose]
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
  const [visitorLang, setLang] = useLangState()
  // Le tableau d'administration reste en français, quel que soit le choix.
  const lang: Lang = isAdmin ? 'fr' : visitorLang
  const t = TEXT[lang]
  const load = useCalendar()
  const start = useMemo(() => today(), [])
  const periods = load.state === 'ready' ? load.periods : []
  const recipients = load.state === 'ready' ? load.recipients : []
  const visible = useMemo(() => upcoming(periods, start), [periods, start])
  const [selected, setSelected] = useState<OpenWindow | null>(null)
  const [extraMonths, setExtraMonths] = useState(0)

  // Une année devant soi, davantage si des dates vont plus loin, et autant de
  // fois douze mois de plus que le visiteur en demande.
  const monthCount = useMemo(() => {
    const last = visible.reduce((max, p) => (p.to > max ? p.to : max), toISO(start))
    return Math.max(config.monthsAhead + extraMonths, monthSpan(start, parseISO(last)))
  }, [visible, start, extraMonths])

  // Le calendrier est libre par défaut : les périodes saisies sont les
  // exceptions, et les créneaux libres se déduisent de ce qu'elles laissent.
  const view = useMemo(() => buildCalendar(visible, start, monthCount), [visible, start, monthCount])

  function pick(window: OpenWindow) {
    setSelected(window)
    scrollToElement('ask')
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LangContext.Provider value={lang}>
    <div className={isAdmin ? 'page wide' : 'page'}>
      {isAdmin ? (
        <header className="hero hero-plain">
          <div className="hero-text">
            <p className="eyebrow">{config.location.fr}</p>
            <h1>{config.siteName}</h1>
            <p className="tagline">Tableau de bord</p>
          </div>
        </header>
      ) : (
        <Hero corner={<LangSwitch onChange={setLang} />}>
          <p className="tagline">{config.tagline[lang]}</p>
          <p className="hosts">
            {t.hostedBy} {config.hosts[lang]}
          </p>
        </Hero>
      )}

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
            <h2>{t.whenFree}</h2>
            {load.state === 'loading' && <p className="empty-state">{t.loading}</p>}
            {load.state === 'error' && <p className="empty-state">{t.loadError}</p>}
            {load.state === 'ready' && (
              <>
                <Legend />
                <Calendar view={view} start={start} monthCount={monthCount} onPick={pick} />
                <div className="actions more">
                  <button
                    className="button"
                    onClick={() => setExtraMonths((months) => months + config.monthsAhead)}
                  >
                    {t.more}
                  </button>
                </div>
              </>
            )}
          </section>

          {load.state === 'ready' && (
            <section className="panel">
              <h2>{t.freePeriods}</h2>
              <OpenWindows
                windows={view.windows}
                start={start}
                selected={selected}
                onPick={pick}
              />
            </section>
          )}

          <section className="panel" id="ask">
            <RequestForm selected={selected} start={start} recipients={recipients} />
          </section>

          <section className="panel">
            <h2>{t.goodToKnow}</h2>
            <dl className="info">
              {config.practicalInfo.map((item) => (
                <div key={item.title.fr}>
                  <dt>{item.title[lang]}</dt>
                  <dd>{item.body[lang]}</dd>
                </div>
              ))}
            </dl>
          </section>
        </main>
      )}

      <footer>
        <p>{t.bye}</p>
      </footer>
    </div>
    </LangContext.Provider>
  )
}
