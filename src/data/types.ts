/** Les deux personnes qui reçoivent. */
export type HostKey = 'mathis' | 'julie'

/** L'état de la chambre, indépendamment de qui est à la maison. */
export type RoomState = 'free' | 'booked' | 'blocked'

/**
 * Une suite de nuits :
 *   from = la première nuit passée ici
 *   to   = la dernière nuit passée ici (le départ a lieu le lendemain matin)
 * Pour une seule nuit, mettez deux fois la même date.
 */
export interface Period {
  from: string // AAAA-MM-JJ
  to: string // AAAA-MM-JJ
  /** Qui est à la maison sur ces dates. */
  hosts: Record<HostKey, boolean>
  /** 'free' si la chambre est disponible, sinon déjà prise ou indisponible. */
  room: RoomState
  /** Petite note affichée sur la carte, par exemple 'Ana et Tom'. */
  note?: string
}
