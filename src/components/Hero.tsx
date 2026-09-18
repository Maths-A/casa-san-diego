import type { ReactNode } from 'react'
import { config } from '../config'

/**
 * Le décor est dessiné, pas photographié : rien à héberger, aucune licence à
 * respecter, quelques lignes de SVG.
 *
 * Il est monté en couches plutôt qu'en une seule image : le ciel et le soleil
 * sont posés en CSS, la mer et la plage forment une bande en bas. Une image
 * unique, elle, se serait fait rogner n'importe comment selon la largeur de
 * l'écran, emportant le soleil ou les palmiers.
 */

/** Une vague qui se répète, assez large pour défiler sans raccord. */
function wavePath(y: number, amplitude: number, wavelength = 140, width = 1700): string {
  let d = `M -280 ${y}`
  for (let x = -280; x < width; x += wavelength) {
    const q = wavelength / 4
    const half = wavelength / 2
    d += ` q ${q} ${-amplitude} ${half} 0 q ${q} ${amplitude} ${half} 0`
  }
  return `${d} L ${width} 320 L -280 320 Z`
}

/** Les palmes retombent : on les fait pousser vers le haut, puis pencher. */
const FROND_ANGLES = [-158, -124, -92, -58, -24, 12, 44]

function Palm({ x, y, scale = 1, delay = 0 }: { x: number; y: number; scale?: number; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Un tronc qui s'affine en montant, et penche vers la mer */}
      <path className="palm-trunk" d="M -9 0 C -4 -62 4 -124 9 -170 L 23 -168 C 20 -120 13 -60 9 0 Z" />
      <g transform="translate(16 -169)">
        <g className="palm-crown" style={{ animationDelay: `${delay}s` }}>
          {FROND_ANGLES.map((angle) => (
            <path
              key={angle}
              className="palm-frond"
              transform={`rotate(${angle})`}
              d="M0 0 C 28 -12 58 -18 88 -6 C 62 0 34 12 2 10 Z"
            />
          ))}
          <circle className="palm-nuts" cx="-2" cy="5" r="5" />
          <circle className="palm-nuts" cx="9" cy="8" r="4" />
        </g>
      </g>
    </g>
  )
}

function Gull({ x, y, scale = 1, delay = 0 }: { x: number; y: number; scale?: number; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path className="gull" style={{ animationDelay: `${delay}s` }} d="M0 0 q 9 -8 18 0 q 9 -8 18 0" />
    </g>
  )
}

export function Hero({ children }: { children?: ReactNode }) {
  return (
    <header className="hero">
      <div className="hero-sun" aria-hidden="true" />

      <div className="hero-scene" aria-hidden="true">
        <svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax slice" role="presentation">
          <defs>
            <linearGradient id="mer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--sea-1)" />
              <stop offset="100%" stopColor="var(--sea-2)" />
            </linearGradient>
          </defs>

          <g transform="translate(0 120)">
          <Gull x={470} y={40} scale={1} />
          <Gull x={600} y={22} scale={0.72} delay={-9} />

          {/* Point Loma, au loin */}
          <path
            className="coast"
            d="M -20 92 C 90 74 180 68 286 80 C 366 89 420 93 500 95 L 500 108 L -20 108 Z"
          />

          <rect x="-20" y="96" width="1240" height="150" fill="url(#mer)" />
          <ellipse className="glint" cx="1046" cy="150" rx="86" ry="11" />

          <g className="wave wave-back">
            <path d={wavePath(116, 7)} />
          </g>
          <g className="wave wave-mid">
            <path d={wavePath(144, 10)} />
          </g>
          <g className="wave wave-front">
            <path d={wavePath(176, 13)} />
          </g>

          {/* La jetée, comme celle d'Ocean Beach */}
          <g className="pier">
            <path d="M 232 122 L 596 122 L 596 130 L 232 130 Z" />
            {[248, 306, 364, 422, 480, 538, 586].map((x) => (
              <rect key={x} x={x} y="128" width="6" height="36" rx="2" />
            ))}
          </g>

          <g className="sand">
            <path d="M -20 250 C 260 234 520 256 780 244 C 960 235 1080 249 1220 240 L 1220 300 L -20 300 Z" />
          </g>

          <Palm x={806} y={300} scale={0.82} />
          <Palm x={890} y={306} scale={0.6} delay={-2.4} />
          <Palm x={306} y={302} scale={0.5} delay={-1.2} />
          </g>
        </svg>
      </div>

      <div className="hero-text">
        <p className="eyebrow">{config.location}</p>
        <h1>{config.siteName}</h1>
        {children}
      </div>
    </header>
  )
}
