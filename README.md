# Casa San Diego

Une page unique qui montre les nuits où notre chambre d'amis est libre, et qui
permet aux amis de demander ces dates.

En ligne sur **https://maths-a.github.io/casa-san-diego/**

## Où sont les données

Dans un **Gist secret**, pas dans ce dépôt. La page des visiteurs le lit à
chaque chargement, sans jeton, et le tableau d'administration l'écrit. Une
modification est donc visible en une minute environ, sans reconstruire le site.

Son identifiant est dans `gistId`, côté `src/config.ts`. Le dépôt ne contient
aucune date : il ne contient que le code.

Deux choses à savoir :

- Qui connaît cet identifiant peut lire le Gist, puisque la page le lit sans
  s'authentifier. N'y écrivez rien de confidentiel.
- GitHub limite les lectures anonymes à soixante par heure et par adresse IP.
  C'est large pour un site de famille, mais c'est la limite.

## Le tableau d'administration

Ajoutez `#admin` à l'adresse : <https://maths-a.github.io/casa-san-diego/#admin>.

Une ligne par période, avec une case pour Mathis et une pour Julie. La chambre
n'est proposée aux visiteurs que si elle est libre **et** qu'au moins l'un de
nous deux est à la maison.

Vos modifications restent dans le navigateur qui les a faites jusqu'à ce que
vous cliquiez sur **Publier**, qui écrit le Gist. **Recharger depuis le Gist**
fait l'inverse et jette le brouillon local.

`#admin` n'est pas une protection : c'est une adresse que les visiteurs n'ont
aucune raison de taper. Ce qui protège l'écriture, c'est le jeton.

## Le jeton

À créer une fois, sur
<https://github.com/settings/personal-access-tokens/new> :

- un jeton **fine grained**, sur votre compte,
- avec la seule permission **Account permissions → Gists : Read and write**,
- avec une date d'expiration qui vous va.

Collez-le dans le champ prévu du tableau d'administration. Il est rangé dans le
stockage local de ce navigateur, jamais dans le site ni dans le dépôt, donc
aucun visiteur ne le voit. Faites-le sur vos appareils, pas sur un ordinateur
partagé. S'il fuite, le dégât se limite à vos Gists : révoquez-le sur la même
page et créez-en un autre.

## Le format stocké

```json
{
  "updatedAt": "2026-09-18T22:00:00.000Z",
  "periods": [
    { "from": "2026-12-04", "to": "2026-12-18", "hosts": { "mathis": true, "julie": false }, "room": "free" }
  ]
}
```

- `from` est la première nuit passée ici.
- `to` est la dernière nuit passée ici ; le départ a lieu le lendemain matin.
- Pour une seule nuit, mettez deux fois la même date.
- `hosts` dit qui est à la maison sur ces dates.
- `room` vaut `'free'`, `'booked'` ou `'blocked'`.
- `note` ajoute une petite ligne sur la carte, par exemple `"Ana et Tom"`.

Le site relit ce fichier sans rien croire sur parole : une entrée mal formée est
ignorée plutôt que d'abîmer la page. Le calendrier affiche tous les mois jusqu'à
la dernière date saisie, sans limite, et les dates passées disparaissent seules.

## Changer les textes

`src/config.ts` contient le titre, la phrase d'accueil, les prénoms, le nombre
minimum de mois affichés et les encarts « Bon à savoir ». Un changement de texte
passe par un `git push`, contrairement aux dates.

`contactEmail` est vide exprès : le bouton copie alors la demande dans le
presse-papiers au lieu d'ouvrir un e-mail. Mettez une adresse si vous préférez
recevoir des e-mails, en sachant qu'une page publique attire les spams.

## Lancer le site en local

```sh
npm install
npm run dev     # http://localhost:5173
npm run build   # écrit dans dist/
```

Un `git push` sur `main` reconstruit et redéploie le site par GitHub Actions.

## Passer à un nom de domaine

Construisez avec `BASE_PATH=/` et ajoutez un fichier `CNAME` dans `public/`.
