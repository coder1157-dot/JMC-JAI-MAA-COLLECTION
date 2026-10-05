import { useState } from "react";
import { adminGetOrder, adminGetOrders, adminUpdateOrderStatus } from "../../api/admin";
import useAsync from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import PageLoader from "../../components/PageLoader";
import ErrorState from "../../components/ErrorState";
import Pagination from "../../components/Pagination";
import Modal from "../../components/admin/Modal";
import { OrderView } from "../OrderDetail";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../../utils/constants";
import { formatDate, formatPrice, statusLabel } from "../../utils/format";

function OrderModal({ id, onClose, onChanged }) {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => adminGetOrder(id), [id]);
  const [form, setForm] = useState({ status: "", paymentStatus: "", note: "" });
  const [busy, setBusy] = useState(false);
  const order = data?.data?.order;

  const update = async (e) => {
    e.preventDefault();
    const body = {};
    if (form.status && form.status !== order.status) body.status = form.status;
    if (form.paymentStatus && form.paymentStatus !== order.paymentStatus) body.paymentStatus = form.paymentStatus;
    if (form.note.trim()) body.note = form.note.trim();
    if (!Object.keys(body).length) return toast.info("Nothing to update.");
    setBusy(true);
    try {
      await adminUpdateOrderStatus(id, body);
      toast.success("Order updated");
      setForm({ status: "", paymentStatus: "", note: "" });
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
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          {order.user && <p className="muted">Customer: <strong>{order.user.name}</strong> · {order.user.email} {order.user.phone ? `· ${order.user.phone}` : ""}</p>}
          <form className="panel status-form" onSubmit={update}>
            <h2 className="panel-title">Update Order</h2>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="field">Order status
                  <select value={form.status || order.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                </label>
              </div>
              <div className="col-md-4">
                <label className="field">Payment status
                  <select value={form.paymentStatus || order.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                    {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                </label>
              </div>
              <div className="col-md-4"><label className="field">Note<input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Courier: …" /></label></div>
            </div>
            <button className="btn-jmc btn-jmc-primary btn-sm-jmc" disabled={busy}>{busy ? "Saving…" : "Update"}</button>
          </form>
          <div className="mt-4"><OrderView order={order} /></div>
        </>
      )}
    </Modal>
  );
}

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const { data, loading, error, reload } = useAsync(() => adminGetOrders({ page, limit: 20, status, search }), [page, status, search]);
  const orders = data?.data?.orders || [];

  return (
    <>
      <div className="admin-head"><h1>Orders</h1></div>
      <form className="admin-filters" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); }}>
        <input placeholder="Order number" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        <button className="btn-jmc btn-jmc-primary btn-sm-jmc">Search</button>
      </form>
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Payment</th><th>Status</th><th>Total</th><th /></tr></thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan={7} className="muted text-center">No orders found.</td></tr>}
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.orderNumber}</td>
                    <td>{o.user?.name || "—"}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>{o.paymentMethod.toUpperCase()} · {statusLabel(o.paymentStatus)}</td>
                    <td><span className={`pill pill-${o.status}`}>{statusLabel(o.status)}</span></td>
                    <td>{formatPrice(o.total)}</td>
                    <td><button className="link-btn" onClick={() => setOpenId(o.id)}>Manage</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={data.data.pagination} onPage={setPage} />
        </>
      )}
      {openId && <OrderModal id={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
    </>
  );
}
