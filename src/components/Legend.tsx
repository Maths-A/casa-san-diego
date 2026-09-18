import { config } from '../config'

export function Legend() {
  return (
    <ul className="legend">
      <li>
        <span className="swatch open" /> Libre
      </li>
      <li>
        <span className="swatch solo-mathis" /> Seul {config.hostNames.mathis} est là
      </li>
      <li>
        <span className="swatch solo-julie" /> Seule {config.hostNames.julie} est là
      </li>
      <li>
        <span className="swatch booked" /> Occupé
      </li>
      <li>
        <span className="swatch blocked" /> Absents
      </li>
    </ul>
  )
}
