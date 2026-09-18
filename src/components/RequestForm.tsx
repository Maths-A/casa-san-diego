import { useEffect, useMemo, useState } from 'react'
import type { OpenWindow } from '../lib/calendar'
import { addDays, formatDay, parseISO, toISO } from '../lib/dates'
import { MailError, sendRequest } from '../lib/mail'

interface Props {
  selected: OpenWindow | null
  start: Date
  /** Qui reçoit la demande. Vide : on se rabat sur le presse-papiers. */
  recipients: string[]
}

type Sending = 'idle' | 'sending' | 'sent' | 'copied' | 'failed'

export function RequestForm({ selected, start, recipients }: Props) {
  const [name, setName] = useState('')
  const [people, setPeople] = useState('2')
  const [arrive, setArrive] = useState('')
  const [leave, setLeave] = useState('')
  const [note, setNote] = useState('')
  const [trap, setTrap] = useState('')
  const [state, setState] = useState<Sending>('idle')
  const [problem, setProblem] = useState<string | null>(null)

  // Choisir une période au calendrier remplit les dates, que le visiteur peut
  // ensuite resserrer sur une partie seulement.
  useEffect(() => {
    if (!selected) return
    setArrive(selected.from)
    // Un créneau sans fin connue : proposer un départ à sept mois n'aurait
    // aucun sens, le visiteur dit lui-même jusqu'à quand il reste.
    setLeave(selected.openEnded ? '' : toISO(addDays(parseISO(selected.to), 1)))
    setState('idle')
  }, [selected])

  const lastNight = leave ? toISO(addDays(parseISO(leave), -1)) : ''
  const datesOutOfOrder = Boolean(arrive && leave && leave <= arrive)
  const outsideWindow = Boolean(
    selected &&
      arrive &&
      lastNight &&
      (arrive < selected.from || (!selected.openEnded && lastNight > selected.to)),
  )

  const dates =
    arrive && leave ? `du ${formatDay(arrive, start)} au ${formatDay(leave, start)}` : ''

  const message = useMemo(() => {
    const lines = [
      name.trim() ? `Bonjour, c’est ${name.trim()}.` : 'Bonjour !',
      dates ? `On aimerait venir ${dates}.` : 'On aimerait venir vous voir.',
      `On serait ${people}.`,
    ]
    if (note.trim()) lines.push(note.trim())
    return lines.join('\n')
  }, [name, people, dates, note])

  async function copy(): Promise<boolean> {
    try {
      // Chrome suspend l'écriture tant que la page n'a pas le focus, sans
      // jamais rejeter : sans ce délai, le bouton resterait muet pour toujours.
      await Promise.race([
        navigator.clipboard.writeText(message),
        new Promise((_, reject) => setTimeout(() => reject(new Error('délai')), 2000)),
      ])
      return true
    } catch {
      // Presse-papiers refusé ou hors délai : on le dira plutôt que de laisser
      // croire que la demande est partie.
      return false
    }
  }

  async function submit() {
    // Le piège à robots : un humain ne remplit pas un champ qu'il ne voit pas.
    if (trap) {
      setState('sent')
      return
    }
    setProblem(null)
    setState('sending')

    if (recipients.length === 0) {
      const copied = await copy()
      setProblem('Aucune adresse n’est configurée pour recevoir la demande.')
      setState(copied ? 'copied' : 'failed')
      return
    }

    try {
      await sendRequest(recipients, {
        name: name.trim(),
        people,
        arrive,
        leave,
        note: note.trim(),
        dates,
      })
      setState('sent')
    } catch (error) {
      setProblem(error instanceof MailError ? error.message : 'L’envoi a échoué.')
      setState((await copy()) ? 'copied' : 'failed')
    }
  }

  if (state === 'sent') {
    return (
      <div className="request">
        <h2>C&rsquo;est parti</h2>
        <p className="request-lead">
          Votre demande nous est arrivée. On vous répond vite. Rien n&rsquo;est réservé tant
          qu&rsquo;on n&rsquo;a pas répondu.
        </p>
        <div className="actions">
          <button className="button" onClick={() => setState('idle')}>
            Demander d&rsquo;autres dates
          </button>
        </div>
      </div>
    )
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
        <label className="trap" aria-hidden="true">
          Laissez ce champ vide
          <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </label>
      </div>

      {datesOutOfOrder && <p className="warn">Le départ doit venir après l&rsquo;arrivée.</p>}
      {!datesOutOfOrder && outsideWindow && (
        <p className="warn">
          Ces dates dépassent la période libre. Demandez quand même, c&rsquo;est peut-être jouable.
        </p>
      )}

      <div className="actions">
        <button
          className="button primary"
          onClick={submit}
          disabled={state === 'sending' || datesOutOfOrder}
        >
          {state === 'sending' ? 'Envoi…' : 'Envoyer la demande'}
        </button>
      </div>

      {problem && <p className="warn">{problem}</p>}
      {state === 'copied' && (
        <p className="hint">
          Votre demande est dans le presse-papiers : envoyez-la nous par message, elle ne sera pas
          perdue.
        </p>
      )}
      {state === 'failed' && (
        <p className="hint">
          Écrivez-nous directement en nous donnant vos dates, on s&rsquo;en occupe.
        </p>
      )}
      {recipients.length > 0 && state === 'idle' && (
        <p className="hint">Votre demande nous arrive par e-mail, via le service FormSubmit.</p>
      )}
    </div>
  )
}
