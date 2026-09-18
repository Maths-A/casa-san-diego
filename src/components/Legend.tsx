export function Legend() {
  return (
    <ul className="legend">
      <li>
        <span className="swatch open" /> Libre, demandez
      </li>
      <li>
        <span className="swatch booked" /> Déjà pris
      </li>
      <li>
        <span className="swatch blocked" /> On est absents
      </li>
    </ul>
  )
}
