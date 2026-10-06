import { useState } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../api/orders";
import useAsync from "../hooks/useAsync";
import usePolling from "../hooks/usePolling";
import PageLoader from "../components/PageLoader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import { formatDate, formatMoney, statusLabel } from "../utils/format";
import { PLACEHOLDER_IMAGE } from "../utils/constants";

export default function Orders() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => getOrders({ page, limit: 10 }), [page]);
  usePolling(() => reload(true), 30000); // admin status changes show up without a manual refresh
  const orders = data?.data?.orders || [];

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Purchase History</span>
          <h1 className="display">My Orders</h1>
        </div>
      </section>
      <section className="section pt-4">
        <div className="container narrow-col wide">
          {loading ? (
            <PageLoader />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : orders.length === 0 ? (
            <EmptyState title="No orders yet." action={<Link to="/jadau-jewellery" className="btn-jmc btn-jmc-primary">Start Shopping</Link>} />
          ) : (
            <>
              {orders.map((o) => {
                const first = o.items?.[0];
                const more = (o.items?.length || 0) - 1;
                return (
                  <div className="order-row order-card" key={o.id}>
                    <img className="order-thumb" src={first?.image || PLACEHOLDER_IMAGE} alt="" />
                    <div className="order-main">
                      <strong>{o.orderNumber}</strong>
                      <div className="muted small">{formatDate(o.createdAt)}</div>
                      <div className="order-product">
                        {first?.name || "—"}
                        {more > 0 && <span className="muted"> + {more} more</span>}
                      </div>
                    </div>
                    <div className="order-pills">
                      <span className={`pill pill-${o.status}`}>{statusLabel(o.status)}</span>
                      <span className={`pill pill-pay-${o.paymentStatus}`}>Payment: {statusLabel(o.paymentStatus)}</span>
                    </div>
                    <div className="order-total">
                      <strong>{formatMoney(o.total, o.currency || "INR")}</strong>
                      <span className="muted small">{o.currency || "INR"}</span>
                    </div>
                    <Link to={`/orders/${o.id}`} className="btn-jmc btn-jmc-outline btn-sm-jmc">View Order</Link>
                  </div>
                );
              })}
              <Pagination pagination={data.data.pagination} onPage={setPage} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
