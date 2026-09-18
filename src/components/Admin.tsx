import { useEffect, useMemo, useState } from 'react'
import type { HostKey, Period, RoomState } from '../data/types'
import { config } from '../config'
import { addDays, formatRange, nights, parseISO, toISO, today } from '../lib/dates'
import { HOST_KEYS, guestStatus, roomLabel, statusLabel } from '../lib/status'
import { createGist, fetchSnapshot, periodsKey, saveSnapshot, writeSnapshot } from '../lib/gist'

const DRAFT_KEY = 'casa-san-diego:brouillon'
const TOKEN_KEY = 'casa-san-diego:jeton'
const GIST_KEY = 'casa-san-diego:gist'
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
  const [hadDraft] = useState(() => loadDraft() !== null)
  const [published, setPublished] = useState<Period[] | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [gistId, setGistId] = useState<string>(() => config.gistId || readLocal(GIST_KEY) || '')
  const [token, setToken] = useState<string>(() => readLocal(TOKEN_KEY) ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const start = useMemo(() => today(), [])
  const clashes = useMemo(() => overlaps(rows), [rows])
  const dirty = published === null || periodsKey(rows) !== periodsKey(published)

  useEffect(() => writeLocal(DRAFT_KEY, JSON.stringify(rows)), [rows])
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
    fetchSnapshot(gistId)
      .then((snapshot) => {
        if (cancelled) return
        setPublished(snapshot.periods)
        setUpdatedAt(snapshot.updatedAt)
        if (!hadDraft) setRows(snapshot.periods)
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
      const snapshot = await fetchSnapshot(gistId)
      setPublished(snapshot.periods)
      setUpdatedAt(snapshot.updatedAt)
      setRows(snapshot.periods)
      report('Brouillon remplacé par ce qui est en ligne.')
    })

  const publish = () =>
    run(async () => {
      const snapshot = await saveSnapshot(gistId, token, rows)
      setPublished(snapshot.periods)
      setUpdatedAt(snapshot.updatedAt)
      setRows(snapshot.periods)
      report('Publié. Les visiteurs le voient dès maintenant.')
    })

  const create = () =>
    run(async () => {
      const id = await createGist(token, rows)
      setGistId(id)
      setPublished(rows)
      report(`Gist créé. Collez ${id} dans gistId, côté src/config.ts, puis poussez une fois.`)
    })

  function download() {
    const url = URL.createObjectURL(new Blob([writeSnapshot(rows)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = config.gistFile
    link.click()
    URL.revokeObjectURL(url)
  }

  function patch(index: number, change: Partial<Period>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...change } : row)))
  }

  function setHost(index: number, host: HostKey, value: boolean) {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, hosts: { ...row.hosts, [host]: value } } : row)),
    )
  }

  function addRow() {
    const last = rows.length > 0 ? rows[rows.length - 1].to : null
    const from = last ? toISO(addDays(parseISO(last), 2)) : toISO(start)
    setRows((current) => [
      ...current,
      { from, to: toISO(addDays(parseISO(from), 2)), hosts: { mathis: true, julie: true }, room: 'free' },
    ])
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
          Une ligne par période. Cochez qui est à la maison : la chambre n&rsquo;est proposée que si
          elle est libre et que l&rsquo;un de vous deux est là.
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
                        onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
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
                    Aucune période pour l&rsquo;instant. Ajoutez la première ci-dessous.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="actions">
          <button className="button" onClick={addRow}>
            Ajouter une période
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

        {!config.gistId && (
          <div className="actions">
            <button className="button" onClick={create} disabled={busy || !token || Boolean(gistId)}>
              Créer le Gist
            </button>
          </div>
        )}

        <p className="hint">
          Qui connaît cet identifiant peut lire le Gist, puisque la page des visiteurs le lit sans
          jeton. N&rsquo;y écrivez donc rien de confidentiel.
        </p>
      </section>

      <section className="panel">
        <h2>Ce que ça donne</h2>
        {rows.length === 0 ? (
          <p className="empty-state">Rien à montrer tant qu&rsquo;aucune période n&rsquo;est saisie.</p>
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
