import { Link } from "react-router-dom";
import useAsync from "../hooks/useAsync";
import ProductGrid from "./ProductGrid";
import { SkeletonGrid } from "./SkeletonCard";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";

export default function ProductSection({ eyebrow, title, fetcher, limit = 4, viewAll, tone = "" }) {
  const { data, loading, error, reload } = useAsync(() => fetcher({ limit }), []);
  const products = data?.data?.products || [];

  return (
    <section className={`section ${tone}`}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="display">{title}</h2>
          <span className="gold-rule" />
        </div>
        {loading ? (
          <SkeletonGrid count={limit} />
        ) : error ? (
          <ErrorState message="Unable to load products. Please try again." onRetry={reload} />
        ) : products.length === 0 ? (
          <EmptyState />
        ) : (
          <ProductGrid products={products} />
        )}
        {viewAll && (
          <div className="text-center mt-5">
            <Link to={viewAll} className="btn-jmc btn-jmc-outline">
              View All
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
