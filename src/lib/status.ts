import type { HostKey, Period } from '../data/types'
import type { Lang } from './i18n'

/** Ce que le visiteur voit, une fois tout combiné. */
export type Status = 'open' | 'booked' | 'blocked'

export const HOST_KEYS: HostKey[] = ['mathis', 'julie']

/**
 * La chambre n'est proposée que si elle est libre et qu'au moins l'un de nous
 * est à la maison pour ouvrir la porte.
 */
export function guestStatus(period: Period): Status {
  if (period.room === 'booked') return 'booked'
  if (period.room === 'blocked') return 'blocked'
  return HOST_KEYS.some((key) => period.hosts[key]) ? 'open' : 'blocked'
}

export const statusLabels: Record<Lang, Record<Status, string>> = {
  fr: {
    open: 'libre',
    booked: 'déjà pris',
    blocked: 'pas disponible',
  },
  en: {
    open: 'available',
    booked: 'already taken',
    blocked: 'not available',
  },
}

/** Le tableau d'administration reste en français. */
export const statusLabel = statusLabels.fr

export const roomLabel: Record<Period['room'], string> = {
  free: 'Libre',
  booked: 'Déjà prise',
  blocked: 'Indisponible',
}
