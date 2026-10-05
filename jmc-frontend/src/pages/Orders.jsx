import { useState } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../api/orders";
import useAsync from "../hooks/useAsync";
import PageLoader from "../components/PageLoader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import { formatDate, formatPrice, statusLabel } from "../utils/format";

export default function Orders() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => getOrders({ page, limit: 10 }), [page]);
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
              {orders.map((o) => (
                <Link to={`/orders/${o.id}`} className="order-row" key={o.id}>
                  <div>
                    <strong>{o.orderNumber}</strong>
                    <div className="muted small">{formatDate(o.createdAt)} · {o.items?.length || 0} item(s)</div>
                  </div>
                  <span className={`pill pill-${o.status}`}>{statusLabel(o.status)}</span>
                  <strong>{formatPrice(o.total)}</strong>
                </Link>
              ))}
              <Pagination pagination={data.data.pagination} onPage={setPage} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
