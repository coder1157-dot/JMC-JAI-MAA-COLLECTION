import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { FiMinus, FiPlus } from "react-icons/fi";
import { getProductById, getProductBySlug } from "../api/products";
import useAsync from "../hooks/useAsync";
import useShopActions from "../hooks/useShopActions";
import useWhatsApp from "../hooks/useWhatsApp";
import PageLoader from "../components/PageLoader";
import ErrorState from "../components/ErrorState";
import WhatsAppEnquiryButton from "../components/WhatsAppEnquiryButton";
import PriceTag from "../components/PriceTag";
import { useCustomerType } from "../context/CustomerTypeContext";
import RelatedProducts from "../components/RelatedProducts";
import { isObjectId, productImage, stockLabel } from "../utils/format";

function WhatsAppLink({ product }) {
  const enquire = useWhatsApp();
  return (
    <button type="button" className="link-btn" onClick={() => enquire(product)}>
      Chat with us on WhatsApp
    </button>
  );
}

function Gallery({ product }) {
  const imgs = product.images?.length ? product.images : [null];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(null);
  const src = imgs[active]?.url || productImage(product);

  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="gallery">
      <div className="gallery-main" onMouseMove={move} onMouseLeave={() => setZoom(null)}>
        <img
          src={src}
          alt={imgs[active]?.alt || product.name}
          style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
      </div>
      {imgs.length > 1 && (
        <div className="gallery-thumbs">
          {imgs.map((im, i) => (
            <button key={i} className={i === active ? "active" : ""} onClick={() => setActive(i)} aria-label={`Image ${i + 1}`}>
              <img src={im.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { isInternational, viewKey } = useCustomerType();
  const { data, loading, error, reload } = useAsync(
    () => (isObjectId(id) ? getProductById(id) : getProductBySlug(id)),
    [id, viewKey]
  );
  const { addToCart, buyNow, toggleWishlist, inWishlist } = useShopActions();
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [id]);

  if (loading) return <PageLoader />;
  if (error)
    return (
      <div className="container section">
        <ErrorState message={error} onRetry={reload} />
        <div className="text-center mt-3">
          <Link to="/" className="btn-jmc btn-jmc-outline">Back to Home</Link>
        </div>
      </div>
    );

  const p = data.data.product;
  const stock = stockLabel(p.stock);
  const wished = inWishlist(p.id);
  const maxQty = Math.max(1, Math.min(p.stock || 1, 100));
  const soldOut = p.stock <= 0;
  const specs = [
    ["SKU", p.sku],
    ["Material", p.material],
    ["Purity", p.purity],
    ["Stone", p.stone],
    ["Category", p.categoryName],
    ["Subcategory", p.subcategory],
    ["International shipping", p.internationalShipping ? "Available" : "Not available"],
  ].filter(([, v]) => v);

  return (
    <>
    <section className="section pt-4">
      <div className="container">
        <nav className="crumbs">
          <Link to="/">Home</Link> / <Link to={`/${p.category}`}>{p.categoryName}</Link>
          {p.subcategory && (
            <>
              {" "}/ <Link to={`/${p.category}/${p.subcategorySlug}`}>{p.subcategory}</Link>
            </>
          )}
        </nav>
        <div className="row g-5">
          <div className="col-lg-7">
            <Gallery product={p} key={p.id} />
          </div>
          <div className="col-lg-5">
            <span className="eyebrow">{p.categoryName}</span>
            <h1 className="display product-title">{p.name}</h1>
            <PriceTag product={p} large />
            <div className={`stock stock-${stock.tone} mb-3`}>{stock.text}</div>
            {p.description && <p className="product-desc">{p.description}</p>}

            {isInternational ? (
              <div className="detail-actions">
                <div className="qty-row">
                  <span className="field-label mb-0">Quantity</span>
                  <div className="qty">
                    <button aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}><FiMinus /></button>
                    <span>{qty}</span>
                    <button aria-label="Increase quantity" disabled={qty >= maxQty || soldOut} onClick={() => setQty((q) => Math.min(maxQty, q + 1))}><FiPlus /></button>
                  </div>
                </div>
                <div className="detail-actions-row">
                  <button className="btn-jmc btn-jmc-outline" disabled={soldOut} onClick={() => addToCart(p, qty)}>
                    {soldOut ? "Sold Out" : "Add to Cart"}
                  </button>
                  <button className="btn-jmc btn-jmc-primary" disabled={soldOut} onClick={() => buyNow(p, qty)}>
                    Buy Now
                  </button>
                </div>
                <button className="btn-jmc btn-jmc-ghost-dark" onClick={() => toggleWishlist(p)}>
                  {wished ? <FaHeart /> : <FaRegHeart />} {wished ? "In Wishlist" : "Save to Wishlist"}
                </button>
                {!p.internationalShipping && (
                  <p className="enquiry-note">This piece currently ships within India only.</p>
                )}
              </div>
            ) : (
              <div className="detail-actions">
                <WhatsAppEnquiryButton product={p} size="lg" />
                <div className="detail-actions-row single">
                  <button className="btn-jmc btn-jmc-outline" onClick={() => toggleWishlist(p)}>
                    {wished ? <FaHeart /> : <FaRegHeart />} {wished ? "In Wishlist" : "Save to Wishlist"}
                  </button>
                </div>
              </div>
            )}
            {isInternational ? (
              <p className="enquiry-note">Questions about this piece? <WhatsAppLink product={p} /></p>
            ) : (
              <p className="enquiry-note">No account needed to enquire — we reply directly on WhatsApp.</p>
            )}

            <table className="spec-table">
              <tbody>
                {specs.map(([k, v]) => (
                  <tr key={k}>
                    <th>{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sticky mobile action bar */}
      {isInternational ? (
        <div className="mobile-sticky-actions">
          <button className="btn-jmc btn-jmc-outline" disabled={soldOut} onClick={() => addToCart(p, qty)}>
            {soldOut ? "Sold Out" : "Add to Cart"}
          </button>
          <button className="btn-jmc btn-jmc-primary" disabled={soldOut} onClick={() => buyNow(p, qty)}>
            Buy Now
          </button>
        </div>
      ) : (
        <div className="mobile-sticky-actions single">
          <WhatsAppEnquiryButton product={p} size="" label="Enquire on WhatsApp" />
        </div>
      )}

    </section>
    <RelatedProducts product={p} />
    </>
  );
}
