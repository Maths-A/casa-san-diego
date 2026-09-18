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
