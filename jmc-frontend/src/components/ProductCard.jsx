import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { productImage } from "../utils/format";
import { CART_ENABLED } from "../utils/constants";
import useShopActions from "../hooks/useShopActions";
import WhatsAppEnquiryButton from "./WhatsAppEnquiryButton";
import PriceOnEnquiry from "./PriceOnEnquiry";

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, inWishlist } = useShopActions();
  const wished = inWishlist(product.id);
  const to = `/product/${product.slug || product.id}`;
  const crumb = [product.categoryName, product.subcategory].filter(Boolean).join(" · ");

  return (
    <article className="product-card">
      <div className="product-card-media">
        <Link to={to} aria-label={product.name}>
          <img src={productImage(product)} alt={product.images?.[0]?.alt || product.name} loading="lazy" />
        </Link>
        {product.newArrival && <span className="badge-jmc">New</span>}
        <button
          className={`wish-btn ${wished ? "active" : ""}`}
          onClick={() => toggleWishlist(product)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          {wished ? <FaHeart /> : <FaRegHeart />}
        </button>
      </div>
      <div className="product-card-body">
        <div className="product-card-cat">{crumb}</div>
        <h3 className="product-card-name">
          <Link to={to}>{product.name}</Link>
        </h3>
        {product.sku && <div className="product-card-sku">SKU: {product.sku}</div>}
        <PriceOnEnquiry />
        <div className="product-card-actions single">
          <WhatsAppEnquiryButton product={product} className="w-100" />
          <Link to={to} className="btn-jmc btn-jmc-outline btn-sm-jmc w-100">
            Details
          </Link>
          {CART_ENABLED && (
            <button className="btn-jmc btn-jmc-primary btn-sm-jmc w-100" disabled={product.stock <= 0} onClick={() => addToCart(product)}>
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
