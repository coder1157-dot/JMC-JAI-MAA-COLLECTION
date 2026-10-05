import { Link, useNavigate } from "react-router-dom";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import PageLoader from "../components/PageLoader";
import { formatPrice, productImage } from "../utils/format";

export default function Cart() {
  const { items, totalItems, subtotal, loading, updateItem, removeItem, clear } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const run = async (fn) => {
    try {
      await fn();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Shopping Bag</span>
          <h1 className="display">Your Cart</h1>
        </div>
      </section>
      <section className="section pt-4">
        <div className="container">
          {loading && items.length === 0 ? (
            <PageLoader />
          ) : items.length === 0 ? (
            <EmptyState
              title="Your cart is empty."
              action={<Link to="/jadau-jewellery" className="btn-jmc btn-jmc-primary">Continue Shopping</Link>}
            />
          ) : (
            <div className="row g-5">
              <div className="col-lg-8">
                {items.map((it) => (
                  <div className="cart-row" key={it.id}>
                    <Link to={`/product/${it.product.slug || it.product.id}`}>
                      <img src={productImage(it.product)} alt={it.product.name} />
                    </Link>
                    <div className="grow">
                      <div className="product-card-cat">{it.product.categoryName}</div>
                      <Link to={`/product/${it.product.slug || it.product.id}`} className="wish-name">{it.product.name}</Link>
                      <div className="price">{formatPrice(it.product.price)}</div>
                      <div className="qty">
                        <button aria-label="Decrease" disabled={it.quantity <= 1} onClick={() => run(() => updateItem(it.id, it.quantity - 1))}><FiMinus /></button>
                        <span>{it.quantity}</span>
                        <button aria-label="Increase" disabled={it.quantity >= it.product.stock} onClick={() => run(() => updateItem(it.id, it.quantity + 1))}><FiPlus /></button>
                      </div>
                    </div>
                    <div className="cart-line">
                      <strong>{formatPrice(it.lineTotal)}</strong>
                      <button className="link-btn" onClick={() => run(() => removeItem(it.id))}><FiTrash2 /> Remove</button>
                    </div>
                  </div>
                ))}
                <button className="link-btn mt-3" onClick={() => run(clear)}>Clear cart</button>
              </div>
              <div className="col-lg-4">
                <div className="panel summary">
                  <h2 className="panel-title">Order Summary</h2>
                  <div className="sum-row"><span>Items</span><span>{totalItems}</span></div>
                  <div className="sum-row total"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                  <p className="muted small">Delivery and any coupon are confirmed at checkout.</p>
                  <button className="btn-jmc btn-jmc-primary w-100" onClick={() => navigate("/checkout")}>Proceed to Checkout</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
