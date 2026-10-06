import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCustomerType } from "../context/CustomerTypeContext";
import { formatMoney } from "../utils/format";
import PriceOnEnquiry from "./PriceOnEnquiry";

/**
 * Indian mode        → "Price available on enquiry" (as before)
 * International mode → the price the backend returned (already in the chosen currency)
 */
export default function PriceTag({ product, large = false }) {
  const { isInternational, currency } = useCustomerType();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isInternational) return <PriceOnEnquiry text="Price available on enquiry" large={large} />;

  if (typeof product.price === "number") {
    const code = product.currency || currency;
    const hasCompare = typeof product.compareAtPrice === "number" && product.compareAtPrice > product.price;
    return (
      <div className={`price-row ${large ? "big" : ""}`}>
        <span className="price">{formatMoney(product.price, code)}</span>
        {hasCompare && <span className="compare">{formatMoney(product.compareAtPrice, code)}</span>}
      </div>
    );
  }

  // The backend only reveals prices to signed-in International customers.
  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        state={{ from: location.pathname + location.search, notice: "Please sign in to view prices and shop as an International client." }}
        className={`price-signin ${large ? "large" : ""}`}
      >
        Sign in to view price
      </Link>
    );
  }
  return <PriceOnEnquiry text="Price available on enquiry" large={large} />;
}
