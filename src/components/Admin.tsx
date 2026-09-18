import { useEffect, useMemo, useState } from 'react'
import type { HostKey, Period, RoomState } from '../data/types'
import { periods as filePeriods } from '../data/availability'
import { config } from '../config'
import { addDays, formatRange, nights, parseISO, toISO, today } from '../lib/dates'
import { HOST_KEYS, guestStatus, roomLabel, statusLabel } from '../lib/status'
import { toFileSource } from '../lib/serialize'

const DRAFT_KEY = 'casa-san-diego:brouillon'
const ROOM_STATES: RoomState[] = ['free', 'booked', 'blocked']

/** Le brouillon local, s'il y en a un et qu'il est lisible. */
function loadDraft(): Period[] | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Period[]) : null
  } catch {
    // Stockage refusé (navigation privée) ou brouillon abîmé : on repart du fichier.
    return null
  }
}

/** Les paires de périodes qui se chevauchent, pour prévenir avant l'export. */
function overlaps(periods: Period[]): [number, number][] {
  const found: [number, number][] = []
  for (let i = 0; i < periods.length; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      const a = periods[i]
      const b = periods[j]
      if (a.from <= b.to && b.from <= a.to) found.push([i, j])
    }
  }
  return found
}

export function Admin() {
  const [rows, setRows] = useState<Period[]>(() => loadDraft() ?? filePeriods)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(rows))
    } catch {
      // Rien à faire : le tableau reste utilisable, il ne survivra juste pas au rechargement.
    }
  }, [rows])

  const start = useMemo(() => today(), [])
  const source = useMemo(() => toFileSource(rows), [rows])
  const clashes = useMemo(() => overlaps(rows), [rows])
  const dirty = source !== toFileSource(filePeriods)

  function patch(index: number, change: Partial<Period>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...change } : row)))
    setCopied(false)
  }

  function setHost(index: number, host: HostKey, value: boolean) {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, hosts: { ...row.hosts, [host]: value } } : row)),
    )
    setCopied(false)
  }

  function addRow() {
    const last = rows.length > 0 ? rows[rows.length - 1].to : null
    const from = last ? toISO(addDays(parseISO(last), 2)) : toISO(start)
    setRows((current) => [
      ...current,
      { from, to: toISO(addDays(parseISO(from), 2)), hosts: { mathis: true, julie: true }, room: 'free' },
    ])
    setCopied(false)
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index))
    setCopied(false)
  }

  async function copySource() {
    try {
      await navigator.clipboard.writeText(source)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([source], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'availability.ts'
    link.click()
    URL.revokeObjectURL(url)
  }

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
                        onClick={() => removeRow(index)}
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
          <button className="button" onClick={() => setRows(filePeriods)} disabled={!dirty}>
            Repartir du fichier
          </button>
        </div>

        {clashes.length > 0 && (
          <p className="warn">
            Deux périodes se chevauchent. La dernière l&rsquo;emporte sur le calendrier, autant les
            fusionner.
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Mettre le site à jour</h2>
        <p className="request-lead">
          Le site est un fichier du dépôt, pas une base de données. Vos modifications restent dans ce
          navigateur jusqu&rsquo;à ce que vous colliez le texte ci-dessous dans{' '}
          <code>src/data/availability.ts</code>, puis que vous poussiez sur <code>main</code>.
        </p>

        <pre className="preview source">{source}</pre>

        <div className="actions">
          <button className="button primary" onClick={copySource}>
            {copied ? 'Copié' : 'Copier le fichier'}
          </button>
          <button className="button" onClick={download}>
            Télécharger availability.ts
          </button>
        </div>
        <p className="hint">
          {dirty
            ? 'Le brouillon diffère du fichier en ligne.'
            : 'Le brouillon est identique au fichier en ligne.'}
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
