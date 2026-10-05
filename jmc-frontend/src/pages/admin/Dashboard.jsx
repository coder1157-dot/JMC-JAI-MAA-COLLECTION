import { Link } from "react-router-dom";
import { adminGetCategories, adminGetProducts, getAnalytics } from "../../api/admin";
import useAsync from "../../hooks/useAsync";
import PageLoader from "../../components/PageLoader";
import ErrorState from "../../components/ErrorState";
import { formatDate, formatPrice, productImage, statusLabel } from "../../utils/format";

export function Totals({ totals, categories }) {
  const cards = [
    ["Total Products", totals.products],
    ...(categories != null ? [["Total Categories", categories]] : []),
    ["Total Users", totals.customers],
    ["Total Orders", totals.orders],
    ["Low Stock Products", totals.lowStockProducts],
    ["Revenue", formatPrice(totals.revenue)],
  ];
  return (
    <div className="stat-grid">
      {cards.map(([label, value]) => (
        <div className="stat" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

export function Bars({ data = {}, label = (k) => k }) {
  const entries = Object.entries(data);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  if (!entries.length) return <p className="muted">No data yet.</p>;
  return (
    <div className="bars">
      {entries.map(([k, n]) => (
        <div className="bar-row" key={k}>
          <span>{label(k)}</span>
          <div className="bar"><i style={{ width: `${(n / max) * 100}%` }} /></div>
          <b>{n}</b>
        </div>
      ))}
    </div>
  );
}
export const StatusBars = ({ ordersByStatus }) => <Bars data={ordersByStatus} label={statusLabel} />;

/** Product count per category, from real data: one count query per category. */
export function useCategoryCounts() {
  const cats = useAsync(adminGetCategories, []);
  const categories = cats.data?.data || [];
  const counts = useAsync(async () => {
    if (!categories.length) return {};
    const results = await Promise.all(categories.map((c) => adminGetProducts({ category: c.slug, limit: 1 })));
    return Object.fromEntries(categories.map((c, i) => [c.name, results[i].data.pagination.total]));
  }, [cats.data]);
  return { categories, countsByCategory: counts.data || {}, loading: cats.loading || counts.loading, error: cats.error };
}

export default function Dashboard() {
  const analytics = useAsync(getAnalytics, []);
  const recent = useAsync(() => adminGetProducts({ limit: 5 }), []);
  const { categories, countsByCategory, loading: catLoading } = useCategoryCounts();

  if (analytics.loading) return <PageLoader />;
  if (analytics.error) return <ErrorState message={analytics.error} onRetry={analytics.reload} />;
  const { totals, ordersByStatus, recentOrders = [] } = analytics.data.data;
  const recentProducts = recent.data?.data?.products || [];

  return (
    <>
      <div className="admin-head"><h1>Dashboard</h1></div>
      <Totals totals={totals} categories={catLoading ? null : categories.length} />

      <div className="row g-4 mt-1">
        <div className="col-lg-6">
          <div className="panel">
            <h2 className="panel-title">Recent Products</h2>
            {recent.loading ? <PageLoader /> : recentProducts.length === 0 ? <p className="muted">No products yet.</p> : (
              <ul className="recent-list">
                {recentProducts.map((p) => (
                  <li key={p.id}>
                    <img className="thumb" src={productImage(p)} alt="" />
                    <div className="grow"><strong>{p.name}</strong><small>{p.categoryName} · {p.sku}</small></div>
                    <span>{formatPrice(p.price)}</span>
                    <Link className="link-btn" to={`/admin/products/${p.id}/edit`}>Edit</Link>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/admin/products" className="link-btn">All products →</Link>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="panel">
            <h2 className="panel-title">Recent Orders</h2>
            {recentOrders.length === 0 ? <p className="muted">No orders yet.</p> : (
              <ul className="recent-list">
                {recentOrders.map((o) => (
                  <li key={o.id}>
                    <div className="grow"><strong>{o.orderNumber}</strong><small>{formatDate(o.createdAt)}</small></div>
                    <span className={`pill pill-${o.status}`}>{statusLabel(o.status)}</span>
                    <span>{formatPrice(o.total)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/admin/orders" className="link-btn">All orders →</Link>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="panel">
            <h2 className="panel-title">Products by Category</h2>
            {catLoading ? <PageLoader /> : <Bars data={countsByCategory} />}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="panel">
            <h2 className="panel-title">Orders by Status</h2>
            <StatusBars ordersByStatus={ordersByStatus} />
          </div>
        </div>
      </div>
      <p className="muted small mt-3">Enquiries are handled on WhatsApp and are not stored, so no enquiry totals are shown.</p>
    </>
  );
}
