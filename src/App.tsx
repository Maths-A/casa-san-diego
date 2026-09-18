import { useMemo, useState } from 'react'
import type { Period } from './data/availability'
import { periods } from './data/availability'
import { config } from './config'
import { buildDayIndex, today, upcoming } from './lib/dates'
import { Calendar } from './components/Calendar'
import { Legend } from './components/Legend'
import { OpenWindows } from './components/OpenWindows'
import { RequestForm } from './components/RequestForm'

export default function App() {
  const start = useMemo(() => today(), [])
  const visible = useMemo(() => upcoming(periods, start), [start])
  const dayIndex = useMemo(() => buildDayIndex(visible), [visible])
  const [selected, setSelected] = useState<Period | null>(null)

  function pick(period: Period) {
    setSelected(period)
    // Deferred by a frame: the click also focuses the button, and the focus
    // scroll Chrome performs cancels a smooth scroll started in the same tick.
    requestAnimationFrame(() => {
      document.getElementById('ask')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">{config.location}</p>
        <h1>{config.siteName}</h1>
        <p className="tagline">{config.tagline}</p>
        <p className="hosts">Hosted by {config.hosts}</p>
      </header>

      <main>
        <section className="panel">
          <h2>When the room is free</h2>
          <Legend />
          <Calendar
            dayIndex={dayIndex}
            start={start}
            monthCount={config.monthsToShow}
            onPick={pick}
          />
        </section>

        <section className="panel">
          <h2>Open stretches</h2>
          <OpenWindows periods={visible} start={start} selected={selected} onPick={pick} />
        </section>

        <section className="panel" id="ask">
          <RequestForm selected={selected} start={start} />
        </section>

        <section className="panel">
          <h2>Good to know</h2>
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

      <footer>
        <p>See you soon.</p>
      </footer>
    </div>
  )
}
