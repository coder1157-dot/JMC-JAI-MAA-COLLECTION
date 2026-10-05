import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getNewArrivals, getProducts } from "../api/products";
import useAsync from "../hooks/useAsync";
import { useCategories } from "../context/CategoriesContext";
import { SORT_OPTIONS } from "../utils/constants";
import ProductGrid from "./ProductGrid";
import { SkeletonGrid } from "./SkeletonCard";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";

const PAGE_SIZE = 12;
const ROUTED = ["jadau-jewellery", "american-diamond"];

/**
 * Shared listing used by /jadau-jewellery, /american-diamond, /new-arrivals and /search.
 * Filtering, sorting and pagination are all done by the backend.
 */
export default function ProductListing({ eyebrow, title, intro, fixedCategory, mode = "all" }) {
  const [params, setParams] = useSearchParams();
  const routeParams = useParams();
  const navigate = useNavigate();
  const { categories } = useCategories();

  const category = fixedCategory || params.get("category") || "";
  const subcategory = fixedCategory ? routeParams.subcategory || "" : params.get("subcategory") || "";
  const search = params.get("q") || "";
  const sort = params.get("sort") || "newest";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [form, setForm] = useState({ q: search });
  useEffect(() => setForm({ q: search }), [search]);

  const query = { category, subcategory, search, sort, page, limit: PAGE_SIZE };
  const fetcher = mode === "new" ? getNewArrivals : getProducts;
  const { data, loading, error, reload } = useAsync(
    () => fetcher(query),
    [mode, category, subcategory, search, sort, page]
  );

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination;
  const subs = useMemo(() => categories.find((c) => c.slug === category)?.subcategories || [], [categories, category]);

  const patch = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  };

  const onCategory = (slug) => {
    if (fixedCategory) {
      navigate(ROUTED.includes(slug) ? `/${slug}` : `/search?category=${slug}`);
    } else {
      patch({ category: slug, subcategory: "" });
    }
  };
  const onSubcategory = (slug) => {
    if (fixedCategory) navigate(`/${fixedCategory}${slug ? `/${slug}` : ""}`);
    else patch({ subcategory: slug });
  };

  const apply = (e) => {
    e.preventDefault();
    patch({ q: form.q.trim() });
  };
  const clear = () => {
    if (fixedCategory) navigate(`/${fixedCategory}`);
    else setParams(new URLSearchParams());
  };

  const hasFilters = search || subcategory || sort !== "newest" || (!fixedCategory && category);
  const activeSub = subs.find((s) => s.slug === subcategory)?.name;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="display">{activeSub ? `${title} · ${activeSub}` : search ? `Results for “${search}”` : title}</h1>
          {intro && <p className="lead-text">{intro}</p>}
        </div>
      </section>

      <section className="section pt-4">
        <div className="container">
          <form className="filter-bar" onSubmit={apply}>
            <div className="filter-field grow">
              <label>Search Jewellery</label>
              <input value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} placeholder="Name, SKU, material, stone…" />
            </div>
            <div className="filter-field">
              <label>Category</label>
              <select value={category} onChange={(e) => onCategory(e.target.value)}>
                {!fixedCategory && <option value="">All categories</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label>Subcategory</label>
              <select value={subcategory} onChange={(e) => onSubcategory(e.target.value)} disabled={!subs.length}>
                <option value="">All</option>
                {subs.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label>Sort</label>
              <select value={sort} onChange={(e) => patch({ sort: e.target.value === "newest" ? "" : e.target.value })}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-actions">
              <button type="submit" className="btn-jmc btn-jmc-primary btn-sm-jmc">
                Apply
              </button>
              {hasFilters && (
                <button type="button" className="btn-jmc btn-jmc-outline btn-sm-jmc" onClick={clear}>
                  Clear Filters
                </button>
              )}
            </div>
          </form>

          {!loading && !error && pagination && (
            <p className="result-count">
              {pagination.total} {pagination.total === 1 ? "piece" : "pieces"} found
            </p>
          )}

          {loading ? (
            <SkeletonGrid count={8} />
          ) : error ? (
            <ErrorState message="Unable to load products. Please try again." onRetry={reload} />
          ) : products.length === 0 ? (
            <EmptyState title="No jewellery found." text="Try adjusting your search or clearing the filters." />
          ) : (
            <>
              <ProductGrid products={products} />
              <Pagination
                pagination={pagination}
                onPage={(p) => {
                  patch({ page: p > 1 ? String(p) : "" });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
