import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCustomerType } from "../context/CustomerTypeContext";
import { useToast } from "../context/ToastContext";
import { addAddress, getAddresses, updateAddress } from "../api/auth";
import { createOrder, getOrders, quoteOrder } from "../api/orders";
import { payOrder } from "../utils/razorpay";
import { COUNTRIES } from "../utils/countries";
import { isCodAvailable } from "../utils/constants";
import { formatMoney, productImage } from "../utils/format";
import EmptyState from "../components/EmptyState";
import PageLoader from "../components/PageLoader";

const STEPS = ["Address", "Review Product", "Payment"];

const blankAddress = (user) => ({
  fullName: user?.name || "",
  phone: user?.phone || "",
  email: user?.email || "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
});

const fromSaved = (a = {}) => ({
  fullName: a.fullName || "",
  phone: a.phone || "",
  email: a.email || "",
  line1: a.line1 || "",
  line2: a.line2 || "",
  city: a.city || "",
  state: a.state || "",
  country: a.country || "",
  postalCode: a.postalCode || "",
});

const validateAddress = (a) => {
  if (!a.fullName.trim()) return "Please enter the recipient's full name.";
  if (!/^[0-9+()\-\s]{6,30}$/.test(a.phone.trim())) return "Please enter a valid phone number (digits, +, spaces or dashes).";
  if (!/^\S+@\S+\.\S+$/.test(a.email.trim())) return "Please enter a valid email address.";
  if (!a.line1.trim()) return "Please enter Address Line 1.";
  if (!a.city.trim()) return "Please enter the city.";
  if (!a.country.trim()) return "Please select the destination country.";
  if (!a.postalCode.trim()) return "Please enter the postal / ZIP code.";
  return "";
};

const newKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `jmc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function AddressLines({ a }) {
  return (
    <address className="addr">
      <strong>{a.fullName}</strong>
      <br />
      {a.line1}
      {a.line2 ? `, ${a.line2}` : ""}
      <br />
      {[a.city, a.state].filter(Boolean).join(", ")} {a.postalCode}
      <br />
      {a.country}
      <br />
      {a.phone}
      {a.email && (
        <>
          <br />
          {a.email}
        </>
      )}
    </address>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, currency: cartCurrency, loading, reset } = useCart();
  const { currency, razorpayCurrencies } = useCustomerType();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  // address
  const [addrLoading, setAddrLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState("form"); // card | list | form
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => blankAddress(user));
  const [formNote, setFormNote] = useState("");
  const [savingAddr, setSavingAddr] = useState(false);

  // review + payment
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState("");
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState(false);
  const idempotencyKey = useRef(newKey());

  const selected = addresses.find((a) => a.id === selectedId) || null;
  const unavailable = items.filter((i) => i.available === false);
  const codOk = !!selected && isCodAvailable(selected.country);
  const rzpOk = !!quote && (!razorpayCurrencies.length || razorpayCurrencies.includes(quote.currency));

  // Existing customer: the saved address is shown automatically. Otherwise the form is pre-filled from the last order.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getAddresses();
        if (!alive) return;
        const list = res.data.addresses || [];
        setAddresses(list);
        if (list.length) {
          setSelectedId((list.find((a) => a.isDefault) || list[0]).id);
          setMode("card");
          return;
        }
        try {
          const last = (await getOrders({ page: 1, limit: 1 })).data.orders?.[0]?.shippingAddress;
          if (alive && last?.fullName) {
            setForm({ ...blankAddress(user), ...fromSaved(last), email: last.email || user?.email || "" });
            setFormNote("We pre-filled this from your previous order — check it and continue.");
          }
        } catch {
          /* no previous order: leave the blank form */
        }
        if (alive) setMode("form");
      } catch (e) {
        if (alive) {
          setError(e.message);
          setMode("form");
        }
      } finally {
        if (alive) setAddrLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the chosen payment method valid for the destination / currency.
  useEffect(() => {
    if (!quote) return;
    if (method === "cod" && codOk) return;
    if (method === "razorpay" && rzpOk) return;
    setMethod(rzpOk ? "razorpay" : codOk ? "cod" : "");
  }, [quote, codOk, rzpOk, method]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Totals always come from the backend (POST /orders/quote), never from frontend state.
  const loadQuote = async (addressId, couponCode = appliedCoupon) => {
    setQuoting(true);
    setError("");
    try {
      const res = await quoteOrder({ addressId, currency, couponCode: couponCode || undefined });
      setQuote(res.data.quote);
      return true;
    } catch (e) {
      setQuote(null);
      setError(e.message);
      return false;
    } finally {
      setQuoting(false);
    }
  };

  const goReview = async (addressId = selectedId) => {
    if (!addressId) return;
    if (unavailable.length) {
      setError("Please adjust or remove unavailable items from your cart first.");
      return;
    }
    setStep(1);
    await loadQuote(addressId);
  };

  const startEdit = () => {
    setForm(fromSaved(selected));
    setEditingId(selected.id);
    setFormNote("");
    setError("");
    setMode("form");
  };
  const startNew = () => {
    setForm(blankAddress(user));
    setEditingId(null);
    setFormNote("");
    setError("");
    setMode("form");
  };

  const submitAddress = async (e) => {
    e.preventDefault();
    const problem = validateAddress(form);
    if (problem) return setError(problem);
    setSavingAddr(true);
    setError("");
    try {
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
      const res = editingId ? await updateAddress(editingId, body) : await addAddress(body);
      const list = res.data.addresses || [];
      setAddresses(list);
      const id = editingId || list[list.length - 1]?.id;
      setSelectedId(id);
      setEditingId(null);
      setMode("card");
      await goReview(id);
    } catch (err) {
      setError([err.message, ...(err.errors || []).filter((x) => x !== err.message)].join(" "));
    } finally {
      setSavingAddr(false);
    }
  };

  const applyCoupon = async () => {
    const code = coupon.trim();
    if (!code) return;
    setQuoting(true);
    setError("");
    try {
      const res = await quoteOrder({ addressId: selectedId, currency, couponCode: code });
      setQuote(res.data.quote);
      setAppliedCoupon(code);
      toast.success("Coupon applied");
    } catch (e) {
      setError(e.message); // the previous valid quote stays on screen
    } finally {
      setQuoting(false);
    }
  };
  const removeCoupon = async () => {
    setCoupon("");
    setAppliedCoupon("");
    await loadQuote(selectedId, "");
  };

  const placeOrder = async () => {
    if (!quote || !selected || !method) return;
    setBusy(true);
    setError("");
    let order;
    try {
      const res = await createOrder({
        addressId: selected.id,
        paymentMethod: method === "cod" ? "COD" : "RAZORPAY",
        currency: quote.currency,
        couponCode: appliedCoupon || undefined,
        notes: notes.trim() || undefined,
        idempotencyKey: idempotencyKey.current, // a repeated click / retry returns the same order
      });
      order = res.data.order;
    } catch (e) {
      setError(e.message);
      setBusy(false);
      return;
    }

    // The order exists and the server emptied the cart.
    setPlaced(true);
    reset();
    const goToOrder = (state) => navigate(`/orders/${order.id}`, { replace: true, state: { placed: true, ...state } });

    if (method === "cod" || order.paymentStatus === "paid") {
      toast.success("Order placed successfully");
      return goToOrder({});
    }
    try {
      await payOrder(order, { name: selected.fullName, email: selected.email || user?.email, phone: selected.phone });
      toast.success("Payment verified — your order is confirmed");
      goToOrder({ paid: true });
    } catch (e) {
      toast.error(e.message);
      goToOrder({ payment: e.code || "failed", paymentMessage: e.message });
    }
  };

  if (placed) return <PageLoader />;
  if ((loading && items.length === 0) || addrLoading) return <PageLoader />;
  if (items.length === 0) {
    return (
      <div className="container section">
        <EmptyState
          title="Your cart is empty."
          action={<Link to="/jadau-jewellery" className="btn-jmc btn-jmc-primary">Continue Shopping</Link>}
        />
      </div>
    );
  }

  const money = (n) => formatMoney(n, quote?.currency || cartCurrency || currency);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Secure Checkout</span>
          <h1 className="display">Checkout</h1>
          <ol className="steps checkout-steps" aria-label="Checkout progress">
            {STEPS.map((s, i) => (
              <li key={s} className={i === step ? "active" : i < step ? "done" : ""} aria-current={i === step ? "step" : undefined}>
                <span>{i < step ? "✓" : `0${i + 1}`}</span> {s}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section pt-4">
        <div className="container">
          {error && <div className="alert-jmc error" role="alert">{error}</div>}
          <div className="row g-5">
            <div className="col-lg-8">
              {/* ---------------- STEP 1 · ADDRESS ---------------- */}
              {step === 0 && (
                <div className="panel">
                  <h2 className="panel-title">Delivery Address</h2>
                  {unavailable.length > 0 && (
                    <div className="alert-jmc error">
                      Not available in the quantity selected: {unavailable.map((u) => u.product.name).join(", ")}.{" "}
                      <Link to="/cart" className="link-btn">Update cart</Link>
                    </div>
                  )}

                  {mode === "card" && selected && (
                    <div className="address-card">
                      <span className="eyebrow">Saved delivery address</span>
                      <AddressLines a={selected} />
                      <div className="address-actions">
                        <button type="button" className="btn-jmc btn-jmc-outline btn-sm-jmc" onClick={startEdit}>Edit Address</button>
                        <button type="button" className="btn-jmc btn-jmc-outline btn-sm-jmc" onClick={() => setMode("list")}>Change Address</button>
                      </div>
                      <button type="button" className="btn-jmc btn-jmc-primary mt-3" disabled={unavailable.length > 0} onClick={() => goReview()}>
                        Continue to Review
                      </button>
                    </div>
                  )}

                  {mode === "list" && (
                    <div>
                      {addresses.map((a) => (
                        <label key={a.id} className={`pay-option address-option ${a.id === selectedId ? "selected" : ""}`}>
                          <input
                            type="radio"
                            name="address"
                            checked={a.id === selectedId}
                            onChange={() => {
                              setSelectedId(a.id);
                              setMode("card");
                            }}
                          />
                          <AddressLines a={a} />
                        </label>
                      ))}
                      <div className="address-actions">
                        <button type="button" className="btn-jmc btn-jmc-outline btn-sm-jmc" onClick={() => setMode("card")}>Back</button>
                        <button type="button" className="btn-jmc btn-jmc-primary btn-sm-jmc" onClick={startNew}>Add New Address</button>
                      </div>
                    </div>
                  )}

                  {mode === "form" && (
                    <form onSubmit={submitAddress} noValidate>
                      {formNote && <div className="alert-jmc info">{formNote}</div>}
                      <div className="row g-3">
                        <div className="col-md-6"><label className="field">Full Name<input required value={form.fullName} onChange={set("fullName")} autoComplete="name" /></label></div>
                        <div className="col-md-6"><label className="field">Phone<input required type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="+1 555 000 0000" /></label></div>
                        <div className="col-12"><label className="field">Email<input required type="email" value={form.email} onChange={set("email")} autoComplete="email" /></label></div>
                        <div className="col-12"><label className="field">Address Line 1<input required value={form.line1} onChange={set("line1")} autoComplete="address-line1" /></label></div>
                        <div className="col-12"><label className="field">Address Line 2 (optional)<input value={form.line2} onChange={set("line2")} autoComplete="address-line2" /></label></div>
                        <div className="col-md-6"><label className="field">City<input required value={form.city} onChange={set("city")} autoComplete="address-level2" /></label></div>
                        <div className="col-md-6"><label className="field">State / Province<input value={form.state} onChange={set("state")} autoComplete="address-level1" /></label></div>
                        <div className="col-md-6">
                          <label className="field">
                            Country
                            <select required value={form.country} onChange={set("country")} autoComplete="country-name">
                              <option value="">Select country</option>
                              {form.country && !COUNTRIES.includes(form.country) && <option value={form.country}>{form.country}</option>}
                              {COUNTRIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="col-md-6"><label className="field">Postal / ZIP Code<input required value={form.postalCode} onChange={set("postalCode")} autoComplete="postal-code" /></label></div>
                      </div>
                      <div className="address-actions">
                        {addresses.length > 0 && (
                          <button type="button" className="btn-jmc btn-jmc-outline" onClick={() => { setError(""); setMode("card"); }}>Cancel</button>
                        )}
                        <button className="btn-jmc btn-jmc-primary" disabled={savingAddr || unavailable.length > 0}>
                          {savingAddr ? "Saving…" : editingId ? "Save & Continue to Review" : "Save Address & Continue"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ---------------- STEP 2 · REVIEW PRODUCT ---------------- */}
              {step === 1 && (
                <div className="panel">
                  <h2 className="panel-title">Review Product</h2>
                  {quoting && !quote ? (
                    <PageLoader />
                  ) : quote ? (
                    <>
                      {quote.items.map((it, i) => (
                        <div className="cart-row compact review-row" key={`${it.sku}-${i}`}>
                          <img src={it.image || productImage(null)} alt={it.name} />
                          <div className="grow">
                            <strong>{it.name}</strong>
                            <div className="muted small">SKU {it.sku} · Qty {it.quantity}</div>
                            <div className="muted small">Unit price {money(it.price)}</div>
                          </div>
                          <strong>{money(it.lineTotal)}</strong>
                        </div>
                      ))}

                      <div className="review-grid">
                        <div>
                          <span className="field-label">Delivering to</span>
                          {selected && <AddressLines a={selected} />}
                        </div>
                        <div className="review-totals">
                          <div className="sum-row"><span>Subtotal</span><span>{money(quote.subtotal)}</span></div>
                          {quote.discount > 0 && <div className="sum-row"><span>Discount{appliedCoupon ? ` (${appliedCoupon})` : ""}</span><span>− {money(quote.discount)}</span></div>}
                          <div className="sum-row"><span>Shipping{quote.shippingMethod ? ` · ${quote.shippingMethod}` : ""}</span><span>{quote.shippingFee > 0 ? money(quote.shippingFee) : "Free"}</span></div>
                          <div className="sum-row total"><span>Total ({quote.currency})</span><span>{money(quote.total)}</span></div>
                          {quote.estimatedDays && <p className="muted small">Estimated delivery: {quote.estimatedDays}</p>}
                        </div>
                      </div>

                      <div className="coupon-row">
                        <label className="field mb-0 grow">
                          Coupon code (optional)
                          <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Enter code" />
                        </label>
                        {appliedCoupon ? (
                          <button type="button" className="btn-jmc btn-jmc-outline btn-sm-jmc" onClick={removeCoupon} disabled={quoting}>Remove</button>
                        ) : (
                          <button type="button" className="btn-jmc btn-jmc-outline btn-sm-jmc" onClick={applyCoupon} disabled={quoting || !coupon.trim()}>Apply</button>
                        )}
                      </div>
                      <label className="field mt-3">Order notes (optional)<textarea rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
                    </>
                  ) : (
                    <p className="muted">We could not calculate this order. Please go back and check your address or cart.</p>
                  )}
                  <div className="address-actions">
                    <button className="btn-jmc btn-jmc-outline" onClick={() => { setError(""); setStep(0); }}>Back</button>
                    <button className="btn-jmc btn-jmc-primary" disabled={!quote || quoting} onClick={() => { setError(""); setStep(2); }}>
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- STEP 3 · PAYMENT ---------------- */}
              {step === 2 && quote && (
                <div className="panel">
                  <h2 className="panel-title">Payment</h2>
                  {codOk && (
                    <label className={`pay-option ${method === "cod" ? "selected" : ""}`}>
                      <input type="radio" name="pay" checked={method === "cod"} onChange={() => setMethod("cod")} />
                      <div><strong>Cash on Delivery</strong><span>Pay when your order arrives.</span></div>
                    </label>
                  )}
                  <label className={`pay-option ${method === "razorpay" ? "selected" : ""} ${rzpOk ? "" : "disabled"}`}>
                    <input type="radio" name="pay" disabled={!rzpOk} checked={method === "razorpay"} onChange={() => setMethod("razorpay")} />
                    <div>
                      <strong>Pay Online with Razorpay</strong>
                      <span>
                        {rzpOk
                          ? "Cards, UPI, net banking and wallets — you will be asked to confirm in the secure Razorpay window."
                          : `Online payment is not available in ${quote.currency}. Choose ${razorpayCurrencies.join(" / ") || "another currency"} from the top bar${codOk ? " or Cash on Delivery" : ""}.`}
                      </span>
                    </div>
                  </label>
                  {!codOk && !rzpOk && <div className="alert-jmc error">No payment method is available for this destination and currency right now. Please contact us on WhatsApp.</div>}
                  <p className="muted small">
                    Total payable: <strong>{money(quote.total)}</strong>. The final amount is confirmed by JMC when your order is placed.
                  </p>
                  <div className="address-actions">
                    <button className="btn-jmc btn-jmc-outline" disabled={busy} onClick={() => { setError(""); setStep(1); }}>Back</button>
                    <button className="btn-jmc btn-jmc-primary" disabled={busy || !method} onClick={placeOrder}>
                      {busy ? "Placing order…" : method === "razorpay" ? "Place Order & Pay" : "Place Order"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="col-lg-4">
              <div className="panel summary">
                <h2 className="panel-title">Summary</h2>
                {quote && step > 0 ? (
                  <>
                    <div className="sum-row"><span>Subtotal</span><span>{money(quote.subtotal)}</span></div>
                    {quote.discount > 0 && <div className="sum-row"><span>Discount</span><span>− {money(quote.discount)}</span></div>}
                    <div className="sum-row"><span>Shipping</span><span>{quote.shippingFee > 0 ? money(quote.shippingFee) : "Free"}</span></div>
                    <div className="sum-row total"><span>Total</span><span>{money(quote.total)}</span></div>
                  </>
                ) : (
                  <>
                    <div className="sum-row"><span>Items</span><span>{items.reduce((n, i) => n + i.quantity, 0)}</span></div>
                    <div className="sum-row total"><span>Cart subtotal</span><span>{formatMoney(subtotal, cartCurrency || currency)}</span></div>
                    <p className="muted small">Shipping is calculated for your country at the Review step.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
