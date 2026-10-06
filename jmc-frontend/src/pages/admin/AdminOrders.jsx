import { useState } from "react";
import { adminGetOrder, adminGetOrders, adminUpdateOrderStatus } from "../../api/admin";
import useAsync from "../../hooks/useAsync";
import usePolling from "../../hooks/usePolling";
import { useToast } from "../../context/ToastContext";
import PageLoader from "../../components/PageLoader";
import ErrorState from "../../components/ErrorState";
import Pagination from "../../components/Pagination";
import Modal from "../../components/admin/Modal";
import { ORDER_STATUSES, PAYMENT_STATUSES, PLACEHOLDER_IMAGE } from "../../utils/constants";
import { formatDate, formatDateTime, formatMoney, statusLabel } from "../../utils/format";

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "INDIAN", label: "Indian" },
  { value: "INTERNATIONAL", label: "International" },
];

// One select for the order-status and payment filters (Pending … Cancelled, Payment Pending, Paid).
const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  ...ORDER_STATUSES.map((s) => ({ value: `status:${s}`, label: statusLabel(s) })),
  { value: "payment:pending", label: "Payment Pending" },
  { value: "payment:paid", label: "Paid" },
];

const methodLabel = (m) => (m === "cod" ? "COD" : m === "razorpay" ? "Razorpay" : statusLabel(m || ""));

const filterParams = (type, filter) => {
  const [kind, value] = filter.split(":");
  return {
    customerType: type,
    status: kind === "status" ? value : "",
    paymentStatus: kind === "payment" ? value : "",
  };
};

function Section({ title, children }) {
  return (
    <div className="panel admin-order-section">
      <h2 className="panel-title">{title}</h2>
      {children}
    </div>
  );
}

