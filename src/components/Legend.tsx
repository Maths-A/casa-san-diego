export function Legend() {
  return (
    <ul className="legend">
      <li>
        <span className="swatch open" /> Libre
      </li>
      <li>
        <span className="swatch booked" /> Occupe
      </li>
      <li>
        <span className="swatch blocked" /> Absents
      </li>
    </ul>
  )
}
