import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { getProductById, getProductBySlug } from "../api/products";
import useAsync from "../hooks/useAsync";
import useShopActions from "../hooks/useShopActions";
import PageLoader from "../components/PageLoader";
import ErrorState from "../components/ErrorState";
import WhatsAppEnquiryButton from "../components/WhatsAppEnquiryButton";
import PriceOnEnquiry from "../components/PriceOnEnquiry";
import RelatedProducts from "../components/RelatedProducts";
import { CART_ENABLED } from "../utils/constants";
import { isObjectId, productImage, stockLabel } from "../utils/format";

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
  const { data, loading, error, reload } = useAsync(
    () => (isObjectId(id) ? getProductById(id) : getProductBySlug(id)),
    [id]
  );
  const { addToCart, toggleWishlist, inWishlist } = useShopActions();

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
            <PriceOnEnquiry text="Price available on enquiry" large />
            <div className={`stock stock-${stock.tone} mb-3`}>{stock.text}</div>
            {p.description && <p className="product-desc">{p.description}</p>}

            <div className="detail-actions">
              <WhatsAppEnquiryButton product={p} size="lg" />
              <div className={`detail-actions-row ${CART_ENABLED ? "" : "single"}`}>
                {CART_ENABLED && (
                  <button className="btn-jmc btn-jmc-primary" disabled={p.stock <= 0} onClick={() => addToCart(p)}>
                    Add to Cart
                  </button>
                )}
                <button className="btn-jmc btn-jmc-outline" onClick={() => toggleWishlist(p)}>
                  {wished ? <FaHeart /> : <FaRegHeart />} {wished ? "In Wishlist" : "Save to Wishlist"}
                </button>
              </div>
            </div>
            <p className="enquiry-note">No account needed to enquire — we reply directly on WhatsApp.</p>

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
      <div className="mobile-sticky-actions single">
        <WhatsAppEnquiryButton product={p} size="" label="Enquire on WhatsApp" />
      </div>

    </section>
    <RelatedProducts product={p} />
    </>
  );
}
