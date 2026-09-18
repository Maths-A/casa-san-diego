import { useEffect, useMemo, useRef, useState } from 'react'
import type { HostKey, Period, RoomState } from '../data/types'
import { config } from '../config'
import { addDays, formatRange, nights, parseISO, toISO, today } from '../lib/dates'
import { HOST_KEYS, guestStatus, roomLabel, statusLabel } from '../lib/status'
import { fetchSnapshot, isRecipient, periodsKey, saveSnapshot } from '../lib/gist'
import { MailError, sendRequest } from '../lib/mail'

const DRAFT_KEY = 'casa-san-diego:brouillon'
const TOKEN_KEY = 'casa-san-diego:jeton'
const GIST_KEY = 'casa-san-diego:gist'
const RECIPIENTS_KEY = 'casa-san-diego:destinataires'
const MAX_RECIPIENTS = 5
const ROOM_STATES: RoomState[] = ['free', 'booked', 'blocked']

/** Le stockage du navigateur peut être refusé : aucune lecture ne doit casser la page. */
function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocal(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Tant pis : le tableau reste utilisable, il ne survivra pas au rechargement.
  }
}

function loadDraft(): Period[] | null {
  const raw = readLocal(DRAFT_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Period[]) : null
  } catch {
    return null
  }
}

/** Les paires de périodes qui se chevauchent, pour prévenir avant de publier. */
function overlaps(periods: Period[]): [number, number][] {
  const found: [number, number][] = []
  for (let i = 0; i < periods.length; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      if (periods[i].from <= periods[j].to && periods[j].from <= periods[i].to) found.push([i, j])
    }
  }
  return found
}

