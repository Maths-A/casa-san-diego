# Casa San Diego

A one-page site showing which nights our guest room is free, and a way for
friends to ask for them. It is a static site, so there is no database and no
server: the calendar is a file in this repository.

Live at **https://maths-a.github.io/casa-san-diego/**

## Changing the dates

Open `src/data/availability.ts` and edit the list. Each entry covers a run of
nights:

```ts
{ from: '2026-12-04', to: '2026-12-18', status: 'open' }
```

- `from` is the first night someone sleeps here.
- `to` is the last night they sleep here; they leave the next morning.
- A single night uses the same date twice.
- `status` is `'open'`, `'booked'` or `'blocked'`, and `note` adds a short line
  on the card, e.g. `note: 'we are in France'`.

Dates in the past disappear on their own, so old entries can stay or go.

Commit and push to `main`. GitHub Actions rebuilds and the site is live in
about a minute.

```sh
git add -A && git commit -m "Book the December week" && git push
```

## Changing the text

`src/config.ts` holds the title, the tagline, the host names, how many months
of calendar to show, and the "Good to know" cards.

`contactEmail` is empty on purpose, which makes the request button copy the
message to the clipboard instead of opening an email. Put an address there if
you would rather receive email, knowing a public page attracts spam.

## Running it locally

```sh
npm install
npm run dev     # http://localhost:5173
npm run build   # writes dist/
```

## How requests reach you

Nobody can book anything: the site has no backend by design. A guest fills in
the form, copies the message and sends it to you however they normally would.
You mark the dates `booked` in `src/data/availability.ts` and push.

## Moving to a custom domain

Set `BASE_PATH=/` when building and add a `CNAME` file in `public/`.
