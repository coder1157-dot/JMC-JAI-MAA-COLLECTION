import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import PageLoader from "../components/PageLoader";
import { productImage } from "../utils/format";
import WhatsAppEnquiryButton from "../components/WhatsAppEnquiryButton";
import PriceOnEnquiry from "../components/PriceOnEnquiry";

export default function Wishlist() {
  const { products, loading, remove } = useWishlist();
  const toast = useToast();

  const onRemove = async (id) => {
    try {
      await remove(id);
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Saved Pieces</span>
          <h1 className="display">My Wishlist</h1>
        </div>
      </section>
      <section className="section pt-4">
        <div className="container">
          {loading && products.length === 0 ? (
            <PageLoader />
          ) : products.length === 0 ? (
            <EmptyState
              title="Your wishlist is empty."
              text="Tap the heart on any piece to save it here."
              action={<Link to="/new-arrivals" className="btn-jmc btn-jmc-primary">Explore New Arrivals</Link>}
            />
          ) : (
            <div className="wish-list">
              {products.map((p) => (
                <div className="wish-row" key={p.id}>
                  <Link to={`/product/${p.slug || p.id}`}>
                    <img src={productImage(p)} alt={p.name} loading="lazy" />
                  </Link>
                  <div className="grow">
                    <div className="product-card-cat">{[p.categoryName, p.subcategory].filter(Boolean).join(" · ")}</div>
                    <Link to={`/product/${p.slug || p.id}`} className="wish-name">{p.name}</Link>
                    <PriceOnEnquiry />
                  </div>
                  <div className="wish-actions">
                    <WhatsAppEnquiryButton product={p} />
                    <Link to={`/product/${p.slug || p.id}`} className="btn-jmc btn-jmc-outline btn-sm-jmc">View Details</Link>
                    <button className="btn-jmc btn-jmc-ghost-dark btn-sm-jmc" onClick={() => onRemove(p.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
