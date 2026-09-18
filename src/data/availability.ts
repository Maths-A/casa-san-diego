/**
 * The one file to edit when your plans change.
 *
 * Each entry covers a run of nights:
 *   from = the first night someone sleeps here
 *   to   = the last night someone sleeps here (they leave the next morning)
 * A single night is written with the same date twice.
 *
 * status:
 *   'open'    - free, guests can ask for it
 *   'booked'  - someone is already coming
 *   'blocked' - we are away, or we just need the room
 *
 * Past entries are hidden automatically, so you can leave them here or delete
 * them, whichever you prefer.
 */
export type Status = 'open' | 'booked' | 'blocked'

export interface Period {
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
  status: Status
  /** Optional line shown on the card, e.g. 'Ana & Tom' or 'we are in France'. */
  note?: string
}

export const periods: Period[] = [
  { from: '2026-10-02', to: '2026-10-11', status: 'open' },
  { from: '2026-10-16', to: '2026-10-18', status: 'booked', note: 'family' },
  { from: '2026-10-23', to: '2026-11-08', status: 'open' },
  { from: '2026-11-20', to: '2026-11-29', status: 'blocked', note: 'we are away for Thanksgiving' },
  { from: '2026-12-04', to: '2026-12-18', status: 'open' },
  { from: '2026-12-19', to: '2027-01-03', status: 'blocked', note: 'holidays in France' },
  { from: '2027-01-08', to: '2027-01-31', status: 'open' },
  { from: '2027-02-05', to: '2027-02-21', status: 'open' },
  { from: '2027-03-05', to: '2027-03-28', status: 'open' },
]
