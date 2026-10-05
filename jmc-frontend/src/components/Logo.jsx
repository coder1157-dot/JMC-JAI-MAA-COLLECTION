import { Link } from "react-router-dom";

export default function Logo({ light = false }) {
  return (
    <Link to="/" className={`jmc-logo ${light ? "light" : ""}`} aria-label="JMC – Jai Maa Collection">
      <span className="jmc-logo-mark">JMC</span>
      <span className="jmc-logo-sub">Jai Maa Collection</span>
    </Link>
  );
}
