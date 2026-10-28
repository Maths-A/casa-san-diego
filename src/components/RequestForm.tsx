import { useEffect, useMemo, useState } from 'react'
import type { OpenWindow } from '../lib/calendar'
import { addDays, formatDay, parseISO, toISO } from '../lib/dates'
import { useLang } from '../lib/i18n'
import { MailError, sendRequest } from '../lib/mail'

const TEXT = {
  fr: {
    dates: (from: string, to: string) => `du ${from} au ${to}`,
    hello: (name: string) => (name ? `Bonjour, c’est ${name}.` : 'Bonjour !'),
    come: (dates: string) => (dates ? `On aimerait venir ${dates}.` : 'On aimerait venir vous voir.'),
    people: (n: string) => `On serait ${n}.`,
    sendFailed: 'L’envoi a échoué.',
    sentTitle: 'C’est parti',
    sentLead:
      'Votre demande nous est arrivée. On vous répond vite. Rien n’est réservé tant qu’on n’a pas répondu.',
    again: 'Demander d’autres dates',
    title: 'Demander des dates',
    leadSelected: 'Ajustez les dates si vous ne venez qu’une partie du temps.',
    leadEmpty: 'Choisissez des dates libres au calendrier, ou remplissez vous-même.',
    name: 'Votre nom',
    namePlaceholder: 'Ana et Tom',
    howMany: 'Vous êtes combien',
    arrive: 'Arrivée',
    leave: 'Départ',
    note: 'Ce qu’on devrait savoir',
    notePlaceholder: 'bla bla bla.',
    trap: 'Laissez ce champ vide',
    outOfOrder: 'Le départ doit venir après l’arrivée.',
    outside: 'Ces dates dépassent la période libre. Demandez quand même, c’est peut-être jouable.',
    sending: 'Un instant…',
    send: 'Envoyer la demande',
    copy: 'Copier la demande',
    copied:
      'Votre demande est dans le presse-papiers : envoyez-la nous par message, elle ne sera pas perdue.',
    copyHint: 'Le bouton copie votre demande, à nous envoyer par message.',
    failed: 'Écrivez-nous directement en nous donnant vos dates, on s’en occupe.',
  },
  en: {
    dates: (from: string, to: string) => `from ${from} to ${to}`,
    hello: (name: string) => (name ? `Hi, it’s ${name}.` : 'Hi!'),
    come: (dates: string) => (dates ? `We’d love to come ${dates}.` : 'We’d love to come and visit.'),
    people: (n: string) => (n === '1' ? 'It would be just me.' : `There would be ${n} of us.`),
    sendFailed: 'Sending failed.',
    sentTitle: 'On its way',
    sentLead:
      'Your request reached us. We’ll get back to you soon. Nothing is booked until we’ve replied.',
    again: 'Ask for other dates',
    title: 'Ask for dates',
    leadSelected: 'Adjust the dates if you’re only coming for part of that time.',
    leadEmpty: 'Pick free dates on the calendar, or fill them in yourself.',
    name: 'Your name',
    namePlaceholder: 'Ana and Tom',
    howMany: 'How many of you',
    arrive: 'Arrival',
    leave: 'Departure',
    note: 'Anything we should know',
    notePlaceholder: 'blah blah blah.',
    trap: 'Leave this field empty',
    outOfOrder: 'Departure has to come after arrival.',
    outside: 'These dates go beyond the free period. Ask anyway, it might work out.',
    sending: 'One moment…',
    send: 'Send the request',
    copy: 'Copy the request',
    copied: 'Your request is on your clipboard: send it to us by message, it won’t get lost.',
    copyHint: 'The button copies your request, for you to send us by message.',
    failed: 'Write to us directly with your dates, we’ll take care of it.',
  },
}

interface Props {
  selected: OpenWindow | null
  start: Date
  /** Qui reçoit la demande. Vide : on se rabat sur le presse-papiers. */
  recipients: string[]
}

type Sending = 'idle' | 'sending' | 'sent' | 'copied' | 'failed'

export function RequestForm({ selected, start, recipients }: Props) {
  const lang = useLang()
  const t = TEXT[lang]
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
    arrive && leave ? t.dates(formatDay(arrive, start, lang), formatDay(leave, start, lang)) : ''

  const message = useMemo(() => {
    const lines = [t.hello(name.trim()), t.come(dates), t.people(people)]
    if (note.trim()) lines.push(note.trim())
    return lines.join('\n')
  }, [t, name, people, dates, note])

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
      setState((await copy()) ? 'copied' : 'failed')
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
      }, lang)
      setState('sent')
    } catch (error) {
      setProblem(error instanceof MailError ? error.message : t.sendFailed)
      setState((await copy()) ? 'copied' : 'failed')
    }
  }

  if (state === 'sent') {
    return (
      <div className="request">
        <h2>{t.sentTitle}</h2>
        <p className="request-lead">{t.sentLead}</p>
        <div className="actions">
          <button className="button" onClick={() => setState('idle')}>
            {t.again}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="request">
      <h2>{t.title}</h2>
      <p className="request-lead">{selected ? t.leadSelected : t.leadEmpty}</p>

      <div className="fields">
        <label>
          {t.name}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} />
        </label>
        <label>
          {t.howMany}
          <input
            type="number"
            min="1"
            max="10"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
          />
        </label>
        <label>
          {t.arrive}
          <input type="date" value={arrive} onChange={(e) => setArrive(e.target.value)} />
        </label>
        <label>
          {t.leave}
          <input type="date" value={leave} onChange={(e) => setLeave(e.target.value)} />
        </label>
        <label className="wide">
          {t.note}
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.notePlaceholder}
          />
        </label>
        <label className="trap" aria-hidden="true">
          {t.trap}
          <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </label>
      </div>

      {datesOutOfOrder && <p className="warn">{t.outOfOrder}</p>}
      {!datesOutOfOrder && outsideWindow && <p className="warn">{t.outside}</p>}

      <div className="actions">
        <button
          className="button primary"
          onClick={submit}
          disabled={state === 'sending' || datesOutOfOrder}
        >
          {state === 'sending' ? t.sending : recipients.length > 0 ? t.send : t.copy}
        </button>
      </div>

      {problem && <p className="warn">{problem}</p>}
      {state === 'copied' && (
        <p className="hint">{t.copied}</p>
      )}
      {recipients.length === 0 && state === 'idle' && (
        <p className="hint">{t.copyHint}</p>
      )}
      {state === 'failed' && (
        <p className="hint">{t.failed}</p>
      )}
    </div>
  )
}
