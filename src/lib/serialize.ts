import type { Period } from '../data/types'

const HEADER = `import type { Period } from './types'

/**
 * Le calendrier. Modifiez-le à la main, ou depuis la page d'administration
 * (ajoutez #admin à l'adresse du site), qui sait réécrire ce fichier pour vous.
 *
 * Les dates passées disparaissent toutes seules du site.
 */
export const periods: Period[] = `

/** Une note tient sur une ligne et ne doit pas casser la chaîne de caractères. */
function quote(text: string): string {
  return `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\s+/g, ' ').trim()}'`
}

function line(period: Period): string {
  const hosts = `{ mathis: ${period.hosts.mathis}, julie: ${period.hosts.julie} }`
  const note = period.note?.trim() ? `, note: ${quote(period.note)}` : ''
  return `  { from: '${period.from}', to: '${period.to}', hosts: ${hosts}, room: '${period.room}'${note} },`
}

/** Le contenu exact de src/data/availability.ts pour ces périodes. */
export function toFileSource(periods: Period[]): string {
  if (periods.length === 0) return `${HEADER}[]\n`
  const sorted = [...periods].sort((a, b) => a.from.localeCompare(b.from))
  return `${HEADER}[\n${sorted.map(line).join('\n')}\n]\n`
}
