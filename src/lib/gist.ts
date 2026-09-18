import type { HostKey, Period, RoomState } from '../data/types'
import { config } from '../config'

const API = 'https://api.github.com/gists'
const RAW = 'https://gist.githubusercontent.com'
const ROOMS: RoomState[] = ['free', 'booked', 'blocked']
const HOSTS: HostKey[] = ['mathis', 'julie']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const NOTE_MAX = 120

export interface Snapshot {
  periods: Period[]
  /** Qui reçoit les demandes par e-mail. Le premier est le destinataire. */
  recipients: string[]
  /** Quand le Gist a été publié pour la dernière fois, si on le sait. */
  updatedAt: string | null
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/** FormSubmit rend un alias qui remplace l'adresse, pour ne pas l'exposer. */
const ALIAS = /^[a-z0-9]{16,64}$/i
const MAX_RECIPIENTS = 5

export function isRecipient(value: string): boolean {
  const trimmed = value.trim()
  return EMAIL.test(trimmed) || ALIAS.test(trimmed)
}

function readRecipients(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(isRecipient)
    .slice(0, MAX_RECIPIENTS)
}

/**
 * Le contenu du Gist vient du réseau : on ne fait confiance à rien et on
 * reconstruit chaque période à partir de zéro, en jetant ce qui ne tient pas.
 */
function readPeriod(raw: unknown): Period | null {
  if (typeof raw !== 'object' || raw === null) return null
  const entry = raw as Record<string, unknown>

  const from = typeof entry.from === 'string' && ISO_DATE.test(entry.from) ? entry.from : null
  const to = typeof entry.to === 'string' && ISO_DATE.test(entry.to) ? entry.to : null
  if (!from || !to || to < from) return null

  const rawHosts = (typeof entry.hosts === 'object' && entry.hosts !== null ? entry.hosts : {}) as Record<
    string,
    unknown
  >
  const hosts = Object.fromEntries(HOSTS.map((key) => [key, rawHosts[key] === true])) as Record<
    HostKey,
    boolean
  >

  const room = ROOMS.find((state) => state === entry.room) ?? 'free'
  const note =
    typeof entry.note === 'string' && entry.note.trim()
      ? entry.note.replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX)
      : undefined

  return note ? { from, to, hosts, room, note } : { from, to, hosts, room }
}

function readSnapshot(text: string): Snapshot {
  const parsed: unknown = JSON.parse(text)
  const body = Array.isArray(parsed) ? { periods: parsed } : parsed
  if (typeof body !== 'object' || body === null) {
    return { periods: [], recipients: [], updatedAt: null }
  }

  const { periods, recipients, updatedAt } = body as {
    periods?: unknown
    recipients?: unknown
    updatedAt?: unknown
  }
  return {
    periods: (Array.isArray(periods) ? periods : [])
      .map(readPeriod)
      .filter((period): period is Period => period !== null)
      .sort((a, b) => a.from.localeCompare(b.from)),
    recipients: readRecipients(recipients),
    updatedAt: typeof updatedAt === 'string' ? updatedAt : null,
  }
}

/**
 * Une empreinte des périodes seules, pour comparer un brouillon à ce qui est
 * publié. Le contenu écrit porte un horodatage, qui change à chaque appel et
 * ne peut donc pas servir de comparaison.
 */
export function periodsKey(periods: Period[]): string {
  return JSON.stringify(
    [...periods]
      .sort((a, b) => a.from.localeCompare(b.from))
      .map((p) => [p.from, p.to, p.hosts.mathis, p.hosts.julie, p.room, p.note?.trim() ?? '']),
  )
}

function writeSnapshot(periods: Period[], recipients: string[]): string {
  const body = {
    updatedAt: new Date().toISOString(),
    recipients: recipients.map((entry) => entry.trim()).filter(isRecipient).slice(0, MAX_RECIPIENTS),
    periods: [...periods].sort((a, b) => a.from.localeCompare(b.from)),
  }
  return `${JSON.stringify(body, null, 2)}\n`
}

/** Un message en français plutôt qu'un code HTTP nu. */
async function explain(response: Response): Promise<Error> {
  if (response.status === 401) return new Error('Jeton refusé : vérifiez qu’il est bien copié.')
  if (response.status === 404) {
    return new Error('Gist introuvable : vérifiez son identifiant, et que le jeton peut y accéder.')
  }
  if (response.status === 403) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    return new Error(
      remaining === '0'
        ? 'GitHub limite les appels depuis ce réseau. Réessayez dans une heure.'
        : 'GitHub a refusé l’accès : il manque sans doute la permission « Gists ».',
    )
  }
  return new Error(`GitHub a répondu ${response.status}.`)
}

function headers(token?: string): HeadersInit {
  const base: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) base.Authorization = `Bearer ${token}`
  return base
}

function fileContent(payload: unknown, fileName: string): string {
  const files = (payload as { files?: Record<string, { content?: string }> }).files ?? {}
  const file = files[fileName] ?? Object.values(files)[0]
  if (!file || typeof file.content !== 'string') {
    throw new Error(`Le Gist ne contient pas de fichier ${fileName}.`)
  }
  return file.content
}

/**
 * Par l'API : toujours à jour, mais GitHub n'accorde que soixante appels par
 * heure et par adresse IP à qui n'est pas authentifié.
 */
async function fetchByApi(gistId: string, token?: string): Promise<Snapshot> {
  const response = await fetch(`${API}/${gistId}`, { headers: headers(token), cache: 'no-store' })
  if (!response.ok) throw await explain(response)
  return readSnapshot(fileContent(await response.json(), config.gistFile))
}

/**
 * Par l'adresse directe du fichier : sans quota, mais servi par un cache de
 * cinq minutes. C'est le chemin des visiteurs.
 *
 * Le paramètre change à chaque minute : le cache ne peut donc pas servir une
 * version de plus d'une minute, tout en restant utile aux visiteurs qui se
 * suivent pendant cette minute-là.
 */
async function fetchByRawUrl(gistId: string): Promise<Snapshot> {
  const minute = Math.floor(Date.now() / 60_000)
  const url = `${RAW}/${config.gistOwner}/${gistId}/raw/${config.gistFile}?t=${minute}`
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw await explain(response)
  return readSnapshot(await response.text())
}

export interface ReadOptions {
  /** Passer par l'API d'abord, pour ne pas travailler sur une version périmée. */
  fresh?: boolean
  token?: string
}

/**
 * Lecture publique, par deux chemins indépendants : si l'un est épuisé ou en
 * panne, l'autre répond. Le calendrier ne disparaît pas pour si peu.
 */
export async function fetchSnapshot(gistId: string, options: ReadOptions = {}): Promise<Snapshot> {
  const paths = options.fresh
    ? [() => fetchByApi(gistId, options.token), () => fetchByRawUrl(gistId)]
    : [() => fetchByRawUrl(gistId), () => fetchByApi(gistId, options.token)]

  let last: unknown
  for (const read of paths) {
    try {
      return await read()
    } catch (error) {
      last = error
    }
  }
  throw last instanceof Error ? last : new Error('Le calendrier est introuvable.')
}

export async function saveSnapshot(
  gistId: string,
  token: string,
  periods: Period[],
  recipients: string[],
): Promise<Snapshot> {
  const response = await fetch(`${API}/${gistId}`, {
    method: 'PATCH',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: { [config.gistFile]: { content: writeSnapshot(periods, recipients) } },
    }),
  })
  if (!response.ok) throw await explain(response)
  return readSnapshot(fileContent(await response.json(), config.gistFile))
}
