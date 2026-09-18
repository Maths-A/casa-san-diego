import type { HostKey, Period, RoomState } from '../data/types'
import { config } from '../config'

const API = 'https://api.github.com/gists'
const ROOMS: RoomState[] = ['free', 'booked', 'blocked']
const HOSTS: HostKey[] = ['mathis', 'julie']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const NOTE_MAX = 120

export interface Snapshot {
  periods: Period[]
  /** Quand le Gist a été publié pour la dernière fois, si on le sait. */
  updatedAt: string | null
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

export function readSnapshot(text: string): Snapshot {
  const parsed: unknown = JSON.parse(text)
  const body = Array.isArray(parsed) ? { periods: parsed, updatedAt: null } : parsed
  if (typeof body !== 'object' || body === null) return { periods: [], updatedAt: null }

  const { periods, updatedAt } = body as { periods?: unknown; updatedAt?: unknown }
  return {
    periods: (Array.isArray(periods) ? periods : [])
      .map(readPeriod)
      .filter((period): period is Period => period !== null)
      .sort((a, b) => a.from.localeCompare(b.from)),
    updatedAt: typeof updatedAt === 'string' ? updatedAt : null,
  }
}

export function writeSnapshot(periods: Period[]): string {
  const body = {
    updatedAt: new Date().toISOString(),
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

/** Lecture publique : c'est ce que fait la page des visiteurs. */
export async function fetchSnapshot(gistId: string, token?: string): Promise<Snapshot> {
  const response = await fetch(`${API}/${gistId}`, { headers: headers(token), cache: 'no-store' })
  if (!response.ok) throw await explain(response)
  return readSnapshot(fileContent(await response.json(), config.gistFile))
}

export async function saveSnapshot(gistId: string, token: string, periods: Period[]): Promise<Snapshot> {
  const response = await fetch(`${API}/${gistId}`, {
    method: 'PATCH',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: { [config.gistFile]: { content: writeSnapshot(periods) } } }),
  })
  if (!response.ok) throw await explain(response)
  return readSnapshot(fileContent(await response.json(), config.gistFile))
}

/** Crée le Gist secret la première fois, et rend son identifiant. */
export async function createGist(token: string, periods: Period[]): Promise<string> {
  const response = await fetch(API, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Casa San Diego : le calendrier de la chambre d’amis',
      public: false,
      files: { [config.gistFile]: { content: writeSnapshot(periods) } },
    }),
  })
  if (!response.ok) throw await explain(response)
  const id = (await response.json()).id
  if (typeof id !== 'string') throw new Error('GitHub n’a pas renvoyé d’identifiant de Gist.')
  return id
}
