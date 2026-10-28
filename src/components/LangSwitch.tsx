import type { Lang } from '../lib/i18n'
import { LANGS, useLang } from '../lib/i18n'

const NAMES: Record<Lang, string> = { fr: 'Français', en: 'English' }
const GROUP_LABEL: Record<Lang, string> = { fr: 'Langue', en: 'Language' }

/** FR | EN, en haut à droite du décor. */
export function LangSwitch({ onChange }: { onChange: (lang: Lang) => void }) {
  const current = useLang()
  return (
    <div className="lang-switch" role="group" aria-label={GROUP_LABEL[current]}>
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          className={lang === current ? 'active' : ''}
          aria-pressed={lang === current}
          title={NAMES[lang]}
          onClick={() => onChange(lang)}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