function OrderModal({ id, onClose, onChanged }) {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => adminGetOrder(id), [id]);
  const [form, setForm] = useState({ status: "", paymentStatus: "", note: "", courier: "", trackingNumber: "" });
  const [busy, setBusy] = useState(false);
  const order = data?.data?.order;
  const s = order?.sections;
  const currency = order?.currency || "INR";
  const money = (n) => formatMoney(n, currency);

  const update = async (e) => {
    e.preventDefault();
    const body = {};
    if (form.status && form.status !== order.status) body.status = form.status;
    if (form.paymentStatus && form.paymentStatus !== order.paymentStatus) body.paymentStatus = form.paymentStatus;
    if (form.note.trim()) body.note = form.note.trim();
    if (form.courier.trim() && form.courier.trim() !== (order.courier || "")) body.courier = form.courier.trim();
    if (form.trackingNumber.trim() && form.trackingNumber.trim() !== (order.trackingNumber || "")) body.trackingNumber = form.trackingNumber.trim();
    if (!Object.keys(body).length) return toast.info("Nothing to update.");
    setBusy(true);
    try {
      await adminUpdateOrderStatus(id, body);
      toast.success("Order updated — the customer sees the new status in My Orders");
      setForm({ status: "", paymentStatus: "", note: "", courier: "", trackingNumber: "" });
      reload();
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={order ? order.orderNumber : "Order"} onClose={onClose} wide>
      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          <p className="muted">
            Placed {formatDateTime(order.createdAt)} ·{" "}
            <span className={`pill pill-type-${order.customerType}`}>{order.customerType === "INTERNATIONAL" ? "International" : "Indian"}</span>
          </p>

          <form className="panel status-form" onSubmit={update}>
            <h2 className="panel-title">Order Status</h2>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="field">Order status
                  <select value={form.status || order.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {ORDER_STATUSES.map((st) => <option key={st} value={st}>{statusLabel(st)}</option>)}
                  </select>
                </label>
              </div>
              <div className="col-md-6">
                <label className="field">Payment status
                  <select value={form.paymentStatus || order.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                    {PAYMENT_STATUSES.map((st) => <option key={st} value={st}>{statusLabel(st)}</option>)}
                  </select>
                </label>
              </div>
              <div className="col-md-4"><label className="field">Courier<input value={form.courier || order.courier || ""} onChange={(e) => setForm({ ...form, courier: e.target.value })} placeholder="e.g. DHL" /></label></div>
              <div className="col-md-4"><label className="field">Tracking number<input value={form.trackingNumber || order.trackingNumber || ""} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} /></label></div>
              <div className="col-md-4"><label className="field">Note (shown in history)<input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Handed to courier" /></label></div>
            </div>
            <button className="btn-jmc btn-jmc-primary btn-sm-jmc" disabled={busy}>{busy ? "Saving…" : "Update Order"}</button>
          </form>

          <div className="row g-4 mt-1">
            <div className="col-lg-6">
              <Section title="Customer">
                <dl className="kv">
                  <dt>Name</dt><dd>{s.customer.name || "—"}</dd>
                  <dt>Phone</dt><dd>{s.customer.phone || "—"}</dd>
                  <dt>Email</dt><dd>{s.customer.email || "—"}</dd>
                </dl>
              </Section>
            </div>
            <div className="col-lg-6">
              <Section title="Address">
                <dl className="kv">
                  <dt>Full address</dt><dd>{[s.delivery.addressLine1, s.delivery.addressLine2].filter(Boolean).join(", ") || "—"}</dd>
                  <dt>City</dt><dd>{s.delivery.city || "—"}</dd>
                  <dt>State</dt><dd>{s.delivery.state || "—"}</dd>
                  <dt>Country</dt><dd>{s.delivery.country || "—"}</dd>
                  <dt>Postal code</dt><dd>{s.delivery.postalCode || "—"}</dd>
                </dl>
              </Section>
            </div>
          </div>

          <Section title="Products">
            <div className="table-wrap">
              <table className="admin-table">
                <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit price</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {s.products.map((p, i) => (
                    <tr key={i}>
                      <td><div className="cell-product"><img className="thumb" src={p.image || PLACEHOLDER_IMAGE} alt="" />{p.product}</div></td>
                      <td>{p.sku}</td>
                      <td>{p.quantity}</td>
                      <td>{money(p.unitPrice)}</td>
                      <td>{money(p.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="row g-4 mt-1">
            <div className="col-lg-6">
              <Section title="Payment">
                <dl className="kv">
                  <dt>Method</dt><dd>{methodLabel(s.payment.method)}</dd>
                  <dt>Status</dt><dd><span className={`pill pill-pay-${s.payment.status}`}>{statusLabel(s.payment.status)}</span></dd>
                  {s.payment.razorpayOrderId && <><dt>Razorpay order</dt><dd>{s.payment.razorpayOrderId}</dd></>}
                  {s.payment.razorpayPaymentId && <><dt>Razorpay payment</dt><dd>{s.payment.razorpayPaymentId}</dd></>}
                </dl>
              </Section>
            </div>
            <div className="col-lg-6">
              <Section title="Total">
                <dl className="kv">
                  <dt>Subtotal</dt><dd>{money(s.order.subtotal)}</dd>
                  {s.order.discount > 0 && <><dt>Discount</dt><dd>− {money(s.order.discount)}</dd></>}
                  <dt>Shipping</dt><dd>{s.order.shipping > 0 ? money(s.order.shipping) : "Free"}</dd>
                  <dt>Total</dt><dd><strong>{money(s.order.total)}</strong></dd>
                  <dt>Currency</dt><dd>{s.order.currency}</dd>
                </dl>
              </Section>
            </div>
          </div>

          <Section title="History">
            <ol className="timeline">
              {[...(order.statusHistory || [])].reverse().map((h, i) => (
                <li key={i} className={i === 0 ? "current" : ""}>
                  <strong>{statusLabel(h.status)}</strong>
                  {h.note && <span> — {h.note}</span>}
                  <div className="muted small">{formatDateTime(h.at)}</div>
                </li>
              ))}
            </ol>
          </Section>
        </>
      )}
    </Modal>
  );
}

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const { data, loading, error, reload } = useAsync(
    () => adminGetOrders({ page, limit: 20, search, ...filterParams(type, filter) }),
    [page, type, filter, search]
  );
  usePolling(() => reload(true), 45000);
  const orders = data?.data?.orders || [];

  return (
    <>
      <div className="admin-head"><h1>Orders</h1></div>

      <div className="order-type-chips" role="group" aria-label="Customer type">
        {TYPE_FILTERS.map((t) => (
          <button key={t.value || "all"} type="button" className={type === t.value ? "active" : ""} onClick={() => { setType(t.value); setPage(1); }}>
            {t.label}
          </button>
        ))}
      </div>

      <form className="admin-filters" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); }}>
        <input placeholder="Search order ID, customer, email, phone or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} aria-label="Status filter">
          {STATUS_FILTERS.map((f) => <option key={f.value || "all"} value={f.value}>{f.label}</option>)}
        </select>
        <button className="btn-jmc btn-jmc-primary btn-sm-jmc">Search</button>
      </form>

      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Order ID</th><th>Customer</th><th>Country</th><th>Date</th><th>Total</th><th>Payment method</th><th>Payment status</th><th>Order status</th><th /></tr>
              </thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan={9} className="muted text-center">No orders found.</td></tr>}
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      {o.orderNumber}
                      <div><span className={`pill pill-type-${o.customerType}`}>{o.customerType === "INTERNATIONAL" ? "International" : "Indian"}</span></div>
                    </td>
                    <td>
                      {o.sections?.customer?.name || o.user?.name || "—"}
                      <div className="muted small">{o.sections?.customer?.email || o.user?.email || ""}</div>
                    </td>
                    <td>{o.country || o.shippingAddress?.country || "—"}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>{formatMoney(o.total, o.currency || "INR")}</td>
                    <td>{methodLabel(o.paymentMethod)}</td>
                    <td><span className={`pill pill-pay-${o.paymentStatus}`}>{statusLabel(o.paymentStatus)}</span></td>
                    <td><span className={`pill pill-${o.status}`}>{statusLabel(o.status)}</span></td>
                    <td><button className="link-btn" onClick={() => setOpenId(o.id)}>Manage</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={data.data.pagination} onPage={setPage} />
        </>
      )}
      {openId && <OrderModal id={openId} onClose={() => setOpenId(null)} onChanged={() => reload(true)} />}
    </>
  );
}
