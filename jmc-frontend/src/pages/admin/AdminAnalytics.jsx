import { getAnalytics } from "../../api/admin";
import useAsync from "../../hooks/useAsync";
import PageLoader from "../../components/PageLoader";
import ErrorState from "../../components/ErrorState";
import { Bars, Totals, StatusBars, useCategoryCounts } from "./Dashboard";
import { formatPrice } from "../../utils/format";

export default function AdminAnalytics() {
  const { data, loading, error, reload } = useAsync(getAnalytics, []);
  const { categories, countsByCategory } = useCategoryCounts();
  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { totals, ordersByStatus } = data.data;
  const avg = totals.orders ? totals.revenue / totals.orders : 0;

  return (
    <>
      <div className="admin-head"><h1>Analytics</h1></div>
      <Totals totals={totals} categories={categories.length} />
      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <div className="panel">
            <h2 className="panel-title">Orders by Status</h2>
            <StatusBars ordersByStatus={ordersByStatus} />
          </div>
        </div>
        <div className="col-lg-5">
          <div className="panel mb-4">
            <h2 className="panel-title">Products by Category</h2>
            <Bars data={countsByCategory} />
          </div>
          <div className="panel">
            <h2 className="panel-title">Highlights</h2>
            <div className="sum-row"><span>Revenue (excl. cancelled/refunded)</span><span>{formatPrice(totals.revenue)}</span></div>
            <div className="sum-row"><span>Average per order</span><span>{formatPrice(Math.round(avg))}</span></div>
            <div className="sum-row"><span>Products low on stock</span><span>{totals.lowStockProducts}</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
