import { useEffect, useMemo, useState } from 'react'
import type { Period } from '../data/availability'
import { config } from '../config'
import { addDays, formatDay, parseISO, toISO } from '../lib/dates'

interface Props {
  selected: Period | null
  start: Date
}

type CopyState = 'idle' | 'copied' | 'manual'

export function RequestForm({ selected, start }: Props) {
  const [name, setName] = useState('')
  const [people, setPeople] = useState('2')
  const [arrive, setArrive] = useState('')
  const [leave, setLeave] = useState('')
  const [note, setNote] = useState('')
  const [copyState, setCopyState] = useState<CopyState>('idle')

  // Picking a window on the calendar fills the dates in, and the guest can
  // still narrow them down to part of it.
  useEffect(() => {
    if (!selected) return
    setArrive(selected.from)
    setLeave(toISO(addDays(parseISO(selected.to), 1)))
    setCopyState('idle')
  }, [selected])

  const lastNight = leave ? toISO(addDays(parseISO(leave), -1)) : ''
  const datesOutOfOrder = Boolean(arrive && leave && leave <= arrive)
  const outsideWindow = Boolean(
    selected && arrive && lastNight && (arrive < selected.from || lastNight > selected.to),
  )

  const message = useMemo(() => {
    const who = name.trim() || 'Hello'
    const lines = [
      `${who} here.`,
      arrive && leave
        ? `We would like to come from ${formatDay(arrive, start)} to ${formatDay(leave, start)}.`
        : 'We would like to come and stay.',
      `There would be ${people} of us.`,
    ]
    if (note.trim()) lines.push(note.trim())
    return lines.join('\n')
  }, [name, people, arrive, leave, note, start])

  const mailto = config.contactEmail
    ? `mailto:${config.contactEmail}?subject=${encodeURIComponent(
        `Staying with you${arrive ? ` from ${arrive}` : ''}`,
      )}&body=${encodeURIComponent(message)}`
    : null

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopyState('copied')
    } catch {
      // Clipboard access is blocked outside secure contexts and in some
      // browsers, so fall back to showing the text for a manual copy.
      setCopyState('manual')
    }
  }

  return (
    <div className="request">
      <h2>Ask for a date</h2>
      <p className="request-lead">
        {selected
          ? 'Adjust the dates if you only need part of it.'
          : 'Pick an open date on the calendar, or fill this in yourself.'}
      </p>

      <div className="fields">
        <label>
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana and Tom" />
        </label>
        <label>
          How many of you
          <input
            type="number"
            min="1"
            max="10"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
          />
        </label>
        <label>
          Arriving
          <input type="date" value={arrive} onChange={(e) => setArrive(e.target.value)} />
        </label>
        <label>
          Leaving
          <input type="date" value={leave} onChange={(e) => setLeave(e.target.value)} />
        </label>
        <label className="wide">
          Anything we should know
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Landing at 9pm, and one of us is allergic to cats."
          />
        </label>
      </div>

      {datesOutOfOrder && <p className="warn">The leaving date needs to come after the arrival.</p>}
      {!datesOutOfOrder && outsideWindow && (
        <p className="warn">Those dates run past the open window. Ask anyway, we may be able to.</p>
      )}

      <pre className="preview">{message}</pre>

      <div className="actions">
        {mailto && (
          <a className="button primary" href={mailto}>
            Send it by email
          </a>
        )}
        <button className={`button${mailto ? '' : ' primary'}`} onClick={copy}>
          {copyState === 'copied' ? 'Copied' : 'Copy the message'}
        </button>
      </div>

      {copyState === 'manual' && (
        <p className="hint">Your browser blocked the clipboard. Select the text above and copy it.</p>
      )}
      <p className="hint">{config.requestNote}</p>
    </div>
  )
}
