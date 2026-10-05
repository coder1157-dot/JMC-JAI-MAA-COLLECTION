import { FaWhatsapp } from "react-icons/fa";
import useWhatsApp from "../hooks/useWhatsApp";

/**
 * The single WhatsApp enquiry implementation used everywhere
 * (ProductCard, ProductDetail, RelatedProducts, Wishlist).
 * No login, no form: opens WhatsApp immediately with the product details (never a price).
 */
export default function WhatsAppEnquiryButton({ product, className = "", size = "sm", label = "Enquire on WhatsApp" }) {
  const enquire = useWhatsApp();
  const sizeClass = size === "lg" ? "btn-lg-jmc" : size === "sm" ? "btn-sm-jmc" : "";
  return (
    <button type="button" className={`btn-jmc btn-whatsapp ${sizeClass} ${className}`.trim()} onClick={() => enquire(product)}>
      <FaWhatsapp /> {label}
    </button>
  );
}
