import { getProducts } from "../api/products";
import useAsync from "../hooks/useAsync";
import ProductCard from "./ProductCard";

/** Other pieces from the same category (and subcategory first, when available). */
export default function RelatedProducts({ product }) {
  const { data } = useAsync(
    () => getProducts({ category: product.category, limit: 8 }),
    [product.id, product.category]
  );
  const all = (data?.data?.products || []).filter((p) => p.id !== product.id);
  const same = all.filter((p) => product.subcategorySlug && p.subcategorySlug === product.subcategorySlug);
  const related = [...same, ...all.filter((p) => !same.includes(p))].slice(0, 4);
  if (!related.length) return null;

  return (
    <section className="section section-cream related">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">You May Also Like</span>
          <h2 className="display">Related Pieces</h2>
          <span className="gold-rule" />
        </div>
        <div className="product-grid">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
