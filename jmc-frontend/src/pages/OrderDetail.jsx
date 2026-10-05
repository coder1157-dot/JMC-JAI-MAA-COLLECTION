import { Link, useParams } from "react-router-dom";
import { getOrder } from "../api/orders";
import useAsync from "../hooks/useAsync";
import PageLoader from "../components/PageLoader";
import ErrorState from "../components/ErrorState";
import { formatDateTime, formatPrice, statusLabel } from "../utils/format";
import { PLACEHOLDER_IMAGE } from "../utils/constants";

export function OrderView({ order }) {
  const a = order.shippingAddress || {};
  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="panel">
          <h2 className="panel-title">Items</h2>
          {order.items.map((it, i) => (
            <div className="cart-row compact" key={i}>
              <img src={it.image || PLACEHOLDER_IMAGE} alt={it.name} />
              <div className="grow">
                <strong>{it.name}</strong>
                <div className="muted small">SKU {it.sku} · Qty {it.quantity}</div>
              </div>
              <strong>{formatPrice(it.price * it.quantity)}</strong>
            </div>
          ))}
        </div>
        <div className="panel mt-4">
          <h2 className="panel-title">Status</h2>
          <ol className="timeline">
            {[...(order.statusHistory || [])].reverse().map((h, i) => (
              <li key={i} className={i === 0 ? "current" : ""}>
                <strong>{statusLabel(h.status)}</strong>
                {h.note && <span> — {h.note}</span>}
                <div className="muted small">{formatDateTime(h.at)}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="col-lg-4">
        <div className="panel summary">
          <h2 className="panel-title">Summary</h2>
          <div className="sum-row"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="sum-row"><span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span><span>− {formatPrice(order.discount)}</span></div>}
          <div className="sum-row"><span>Shipping</span><span>{order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Free"}</span></div>
          <div className="sum-row total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          <hr />
          <div className="sum-row"><span>Payment</span><span>{order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"}</span></div>
          <div className="sum-row"><span>Payment status</span><span className={`pill pill-${order.paymentStatus}`}>{statusLabel(order.paymentStatus)}</span></div>
          <div className="sum-row"><span>Order status</span><span className={`pill pill-${order.status}`}>{statusLabel(order.status)}</span></div>
        </div>
        <div className="panel mt-4">
          <h2 className="panel-title">Shipping Address</h2>
          <address className="addr">
            {a.fullName}<br />
            {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
            {a.city}, {a.state} {a.postalCode}<br />
            {a.country}<br />
            {a.phone}
          </address>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(() => getOrder(id), [id]);
  const order = data?.data?.order;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Order</span>
          <h1 className="display">{order?.orderNumber || "Order Details"}</h1>
          {order && <p className="muted">Placed on {formatDateTime(order.createdAt)}</p>}
        </div>
      </section>
      <section className="section pt-4">
        <div className="container">
          {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : <OrderView order={order} />}
          <div className="mt-4"><Link to="/orders" className="link-btn">← All orders</Link></div>
        </div>
      </section>
    </>
  );
}
