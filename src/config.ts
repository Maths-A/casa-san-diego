/**
 * Tout ce que tu auras envie de changer se trouve dans ce fichier.
 *
 * Les textes montrés aux visiteurs existent en deux langues : `fr` et `en`.
 * Quand tu changes l'un, pense à changer l'autre.
 */
export const config = {
  /** Affiché dans l'onglet du navigateur et en haut de la page. */
  siteName: 'Casa San Diego',

  /** Qui reçoit, tel qu'affiché en haut de la page, après « Chez » / « Hosted by ». */
  hosts: {
    fr: 'les Doudous',
    en: 'the Doudous',
  },

  /** Les prénoms utilisés dans le tableau d'administration. */
  hostNames: {
    mathis: 'Mathis',
    julie: 'Julie',
  },

  /** La phrase d'accueil, sous le titre. */
  tagline: {
    fr: 'Disponibilités de notre appartement',
    en: 'When our apartment is free',
  },

  /** Ville ou quartier. Garde l'adresse exacte en dehors d'une page publique. */
  location: {
    fr: 'San Diego, Californie',
    en: 'San Diego, California',
  },

  /**
   * Le Gist secret qui contient le calendrier. C'est la seule source de
   * vérité : la page des visiteurs le lit à chaque chargement, et le tableau
   * d'administration l'écrit. Son contenu est lisible par qui connaît cet
   * identifiant, donc on n'y met rien de confidentiel.
   */
  gistId: '4647b5e666be422544905df483333b88',
  gistFile: 'availability.json',
  /** Le compte qui possède le Gist, nécessaire pour l'adresse de lecture directe. */
  gistOwner: 'Maths-A',

  /**
   * Nombre de mois affichés d'emblée. Le calendrier va de toute façon jusqu'à
   * la dernière date saisie si elle est plus lointaine, et un bouton en ajoute
   * autant à chaque clic : l'avenir n'a pas de fin, la page si.
   */
  monthsAhead: 12,

  /** Les encarts « Bon à savoir ». Modifie-les librement. */
  practicalInfo: [
    {
      title: { fr: 'L’appartement', en: 'The apartment' },
      body: {
        fr: 'Un canapé lit est disponible + deux matelas gonflables de 2 places.',
        en: 'There’s a sofa bed, plus two double air mattresses.',
      },
    },
    {
      title: { fr: 'Pour venir', en: 'Getting here' },
      body: {
        fr: 'L’aéroport de San Diego (SAN) est à 15 minutes. Vol direct depuis Amsterdam, Londres et Munich. Vol direct possible jusqu’à Los Angeles.',
        en: 'San Diego airport (SAN) is 15 minutes away. Direct flights from Amsterdam, London and Munich. You can also fly direct to Los Angeles.',
      },
    },
    {
      title: { fr: 'Activités', en: 'Things to do' },
      body: { fr: 'Surf, Plage, Randonnées', en: 'Surfing, beach, hiking' },
    },
    {
      title: { fr: 'Non autorisé', en: 'Not allowed' },
      body: { fr: 'Les problèmes', en: 'Trouble' },
    },
  ],

} as const
