export function Legend() {
  return (
    <ul className="legend">
      <li>
        <span className="swatch open" /> Open, ask away
      </li>
      <li>
        <span className="swatch booked" /> Already taken
      </li>
      <li>
        <span className="swatch blocked" /> We are away
      </li>
    </ul>
  )
}
