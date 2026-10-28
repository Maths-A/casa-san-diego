import { createContext, useContext } from 'react'

/**
 * La page des visiteurs parle français ou anglais. Le tableau d'administration,
 * lui, reste en français : il n'est lu que par nous.
 */
export type Lang = 'fr' | 'en'

export const LANGS: Lang[] = ['fr', 'en']

const STORAGE_KEY = 'casa-lang'

/** Pour Intl : les dates et les mois s'écrivent dans la langue choisie. */
export function localeOf(lang: Lang): string {
  return lang === 'en' ? 'en-US' : 'fr-FR'
}

/**
 * Le choix déjà fait par le visiteur, sinon un ?lang= dans l'adresse, sinon la
 * la langue de son navigateur : français s'il est en français, anglais sinon,
 * l'anglais étant plus sûr pour un ami allemand ou espagnol.
 */
export function detectLang(): Lang {
  try {
    const param = new URLSearchParams(window.location.search).get('lang')
    if (param === 'fr' || param === 'en') return param
  } catch {
    // Pas d'adresse lisible : on passe à la suite.
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'fr' || saved === 'en') return saved
  } catch {
    // Stockage bloqué (navigation privée) : on passe à la suite.
  }
  const browser = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase()
  if (!browser) return 'fr'
  return browser.startsWith('fr') ? 'fr' : 'en'
}

export function rememberLang(lang: Lang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Tant pis : le choix vaudra pour cette visite seulement.
  }
}

/** Un texte dans les deux langues. */
export type Bilingual = Record<Lang, string>

export const LangContext = createContext<Lang>('fr')

export function useLang(): Lang {
  return useContext(LangContext)
}
