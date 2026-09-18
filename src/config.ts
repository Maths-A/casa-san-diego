/**
 * Tout ce que tu auras envie de changer se trouve dans ce fichier.
 */
export const config = {
  /** Affiché dans l'onglet du navigateur et en haut de la page. */
  siteName: 'Casa San Diego',

  /** Qui reçoit, tel qu'affiché en haut de la page. */
  hosts: 'les Doudous',

  /** Les prénoms utilisés dans le tableau d'administration. */
  hostNames: {
    mathis: 'Mathis',
    julie: 'Julie',
  },

  /** La phrase d'accueil, sous le titre. */
  tagline: 'Disponibilités de notre appartement',

  /** Ville ou quartier. Garde l'adresse exacte en dehors d'une page publique. */
  location: 'San Diego, Californie',

  /**
   * Le Gist secret qui contient le calendrier. C'est la seule source de
   * vérité : la page des visiteurs le lit à chaque chargement, et le tableau
   * d'administration l'écrit. Son contenu est lisible par qui connaît cet
   * identifiant, donc on n'y met rien de confidentiel.
   */
  gistId: '4647b5e666be422544905df483333b88',
  gistFile: 'availability.json',

  /**
   * Nombre de mois affichés d'emblée. Le calendrier va de toute façon jusqu'à
   * la dernière date saisie si elle est plus lointaine, et un bouton en ajoute
   * autant à chaque clic : l'avenir n'a pas de fin, la page si.
   */
  monthsAhead: 12,

  /** Les encarts « Bon à savoir ». Modifie-les librement. */
  practicalInfo: [
    {
      title: 'L’appartement',
      body: 'Un canapé lit est disponible + deux matelas gonflable de 2 places.',
    },
    {
      title: 'Pour venir',
      body: 'L’aéroport de San Diego (SAN) est à 15 minutes. Vol direct depuis Amsterdam, Londres et Munich. Vol direct possible jusqu’à Los Angles.',
    },
    {
      title: 'Activités',
      body: 'Surf, Plage, Randonnées',
    },
    {
      title: 'Non autorisé',
      body: 'Les problèmes',
    },
  ],

} as const
