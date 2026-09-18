import { useEffect, useMemo, useState } from 'react'
import type { Period } from '../data/types'
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

  // Choisir une période au calendrier remplit les dates, que le visiteur peut
  // ensuite resserrer sur une partie seulement.
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
    const who = name.trim() ? `Bonjour, c’est ${name.trim()}.` : 'Bonjour !'
    const lines = [
      who,
      arrive && leave
        ? `On aimerait venir du ${formatDay(arrive, start)} au ${formatDay(leave, start)}.`
        : 'On aimerait venir vous voir.',
      `On serait ${people}.`,
    ]
    if (note.trim()) lines.push(note.trim())
    return lines.join('\n')
  }, [name, people, arrive, leave, note, start])

  const mailto = config.contactEmail
    ? `mailto:${config.contactEmail}?subject=${encodeURIComponent(
        `Venir chez vous${arrive ? ` à partir du ${arrive}` : ''}`,
      )}&body=${encodeURIComponent(message)}`
    : null

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopyState('copied')
    } catch {
      // Le presse-papiers est bloqué hors contexte sécurisé et dans certains
      // navigateurs : on affiche alors le texte pour une copie à la main.
      setCopyState('manual')
    }
  }

  return (
    <div className="request">
      <h2>Demander des dates</h2>
      <p className="request-lead">
        {selected
          ? 'Ajustez les dates si vous ne venez qu’une partie du temps.'
          : 'Choisissez des dates libres au calendrier, ou remplissez vous-même.'}
      </p>

      <div className="fields">
        <label>
          Votre nom
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana et Tom" />
        </label>
        <label>
          Vous êtes combien
          <input
            type="number"
            min="1"
            max="10"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
          />
        </label>
        <label>
          Arrivée
          <input type="date" value={arrive} onChange={(e) => setArrive(e.target.value)} />
        </label>
        <label>
          Départ
          <input type="date" value={leave} onChange={(e) => setLeave(e.target.value)} />
        </label>
        <label className="wide">
          Ce qu&rsquo;on devrait savoir
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="On atterrit à 21h, et l'un de nous est allergique aux chats."
          />
        </label>
      </div>

      {datesOutOfOrder && <p className="warn">Le départ doit venir après l&rsquo;arrivée.</p>}
      {!datesOutOfOrder && outsideWindow && (
        <p className="warn">
          Ces dates dépassent la période libre. Demandez quand même, c&rsquo;est peut-être jouable.
        </p>
      )}

      <pre className="preview">{message}</pre>

      <div className="actions">
        {mailto && (
          <a className="button primary" href={mailto}>
            Envoyer par e-mail
          </a>
        )}
        <button className={`button${mailto ? '' : ' primary'}`} onClick={copy}>
          {copyState === 'copied' ? 'Copié' : 'Copier le message'}
        </button>
      </div>

      {copyState === 'manual' && (
        <p className="hint">
          Votre navigateur a bloqué le presse-papiers. Sélectionnez le texte ci-dessus et copiez-le.
        </p>
      )}
      <p className="hint">{config.requestNote}</p>
    </div>
  )
}
