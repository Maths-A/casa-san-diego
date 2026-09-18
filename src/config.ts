/**
 * Tout ce que tu auras envie de changer se trouve dans ce fichier.
 */
export const config = {
  /** Affiché dans l'onglet du navigateur et en haut de la page. */
  siteName: 'Casa San Diego',

  /** Qui reçoit, tel qu'affiché en haut de la page. */
  hosts: 'Mathis et Julie',

  /** Les prénoms utilisés dans le tableau d'administration. */
  hostNames: {
    mathis: 'Mathis',
    julie: 'Julie',
  },

  /** La phrase d'accueil, sous le titre. */
  tagline: 'On s’installe à San Diego. Venez nous voir.',

  /** Ville ou quartier. Garde l'adresse exacte en dehors d'une page publique. */
  location: 'San Diego, Californie',

  /**
   * Optionnel. Si tu mets une adresse ici, le bouton ouvre un e-mail déjà
   * rempli. Laisse la chaîne vide pour proposer plutôt une copie du message,
   * ce qui évite d'exposer ton adresse sur une page publique.
   */
  contactEmail: '',

  /**
   * Le calendrier va jusqu'à la dernière date saisie, sans limite. Ce nombre
   * n'est qu'un plancher, pour que la page ne soit pas vide au démarrage.
   */
  minMonths: 3,

  /** Les encarts « Bon à savoir ». Modifie-les librement. */
  practicalInfo: [
    {
      title: 'La chambre',
      body: 'Une chambre pour vous seuls, lit double, serviettes propres et un ventilateur. La salle de bain est partagée avec nous.',
    },
    {
      title: 'Pour venir',
      body: 'L’aéroport de San Diego (SAN) est à vingt minutes. Dites-nous votre vol, on vient vous chercher.',
    },
    {
      title: 'Arrivées et départs',
      body: 'Arrivée à partir de 16h, départ avant 11h le dernier jour. Dites-le nous s’il vous faut autre chose.',
    },
    {
      title: 'À la maison',
      body: 'On enlève les chaussures en entrant, on travaille jusqu’à 18h en semaine, et le café est à vous.',
    },
  ],

} as const
