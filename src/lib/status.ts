import type { HostKey, Period } from '../data/types'

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

export const statusLabel: Record<Status, string> = {
  open: 'libre',
  booked: 'déjà pris',
  blocked: 'on est absents',
}

export const roomLabel: Record<Period['room'], string> = {
  free: 'Libre',
  booked: 'Déjà prise',
  blocked: 'Indisponible',
}
