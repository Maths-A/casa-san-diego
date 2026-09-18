/**
 * L'envoi des demandes par e-mail.
 *
 * Le site est statique : il n'a pas de serveur pour poster du courrier. On
 * passe donc par FormSubmit, qui transforme un POST en e-mail. Aucun compte à
 * créer : la première demande envoyée à une adresse déclenche un e-mail
 * d'activation, qu'il faut ouvrir une fois.
 */

const ENDPOINT = 'https://formsubmit.co/ajax'

export interface Request {
  name: string
  email: string
  people: string
  arrive: string
  leave: string
  note: string
  /** Texte lisible des dates, tel qu'affiché sur le site. */
  dates: string
}

export class MailError extends Error {}

/**
 * FormSubmit répond toujours 200 : c'est le champ `success` qui dit si le
 * courrier est parti, et le message explique quoi faire quand ce n'est pas le cas.
 */
function check(payload: unknown): void {
  const body = (payload ?? {}) as { success?: unknown; message?: unknown }
  if (String(body.success) === 'true') return
  const message = typeof body.message === 'string' ? body.message : ''
  if (/activation/i.test(message)) {
    throw new MailError(
      'Cette adresse doit encore être activée : ouvrez l’e-mail d’activation de FormSubmit, puis réessayez.',
    )
  }
  throw new MailError(message || 'Le service d’envoi a refusé la demande.')
}

/**
 * Envoie la demande au premier destinataire, les autres en copie.
 * Rend l'adresse utilisée, pour pouvoir le dire à l'écran.
 */
export async function sendRequest(recipients: string[], request: Request): Promise<string> {
  const [first, ...others] = recipients
  if (!first) throw new MailError('Aucune adresse n’est configurée pour recevoir les demandes.')

  const body: Record<string, string> = {
    Nom: request.name || 'Sans nom',
    Personnes: request.people,
    Dates: request.dates,
    Arrivée: request.arrive,
    Départ: request.leave,
    Message: request.note || '—',
    _subject: `Demande de séjour${request.dates ? ` : ${request.dates}` : ''}`,
    _captcha: 'false',
    _template: 'table',
  }
  if (request.email) body._replyto = request.email
  if (others.length > 0) body._cc = others.join(',')

  let response: Response
  try {
    response = await fetch(`${ENDPOINT}/${encodeURIComponent(first)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new MailError('Le service d’envoi est injoignable. Vérifiez votre connexion.')
  }

  if (!response.ok) throw new MailError(`Le service d’envoi a répondu ${response.status}.`)
  check(await response.json().catch(() => null))
  return first
}
