import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { createOrder } from "../api/orders";
import { createPaymentOrder, verifyPayment } from "../api/payments";
import { loadRazorpay } from "../utils/razorpay";
import { DELIVERY_FEE_ESTIMATE, DELIVERY_FEE_THRESHOLD } from "../utils/constants";
import { formatPrice, productImage } from "../utils/format";
import EmptyState from "../components/EmptyState";
import PageLoader from "../components/PageLoader";

const STEPS = ["Shipping", "Review", "Payment"];

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, loading, clear, reset } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("cod");
  const [coupon, setCoupon] = useState("");
  const [notes, setNotes] = useState("");
  const [addr, setAddr] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const set = (k) => (e) => setAddr({ ...addr, [k]: e.target.value });

  const isInternational = addr.country.trim().toLowerCase() !== "india";
  const blocked = useMemo(
    () => (isInternational ? items.filter((i) => !i.product.internationalShipping) : []),
    [isInternational, items]
  );
  // Display-only estimate; the backend computes the final total.
  const estFee = subtotal > 0 && subtotal < DELIVERY_FEE_THRESHOLD ? DELIVERY_FEE_ESTIMATE : 0;

  if (loading && items.length === 0) return <PageLoader />;
  if (items.length === 0) {
    return (
      <div className="container section">
        <EmptyState title="Your cart is empty." action={<Link to="/jadau-jewellery" className="btn-jmc btn-jmc-primary">Continue Shopping</Link>} />
      </div>
    );
  }

  const next = (e) => {
    e.preventDefault();
    setError("");
    if (blocked.length) {
      setError(`These items cannot be shipped outside India: ${blocked.map((b) => b.product.name).join(", ")}.`);
      return;
    }
    setStep(1);
  };

  const finish = (orderId) => {
    reset();
    navigate(`/orders/${orderId}`, { replace: true });
  };

  const payOnline = async (order) => {
    const ok = await loadRazorpay();
    if (!ok) throw new Error("Unable to load the payment window. Please check your connection.");
    const { data: pay } = await createPaymentOrder(order.id);
    await new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: pay.keyId,
        amount: pay.amount,
        currency: pay.currency,
        order_id: pay.razorpayOrderId,
        name: "JMC – Jai Maa Collection",
        description: `Order ${order.orderNumber}`,
        prefill: { name: addr.fullName, email: user?.email, contact: addr.phone },
        theme: { color: "#5B1424" },
        handler: async (r) => {
          try {
            await verifyPayment({
              orderId: order.id,
              razorpay_order_id: r.razorpay_order_id,
              razorpay_payment_id: r.razorpay_payment_id,
              razorpay_signature: r.razorpay_signature,
            });
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        modal: { ondismiss: () => reject(new Error("Payment was cancelled. You can retry from your order page.")) },
      });
      rzp.on("payment.failed", (resp) => reject(new Error(resp?.error?.description || "Payment failed. Please try again.")));
      rzp.open();
    });
  };

  const placeOrder = async () => {
    setBusy(true);
    setError("");
    let order;
    try {
      const body = {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        shippingAddress: { ...addr, country: addr.country.trim() || "India" },
        paymentMethod: method,
      };
      if (coupon.trim()) body.couponCode = coupon.trim();
      if (notes.trim()) body.notes = notes.trim();
      const res = await createOrder(body);
      order = res.data.order;
    } catch (e) {
      setError(e.message);
      setBusy(false);
      return;
    }

    // Order exists and stock is reserved: empty the cart (explicit items do not clear it server-side).
    try {
      await clear();
    } catch {
      /* cart cleanup is best-effort */
    }

    if (method === "cod") {
      toast.success("Order placed successfully");
      setBusy(false);
      return finish(order.id);
    }
    try {
      await payOnline(order);
      toast.success("Payment successful");
    } catch (e) {
      toast.error(e.message);
    }
    setBusy(false);
    finish(order.id);
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Secure Checkout</span>
          <h1 className="display">Checkout</h1>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s} className={i === step ? "active" : i < step ? "done" : ""}>
                <span>{i + 1}</span> {s}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section pt-4">
        <div className="container">
          {error && <div className="alert-jmc error">{error}</div>}
          <div className="row g-5">
            <div className="col-lg-8">
              {step === 0 && (
                <form className="panel" onSubmit={next}>
                  <h2 className="panel-title">Shipping Address</h2>
                  <div className="row g-3">
                    <div className="col-md-6"><label className="field">Full Name<input required value={addr.fullName} onChange={set("fullName")} autoComplete="name" /></label></div>
                    <div className="col-md-6"><label className="field">Phone<input required type="tel" value={addr.phone} onChange={set("phone")} autoComplete="tel" /></label></div>
                    <div className="col-12"><label className="field">Address Line 1<input required value={addr.line1} onChange={set("line1")} autoComplete="address-line1" /></label></div>
                    <div className="col-12"><label className="field">Address Line 2<input value={addr.line2} onChange={set("line2")} autoComplete="address-line2" /></label></div>
                    <div className="col-md-6"><label className="field">City<input required value={addr.city} onChange={set("city")} autoComplete="address-level2" /></label></div>
                    <div className="col-md-6"><label className="field">State<input required value={addr.state} onChange={set("state")} autoComplete="address-level1" /></label></div>
                    <div className="col-md-6"><label className="field">Postal Code<input required value={addr.postalCode} onChange={set("postalCode")} autoComplete="postal-code" /></label></div>
                    <div className="col-md-6"><label className="field">Country<input required value={addr.country} onChange={set("country")} autoComplete="country-name" /></label></div>
                  </div>
                  {isInternational && blocked.length > 0 && (
                    <div className="alert-jmc error mt-3">
                      International delivery is not available for: {blocked.map((b) => b.product.name).join(", ")}. Remove them from your cart or choose India.
                    </div>
                  )}
                  <button className="btn-jmc btn-jmc-primary mt-3">Continue to Review</button>
                </form>
              )}

              {step === 1 && (
                <div className="panel">
                  <h2 className="panel-title">Review Order</h2>
                  {items.map((it) => (
                    <div className="cart-row compact" key={it.id}>
                      <img src={productImage(it.product)} alt={it.product.name} />
                      <div className="grow"><strong>{it.product.name}</strong><div className="muted small">Qty {it.quantity}</div></div>
                      <strong>{formatPrice(it.lineTotal)}</strong>
                    </div>
                  ))}
                  <label className="field mt-3">
                    Coupon code (optional)
                    <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Enter code" />
                  </label>
                  <p className="muted small">Your coupon is validated when the order is placed.</p>
                  <label className="field">Order notes (optional)<textarea rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn-jmc btn-jmc-outline" onClick={() => setStep(0)}>Back</button>
                    <button className="btn-jmc btn-jmc-primary" onClick={() => setStep(2)}>Continue to Payment</button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="panel">
                  <h2 className="panel-title">Payment</h2>
                  <label className={`pay-option ${method === "cod" ? "selected" : ""}`}>
                    <input type="radio" name="pay" checked={method === "cod"} onChange={() => setMethod("cod")} />
                    <div><strong>Cash on Delivery</strong><span>Pay when your order arrives.</span></div>
                  </label>
                  <label className={`pay-option ${method === "razorpay" ? "selected" : ""}`}>
                    <input type="radio" name="pay" checked={method === "razorpay"} onChange={() => setMethod("razorpay")} />
                    <div><strong>Pay Online (Razorpay)</strong><span>UPI, cards, net banking and wallets.</span></div>
                  </label>
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn-jmc btn-jmc-outline" disabled={busy} onClick={() => setStep(1)}>Back</button>
                    <button className="btn-jmc btn-jmc-primary" disabled={busy} onClick={placeOrder}>
                      {busy ? "Placing order…" : method === "cod" ? "Place Order" : "Place Order & Pay"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="col-lg-4">
              <div className="panel summary">
                <h2 className="panel-title">Summary</h2>
                <div className="sum-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                {coupon && step > 0 && <div className="sum-row"><span>Coupon</span><span>{coupon}</span></div>}
                <div className="sum-row"><span>Delivery (est.)</span><span>{estFee ? formatPrice(estFee) : "Free"}</span></div>
                <div className="sum-row total"><span>Estimated total</span><span>{formatPrice(subtotal + estFee)}</span></div>
                <p className="muted small">Final amount, discount and delivery are confirmed by JMC when your order is placed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