export function Admin() {
  const [rows, setRows] = useState<Period[]>(() => loadDraft() ?? [])
  // Retenu au montage : l'effet qui sauvegarde le brouillon écrit dès le
  // premier rendu, donc plus tard on ne saurait plus distinguer un vrai
  // brouillon d'un tableau vide qui vient d'être enregistré.
  // Le premier chargement du Gist arrive après quelques centaines de
  // millisecondes : il ne doit pas écraser ce qui a été saisi entre-temps.
  const touched = useRef(false)
  const [hadDraft] = useState(() => loadDraft() !== null || readLocal(RECIPIENTS_KEY) !== null)
  const [recipients, setRecipients] = useState<string[]>(() => {
    const raw = readLocal(RECIPIENTS_KEY)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((e): e is string => typeof e === 'string') : []
    } catch {
      return []
    }
  })
  const [published, setPublished] = useState<Period[] | null>(null)
  const [publishedRecipients, setPublishedRecipients] = useState<string[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [gistId, setGistId] = useState<string>(() => config.gistId || readLocal(GIST_KEY) || '')
  const [token, setToken] = useState<string>(() => readLocal(TOKEN_KEY) ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  // Le panneau des adresses a son propre retour, sous le bouton qui le produit.
  const [mailMessage, setMailMessage] = useState<string | null>(null)
  const [mailFailed, setMailFailed] = useState(false)

  const start = useMemo(() => today(), [])
  const clashes = useMemo(() => overlaps(rows), [rows])
  const valid = useMemo(
    () => recipients.map((entry) => entry.trim()).filter(isRecipient),
    [recipients],
  )
  // Ce que voient les visiteurs, ce sont les adresses publiées, pas celles
  // saisies ici : la différence mérite d'être dite franchement.
  const mailLive = publishedRecipients.length > 0
  const mailPending = valid.join(',') !== publishedRecipients.join(',')
  const dirty =
    published === null ||
    periodsKey(rows) !== periodsKey(published) ||
    recipients.join(',') !== publishedRecipients.join(',')

  function edit<T>(update: (current: T) => T, setter: (fn: (current: T) => T) => void) {
    touched.current = true
    setter(update)
  }

  useEffect(() => writeLocal(DRAFT_KEY, JSON.stringify(rows)), [rows])
  useEffect(() => writeLocal(RECIPIENTS_KEY, JSON.stringify(recipients)), [recipients])
  useEffect(() => writeLocal(GIST_KEY, gistId), [gistId])
  useEffect(() => writeLocal(TOKEN_KEY, token), [token])

  function report(text: string, isError = false) {
    setMessage(text)
    setFailed(isError)
  }

  async function run(what: () => Promise<void>) {
    setBusy(true)
    try {
      await what()
    } catch (error) {
      report(error instanceof Error ? error.message : 'Quelque chose a échoué.', true)
    } finally {
      setBusy(false)
    }
  }

  // Au premier affichage, on montre ce que voient les visiteurs.
  useEffect(() => {
    if (!gistId) return
    let cancelled = false
    fetchSnapshot(gistId, { fresh: true, token })
      .then((snapshot) => {
        if (cancelled) return
        setPublished(snapshot.periods)
        setPublishedRecipients(snapshot.recipients)
        setUpdatedAt(snapshot.updatedAt)
        if (!hadDraft && !touched.current) {
          setRows(snapshot.periods)
          setRecipients(snapshot.recipients)
        }
        report('Calendrier chargé depuis le Gist.')
      })
      .catch((error: Error) => {
        if (!cancelled) report(error.message, true)
      })
    return () => {
      cancelled = true
    }
    // Volontairement au montage seulement : ensuite, on recharge à la demande.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reload = () =>
    run(async () => {
      const snapshot = await fetchSnapshot(gistId, { fresh: true, token })
      setPublished(snapshot.periods)
      setPublishedRecipients(snapshot.recipients)
      setRecipients(snapshot.recipients)
      setUpdatedAt(snapshot.updatedAt)
      setRows(snapshot.periods)
      report('Brouillon remplacé par ce qui est en ligne.')
    })

  const publish = () =>
    run(async () => {
      const snapshot = await saveSnapshot(gistId, token, rows, recipients)
      setPublished(snapshot.periods)
      setPublishedRecipients(snapshot.recipients)
      setRecipients(snapshot.recipients)
      setUpdatedAt(snapshot.updatedAt)
      setRows(snapshot.periods)
      report('Publié. Les visiteurs le verront d\u2019ici cinq minutes.')
    })

  const sendTest = () =>
    run(async () => {
      setMailMessage(null)
      try {
        const to = await sendRequest(valid, {
          name: 'Essai depuis le tableau de bord',
          people: '2',
          arrive: '',
          leave: '',
          note: 'Si vous lisez ceci, les demandes des visiteurs vous arriveront bien.',
          dates: '',
        })
        setMailMessage(`Essai envoyé à ${to}. Regardez votre boîte.`)
        setMailFailed(false)
      } catch (error) {
        if (error instanceof MailError) {
          setMailMessage(error.message)
          setMailFailed(true)
          return
        }
        throw error
      }
    })

  function download() {
    const backup = JSON.stringify({ recipients, periods: rows }, null, 2)
    const url = URL.createObjectURL(new Blob([backup], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = config.gistFile
    link.click()
    URL.revokeObjectURL(url)
  }

  function patch(index: number, change: Partial<Period>) {
    edit<Period[]>(
      (current) => current.map((row, i) => (i === index ? { ...row, ...change } : row)),
      setRows,
    )
  }

  function setHost(index: number, host: HostKey, value: boolean) {
    edit<Period[]>(
      (current) =>
        current.map((row, i) =>
          i === index ? { ...row, hosts: { ...row.hosts, [host]: value } } : row,
        ),
      setRows,
    )
  }

  function addRow() {
    const last = rows.length > 0 ? rows[rows.length - 1].to : null
    const from = last ? toISO(addDays(parseISO(last), 2)) : toISO(start)
    edit<Period[]>(
      (current) => [
        ...current,
        {
          from,
          to: toISO(addDays(parseISO(from), 2)),
          hosts: { mathis: true, julie: true },
          room: 'free',
        },
      ],
      setRows,
    )
  }

  const publishedAt = updatedAt
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(
        new Date(updatedAt),
      )
    : null

  return (
    <div className="admin">
      <section className="panel">
        <h2>Nos disponibilités</h2>
        <p className="request-lead">
          Tout est libre par défaut. Chaque ligne est une exception : une absence, une chambre déjà
          prise, une période qu&rsquo;on garde pour soi. Cochez qui est à la maison : sans personne,
          la chambre ne peut pas être proposée.
        </p>

        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Du</th>
                <th>Au (dernière nuit)</th>
                <th>{config.hostNames.mathis}</th>
                <th>{config.hostNames.julie}</th>
                <th>Chambre</th>
                <th>Note</th>
                <th>Ce que voit le visiteur</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const invalid = row.to < row.from
                const clashing = clashes.some(([a, b]) => a === index || b === index)
                return (
                  <tr key={index} className={invalid || clashing ? 'row-warn' : undefined}>
                    <td>
                      <input
                        type="date"
                        value={row.from}
                        onChange={(e) => patch(index, { from: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={row.to}
                        onChange={(e) => patch(index, { to: e.target.value })}
                      />
                    </td>
                    {HOST_KEYS.map((host) => (
                      <td className="tick" key={host}>
                        <input
                          type="checkbox"
                          checked={row.hosts[host]}
                          onChange={(e) => setHost(index, host, e.target.checked)}
                          aria-label={`${config.hostNames[host]} est là du ${row.from} au ${row.to}`}
                        />
                      </td>
                    ))}
                    <td>
                      <select
                        value={row.room}
                        onChange={(e) => patch(index, { room: e.target.value as RoomState })}
                      >
                        {ROOM_STATES.map((state) => (
                          <option value={state} key={state}>
                            {roomLabel[state]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        value={row.note ?? ''}
                        onChange={(e) => patch(index, { note: e.target.value })}
                        placeholder="Ana et Tom"
                      />
                    </td>
                    <td className="derived">
                      {invalid ? (
                        <span className="warn">dates à l&rsquo;envers</span>
                      ) : (
                        <>
                          <strong>{statusLabel[guestStatus(row)]}</strong>
                          <span className="window-meta">
                            {' '}
                            · {nights(row)} nuit{nights(row) === 1 ? '' : 's'}
                          </span>
                        </>
                      )}
                    </td>
                    <td>
                      <button
                        className="link-button"
                        onClick={() =>
                          edit<Period[]>((current) => current.filter((_, i) => i !== index), setRows)
                        }
                        aria-label={`Supprimer la période ${row.from} au ${row.to}`}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="derived">
                    Aucune exception : tous les mois affichés sont proposés aux visiteurs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="actions">
          <button className="button" onClick={addRow}>
            Ajouter une exception
          </button>
          <button className="button primary" onClick={publish} disabled={busy || !gistId || !token}>
            {busy ? 'En cours…' : 'Publier'}
          </button>
          <button className="button" onClick={reload} disabled={busy || !gistId}>
            Recharger depuis le Gist
          </button>
          <button className="button" onClick={download}>
            Télécharger une sauvegarde
          </button>
        </div>

        <p className={failed ? 'warn' : 'hint'}>
          {message ?? 'Rien n’est publié tant que vous ne cliquez pas sur Publier.'}
        </p>
        <p className="hint">
          {dirty ? 'Brouillon non publié.' : 'Le brouillon est identique au calendrier en ligne.'}
          {publishedAt ? ` Dernière publication : ${publishedAt}.` : ''}
        </p>

        {clashes.length > 0 && (
          <p className="warn">
            Deux périodes se chevauchent. La dernière l&rsquo;emporte sur le calendrier, autant les
            fusionner.
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Recevoir les demandes</h2>
        <p className="request-lead">
          Les adresses à qui arrivent les demandes des visiteurs. La première reçoit, les autres
          sont en copie. Sans adresse, le visiteur ne peut que copier sa demande et vous l&rsquo;envoyer
          lui-même.
        </p>

        <ul className="recipients">
          {recipients.map((entry, index) => (
            <li key={index}>
              <input
                value={entry}
                spellCheck={false}
                onChange={(e) =>
                  edit<string[]>(
                    (current) => current.map((old, i) => (i === index ? e.target.value : old)),
                    setRecipients,
                  )
                }
                placeholder={index === 0 ? 'julie@exemple.fr' : 'en copie'}
                aria-label={index === 0 ? 'Adresse principale' : `Adresse en copie ${index}`}
              />
              {entry.trim() && !isRecipient(entry) && (
                <span className="warn">adresse ou alias incomplet</span>
              )}
              <button
                className="link-button"
                onClick={() =>
                  edit<string[]>((current) => current.filter((_, i) => i !== index), setRecipients)
                }
              >
                Retirer
              </button>
            </li>
          ))}
          {recipients.length === 0 && (
            <li className="derived">Aucune adresse pour l&rsquo;instant.</li>
          )}
        </ul>

        <div className="actions">
          <button
            className="button"
            onClick={() => edit<string[]>((current) => [...current, ''], setRecipients)}
            disabled={recipients.length >= MAX_RECIPIENTS}
          >
            Ajouter une adresse
          </button>
          <button className="button" onClick={sendTest} disabled={busy || valid.length === 0}>
            Envoyer un essai
          </button>
          <button
            className="button primary"
            onClick={publish}
            disabled={busy || !gistId || !token || !dirty}
          >
            {busy ? 'En cours…' : 'Publier'}
          </button>
        </div>

        {mailPending ? (
          <p className="warn">
            {valid.length === 0
              ? 'Ces adresses ne sont pas valables : les visiteurs continueront de copier leur demande.'
              : 'Ces adresses ne sont pas encore en ligne. Tant que vous n\u2019avez pas publié, le bouton des visiteurs copie leur demande au lieu de vous l\u2019envoyer.'}
          </p>
        ) : (
          <p className="hint">
            {mailLive
              ? `En ligne : ${publishedRecipients.join(', ')} ${
                  publishedRecipients.length > 1 ? 'reçoivent' : 'reçoit'
                } les demandes des visiteurs.`
              : 'Aucune adresse en ligne : le bouton des visiteurs copie leur demande.'}
          </p>
        )}

        {mailMessage && <p className={mailFailed ? 'warn' : 'hint'}>{mailMessage}</p>}

        <p className="hint">
          La première demande envoyée à une adresse déclenche un e-mail d&rsquo;activation de
          FormSubmit. Ouvrez-le une fois, puis tout arrive directement. L&rsquo;essai ci-dessus sert
          justement à le déclencher quand vous voulez, plutôt qu&rsquo;au premier visiteur.
        </p>
        <p className="hint">
          FormSubmit vous donne aussi un alias, une suite de lettres et de chiffres qui remplace
          l&rsquo;adresse. Collez-le ici à la place : votre adresse reste alors hors du Gist, donc
          hors de portée des robots. Pensez à publier pour que les visiteurs en profitent.
        </p>
      </section>

      <section className="panel">
        <h2>Le Gist</h2>
        <p className="request-lead">
          Le calendrier est stocké dans un Gist secret, et non dans le dépôt. Le jeton reste dans ce
          navigateur, il n&rsquo;est jamais publié. N&rsquo;utilisez ce tableau que sur vos appareils.
        </p>

        <div className="fields">
          <label className="wide">
            Jeton GitHub, avec la permission Gists en écriture
            <input
              type="password"
              value={token}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setToken(e.target.value.trim())}
              placeholder="github_pat_…"
            />
          </label>
          <label className="wide">
            Identifiant du Gist
            <input
              value={gistId}
              spellCheck={false}
              onChange={(e) => setGistId(e.target.value.trim())}
              placeholder="8f2c…"
            />
          </label>
        </div>

        <p className="hint">
          Qui connaît cet identifiant peut lire le Gist, puisque la page des visiteurs le lit sans
          jeton. N&rsquo;y écrivez donc rien de confidentiel.
        </p>
      </section>

      <section className="panel">
        <h2>Ce que ça donne</h2>
        {rows.length === 0 ? (
          <p className="empty-state">
            Aucune exception : les visiteurs voient tout le calendrier comme libre.
          </p>
        ) : (
          <ul className="windows">
            {[...rows]
              .sort((a, b) => a.from.localeCompare(b.from))
              .map((row, index) => (
                <li key={index}>
                  <span className={`window preview-window ${guestStatus(row)}`}>
                    <span className="window-dates">{formatRange(row, start)}</span>
                    <span className="window-meta">
                      {statusLabel[guestStatus(row)]}
                      {' · '}
                      {HOST_KEYS.filter((host) => row.hosts[host])
                        .map((host) => config.hostNames[host])
                        .join(' et ') || 'personne à la maison'}
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  )
}
