import { useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getOrder } from "../api/orders";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useAsync from "../hooks/useAsync";
import usePolling from "../hooks/usePolling";
import PageLoader from "../components/PageLoader";
import ErrorState from "../components/ErrorState";
import OrderTracker from "../components/OrderTracker";
import OrderReceipt from "../components/OrderReceipt";
import { payOrder } from "../utils/razorpay";
import { formatDateTime, formatMoney, statusLabel } from "../utils/format";
import { PLACEHOLDER_IMAGE } from "../utils/constants";

const methodLabel = (m) => (m === "cod" ? "Cash on Delivery" : m === "razorpay" ? "Razorpay (online)" : statusLabel(m));

/** Customer order view: summary, products, delivery, payment, totals and tracking. */
export function OrderView({ order, trackRef }) {
  const a = order.shippingAddress || {};
  const currency = order.currency || "INR";
  const money = (n) => formatMoney(n, currency);
  const fullAddress = [a.line1, a.line2].filter(Boolean).join(", ");

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="panel">
          <h2 className="panel-title">Order Summary</h2>
          <dl className="kv">
            <dt>Order ID</dt><dd>{order.orderNumber}</dd>
            <dt>Date</dt><dd>{formatDateTime(order.createdAt)}</dd>
            <dt>Status</dt><dd><span className={`pill pill-${order.status}`}>{statusLabel(order.status)}</span></dd>
          </dl>
        </div>

        <div className="panel mt-4">
          <h2 className="panel-title">Products</h2>
          {order.items.map((it, i) => (
            <div className="cart-row compact" key={i}>
              <img src={it.image || PLACEHOLDER_IMAGE} alt={it.name} />
              <div className="grow">
                <strong>{it.name}</strong>
                <div className="muted small">SKU {it.sku} · Qty {it.quantity}</div>
                <div className="muted small">Price {money(it.price)}</div>
              </div>
              <strong>{money(it.lineTotal ?? it.price * it.quantity)}</strong>
            </div>
          ))}
        </div>

        <div className="panel mt-4" id="track" ref={trackRef}>
          <h2 className="panel-title">Track Order</h2>
          <OrderTracker order={order} />
        </div>
      </div>

      <div className="col-lg-4">
        <div className="panel summary">
          <h2 className="panel-title">Total</h2>
          <div className="sum-row"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="sum-row"><span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span><span>− {money(order.discount)}</span></div>}
          <div className="sum-row"><span>Shipping</span><span>{order.shippingFee > 0 ? money(order.shippingFee) : "Free"}</span></div>
          <div className="sum-row total"><span>Total</span><span>{money(order.total)}</span></div>
          <div className="sum-row"><span>Currency</span><span>{currency}</span></div>
        </div>

        <div className="panel mt-4">
          <h2 className="panel-title">Delivery</h2>
          <address className="addr">
            <strong>{a.fullName}</strong><br />
            {fullAddress}<br />
            {[a.city, a.state].filter(Boolean).join(", ")} {a.postalCode}<br />
            {a.country}<br />
            {a.phone}
          </address>
        </div>

        <div className="panel mt-4 summary">
          <h2 className="panel-title">Payment</h2>
          <div className="sum-row"><span>Method</span><span>{methodLabel(order.paymentMethod)}</span></div>
          <div className="sum-row"><span>Status</span><span className={`pill pill-pay-${order.paymentStatus}`}>{statusLabel(order.paymentStatus)}</span></div>
          {order.razorpay?.paymentId && <div className="sum-row"><span>Transaction ID</span><span className="break">{order.razorpay.paymentId}</span></div>}
        </div>
      </div>
    </div>
  );
}

/** Banner shown right after checkout (state comes from the Checkout redirect) and for unpaid online orders. */
function PlacedNotice({ order, state }) {
  if (!state?.placed) return null;
  if (state.paid || order.paymentStatus === "paid") {
    return <div className="alert-jmc success" role="status"><strong>Order placed successfully.</strong> Payment received — your order is confirmed.</div>;
  }
  if (order.paymentMethod === "razorpay") {
    return (
      <div className="alert-jmc error" role="alert">
        <strong>Order placed, payment not completed.</strong>{" "}
        {state.paymentMessage || "Your payment is pending."} Use “Retry Payment” below to pay, your items are reserved for you.
      </div>
    );
  }
  return <div className="alert-jmc success" role="status"><strong>Order placed successfully.</strong> You will pay when your order is delivered.</div>;
}

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const { user } = useAuth();
  const trackRef = useRef(null);
  const [paying, setPaying] = useState(false);
  const { data, loading, error, reload } = useAsync(() => getOrder(id), [id]);
  usePolling(() => reload(true), 30000); // picks up status changes made by the admin
  const order = data?.data?.order;

  const canRetry = order && order.paymentMethod === "razorpay" && order.paymentStatus !== "paid" && order.status === "pending";

  const retry = async () => {
    setPaying(true);
    try {
      await payOrder(order, { name: order.shippingAddress?.fullName, email: order.shippingAddress?.email || user?.email, phone: order.shippingAddress?.phone });
      toast.success("Payment verified — your order is confirmed");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPaying(false);
      reload(true);
    }
  };

  return (
    <>
      <div className="screen-only">
        <section className="page-hero">
          <div className="container">
            <span className="eyebrow">Order</span>
            <h1 className="display">{order?.orderNumber || "Order Details"}</h1>
            {order && <p className="muted">Placed on {formatDateTime(order.createdAt)}</p>}
          </div>
        </section>
        <section className="section pt-4">
          <div className="container">
            {loading ? (
              <PageLoader />
            ) : error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : (
              <>
                <PlacedNotice order={order} state={location.state} />
                <div className="order-actions">
                  <button className="btn-jmc btn-jmc-outline" onClick={() => trackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                    Track Order
                  </button>
                  <button className="btn-jmc btn-jmc-primary" onClick={() => window.print()}>
                    Print Receipt
                  </button>
                  {canRetry && (
                    <button className="btn-jmc btn-jmc-gold" disabled={paying} onClick={retry}>
                      {paying ? "Opening payment…" : "Retry Payment"}
                    </button>
                  )}
                </div>
                <OrderView order={order} trackRef={trackRef} />
              </>
            )}
            <div className="mt-4"><Link to="/orders" className="link-btn">← All orders</Link></div>
          </div>
        </section>
      </div>
      {order && <OrderReceipt order={order} user={user} />}
    </>
  );
}
