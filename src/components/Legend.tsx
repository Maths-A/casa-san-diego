import { config } from '../config'
import { useLang } from '../lib/i18n'

const { mathis, julie } = config.hostNames

const TEXT = {
  fr: {
    open: 'Libre',
    mathis: `Seul ${mathis} est là`,
    julie: `Seule ${julie} est là`,
    booked: 'Occupé',
    blocked: 'Absents',
  },
  en: {
    open: 'Available',
    mathis: `Only ${mathis} is home`,
    julie: `Only ${julie} is home`,
    booked: 'Taken',
    blocked: 'Away',
  },
}

export function Legend() {
  const t = TEXT[useLang()]
  return (
    <ul className="legend">
      <li>
        <span className="swatch open" /> {t.open}
      </li>
      <li>
        <span className="swatch solo-mathis" /> {t.mathis}
      </li>
      <li>
        <span className="swatch solo-julie" /> {t.julie}
      </li>
      <li>
        <span className="swatch booked" /> {t.booked}
      </li>
      <li>
        <span className="swatch blocked" /> {t.blocked}
      </li>
    </ul>
  )
}
