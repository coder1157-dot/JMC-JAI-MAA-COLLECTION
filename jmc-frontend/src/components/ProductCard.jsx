import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { productImage } from "../utils/format";
import useShopActions from "../hooks/useShopActions";
import { useCustomerType } from "../context/CustomerTypeContext";
import WhatsAppEnquiryButton from "./WhatsAppEnquiryButton";
import PriceTag from "./PriceTag";

export default function ProductCard({ product }) {
  const { addToCart, buyNow, toggleWishlist, inWishlist } = useShopActions();
  const { isInternational } = useCustomerType();
  const wished = inWishlist(product.id);
  const to = `/product/${product.slug || product.id}`;
  const crumb = [product.categoryName, product.subcategory].filter(Boolean).join(" · ");
  const soldOut = product.stock <= 0;
  // International visitors get the shopping buttons; guests are asked to sign in when they use them.
  const shopping = isInternational;

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
        <PriceTag product={product} />
        {shopping ? (
          <div className="product-card-actions">
            <button className="btn-jmc btn-jmc-outline btn-sm-jmc" disabled={soldOut} onClick={() => addToCart(product)}>
              {soldOut ? "Sold Out" : "Add to Cart"}
            </button>
            <button className="btn-jmc btn-jmc-primary btn-sm-jmc" disabled={soldOut} onClick={() => buyNow(product)}>
              Buy Now
            </button>
            <Link to={to} className="btn-jmc btn-jmc-ghost-dark btn-sm-jmc product-card-details">
              Details
            </Link>
          </div>
        ) : (
          <div className="product-card-actions single">
            <WhatsAppEnquiryButton product={product} className="w-100" />
            <Link to={to} className="btn-jmc btn-jmc-outline btn-sm-jmc w-100">
              Details
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
