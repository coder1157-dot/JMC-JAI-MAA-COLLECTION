import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container section text-center">
      <div className="state-ornament">◆</div>
      <h1 className="display">Page not found</h1>
      <p>The page you are looking for doesn’t exist.</p>
      <Link to="/" className="btn-jmc btn-jmc-primary">
        Back to Home
      </Link>
    </div>
  );
}
