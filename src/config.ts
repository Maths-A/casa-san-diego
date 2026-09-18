/**
 * Everything you are likely to want to change lives in this file.
 */
export const config = {
  /** Shown in the browser tab and at the top of the page. */
  siteName: 'Casa San Diego',

  /** Who is hosting. Add your wife's name here, e.g. 'Mathis & Claire'. */
  hosts: 'Mathis',

  /** One-line welcome under the title. */
  tagline: 'We moved to San Diego. Come stay with us.',

  /** Neighbourhood / city line. Keep the exact address off a public page. */
  location: 'San Diego, California',

  /**
   * Optional. If set, the request button opens a pre-filled email.
   * Leave it as an empty string to show a copy-to-clipboard message instead,
   * which keeps your address off a public page.
   */
  contactEmail: '',

  /** How many months of calendar to show. */
  monthsToShow: 8,

  /** Shown in the "Good to know" section. Edit freely. */
  practicalInfo: [
    {
      title: 'The guest room',
      body: 'A private room with a queen bed, clean towels and a fan. The bathroom is shared with us.',
    },
    {
      title: 'Getting here',
      body: 'San Diego International (SAN) is about 20 minutes away. Tell us your flight and we will pick you up.',
    },
    {
      title: 'Arrivals and departures',
      body: 'Arrive any time after 4pm, leave by 11am on your last day. Ask if you need something different.',
    },
    {
      title: 'House habits',
      body: 'No shoes inside, we are usually working until 6pm on weekdays, and the coffee is yours to take.',
    },
  ],

  /** Shown at the bottom of the request panel. */
  requestNote:
    'Nothing is booked until we reply. Two separate requests for the same dates go in the order they reach us.',
} as const
