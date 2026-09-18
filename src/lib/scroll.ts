/**
 * Amène un élément en haut de l'écran.
 *
 * `scrollIntoView({ behavior: 'smooth' })` ne fait rien dans certains
 * navigateurs, et le clic qui déclenche le défilement donne aussi le focus au
 * bouton, ce qui annule l'animation. On anime donc nous-mêmes, image par image.
 */
export function scrollToElement(id: string, offset = 12): void {
  const el = document.getElementById(id)
  if (!el) return

  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  const target = Math.max(0, Math.min(window.scrollY + el.getBoundingClientRect().top - offset, maxScroll))
  const from = window.scrollY
  const distance = target - from
  if (Math.abs(distance) < 2) return

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, target)
    return
  }

  const duration = Math.min(600, 220 + Math.abs(distance) * 0.35)
  const startedAt = performance.now()

  function step(now: number) {
    const progress = Math.min(1, (now - startedAt) / duration)
    const eased = 1 - Math.pow(1 - progress, 3)
    window.scrollTo(0, from + distance * eased)
    if (progress < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}
