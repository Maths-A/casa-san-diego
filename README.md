# Casa San Diego

Une page unique qui montre les nuits où notre chambre d'amis est libre, et qui
permet aux amis de demander ces dates. C'est un site statique : pas de base de
données, pas de serveur, le calendrier est un fichier de ce dépôt.

En ligne sur **https://maths-a.github.io/casa-san-diego/**

## Le tableau d'administration

Ajoutez `#admin` à l'adresse : <https://maths-a.github.io/casa-san-diego/#admin>.

Une ligne par période, avec deux cases à cocher, une pour Mathis et une pour
Julie. La chambre n'est proposée aux visiteurs que si elle est libre **et**
qu'au moins l'un de nous deux est à la maison.

Vos modifications restent dans le navigateur qui les a faites. Pour les mettre
en ligne, copiez le texte généré en bas de la page, remplacez tout le contenu
de `src/data/availability.ts`, puis poussez sur `main`.

```sh
git add -A && git commit -m "Nos dates de décembre" && git push
```

GitHub Actions reconstruit le site, en ligne une minute plus tard.

`#admin` n'est pas une protection : c'est juste une adresse que les visiteurs
n'ont aucune raison de taper. Le dépôt est public, tout le monde peut lire le
code. N'y mettez donc rien de confidentiel.

## Modifier le calendrier à la main

`src/data/availability.ts` est une simple liste :

```ts
{ from: '2026-12-04', to: '2026-12-18', hosts: { mathis: true, julie: false }, room: 'free' }
```

- `from` est la première nuit passée ici.
- `to` est la dernière nuit passée ici ; le départ a lieu le lendemain matin.
- Pour une seule nuit, mettez deux fois la même date.
- `hosts` dit qui est à la maison sur ces dates.
- `room` vaut `'free'`, `'booked'` (quelqu'un vient déjà) ou `'blocked'` (la
  chambre n'est pas disponible).
- `note` ajoute une petite ligne sur la carte, par exemple `note: 'Ana et Tom'`.

Le calendrier affiche tous les mois jusqu'à la dernière date saisie, sans
limite. Les dates passées disparaissent toutes seules.

## Changer les textes

`src/config.ts` contient le titre, la phrase d'accueil, les prénoms, le nombre
minimum de mois affichés et les encarts « Bon à savoir ».

`contactEmail` est vide exprès : le bouton copie alors le message dans le
presse-papiers au lieu d'ouvrir un e-mail. Mettez une adresse si vous préférez
recevoir des e-mails, en sachant qu'une page publique attire les spams.

## Lancer le site en local

```sh
npm install
npm run dev     # http://localhost:5173
npm run build   # écrit dans dist/
```

## Comment les demandes vous arrivent

Personne ne peut réserver : le site n'a volontairement aucun back-end. Un
visiteur remplit le formulaire, copie le message et vous l'envoie comme il vous
écrit d'habitude. Vous passez la période en « Déjà prise » dans le tableau
d'administration, vous poussez le fichier, c'est à jour.

## Passer à un nom de domaine

Construisez avec `BASE_PATH=/` et ajoutez un fichier `CNAME` dans `public/`.
