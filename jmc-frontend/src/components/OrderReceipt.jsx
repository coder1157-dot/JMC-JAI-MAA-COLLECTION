import { formatDateTime, formatMoney, statusLabel } from "../utils/format";

const methodLabel = (m) => (m === "cod" ? "Cash on Delivery" : m === "razorpay" ? "Online (Razorpay)" : statusLabel(m));

/**
 * Print-friendly receipt. Hidden on screen; the page's `window.print()` shows only this block
 * (see the "Print receipt" rules in styles/main.css). No PDF library is needed.
 */
export default function OrderReceipt({ order, user }) {
  const a = order.shippingAddress || {};
  const currency = order.currency || "INR";
  const money = (n) => formatMoney(n, currency);
  const customer = order.customer || {};
  const name = customer.name || a.fullName || user?.name || "";
  const email = customer.email || a.email || user?.email || "";
  const phone = customer.phone || a.phone || user?.phone || "";

  return (
    <section className="print-receipt" aria-hidden="true">
      <header className="receipt-head">
        <div>
          <div className="receipt-logo">JMC</div>
          <div className="receipt-brand">JMC – JAI MAA COLLECTION</div>
        </div>
        <div className="receipt-meta">
          <h1>Receipt</h1>
          <div>Order ID: <strong>{order.orderNumber}</strong></div>
          <div>Order date: {formatDateTime(order.createdAt)}</div>
        </div>
      </header>

      <div className="receipt-cols">
        <div>
          <h2>Customer</h2>
          <p>
            {name}<br />
            {phone && <>{phone}<br /></>}
            {email}
          </p>
        </div>
        <div>
          <h2>Delivery address</h2>
          <p>
            {a.fullName}<br />
            {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
            {[a.city, a.state, a.postalCode].filter(Boolean).join(", ")}<br />
            {a.country}
          </p>
        </div>
      </div>

      <table className="receipt-table">
        <thead>
          <tr><th>Product</th><th>SKU</th><th className="num">Qty</th><th className="num">Price</th><th className="num">Amount</th></tr>
        </thead>
        <tbody>
          {order.items.map((it, i) => (
            <tr key={i}>
              <td>{it.name}</td>
              <td>{it.sku}</td>
              <td className="num">{it.quantity}</td>
              <td className="num">{money(it.price)}</td>
              <td className="num">{money(it.lineTotal ?? it.price * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="receipt-totals">
        <tbody>
          <tr><td>Subtotal</td><td className="num">{money(order.subtotal)}</td></tr>
          {order.discount > 0 && <tr><td>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</td><td className="num">− {money(order.discount)}</td></tr>}
          <tr><td>Shipping</td><td className="num">{order.shippingFee > 0 ? money(order.shippingFee) : "Free"}</td></tr>
          <tr className="grand"><td>Total ({currency})</td><td className="num">{money(order.total)}</td></tr>
        </tbody>
      </table>

      <p className="receipt-pay">
        Payment method: <strong>{methodLabel(order.paymentMethod)}</strong> · Payment status: <strong>{statusLabel(order.paymentStatus)}</strong>
        {order.razorpay?.paymentId && <> · Transaction ID: {order.razorpay.paymentId}</>}
      </p>
      <p className="receipt-foot">Thank you for choosing JMC – Jai Maa Collection.</p>
    </section>
  );
}
