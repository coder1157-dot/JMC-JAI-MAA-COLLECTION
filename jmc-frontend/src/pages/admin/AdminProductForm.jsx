import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminCreateProduct, adminGetCategories, adminGetProduct, adminUpdateProduct } from "../../api/admin";
import useAsync from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import PageLoader from "../../components/PageLoader";
import ErrorState from "../../components/ErrorState";
import ImageUploader from "../../components/admin/ImageUploader";

const BLANK = {
  name: "", sku: "", category: "", subcategory: "", price: "", compareAtPrice: "", description: "",
  images: [], stock: 0, material: "", purity: "", stone: "",
  featured: false, newArrival: false, internationalShipping: false, active: true,
};

function ProductForm({ product, categories }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [f, setF] = useState(
    product
      ? { ...BLANK, ...product, compareAtPrice: product.compareAtPrice ?? "", images: product.images || [] }
      : { ...BLANK, category: categories[0]?.slug || "" }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const subs = categories.find((c) => c.slug === f.category)?.subcategories || [];

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = {
      name: f.name.trim(),
      sku: f.sku.trim(),
      category: f.category,
      subcategory: f.subcategory,
      price: Number(f.price),
      compareAtPrice: f.compareAtPrice === "" ? null : Number(f.compareAtPrice),
      description: f.description,
      images: f.images.map(({ url, publicId, alt }) => ({ url, publicId: publicId || "", alt: alt || "" })),
      stock: Number(f.stock) || 0,
      material: f.material,
      purity: f.purity,
      stone: f.stone,
      featured: f.featured,
      newArrival: f.newArrival,
      internationalShipping: f.internationalShipping,
      active: f.active,
    };
    try {
      if (product) await adminUpdateProduct(product.id, body);
      else await adminCreateProduct(body);
      toast.success("Product saved");
      navigate("/admin/products");
    } catch (err) {
      setError([err.message, ...(err.errors || []).filter((x) => x !== err.message)].join(" "));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <form onSubmit={submit}>
        {error && <div className="alert-jmc error">{error}</div>}
        <div className="row g-3">
          <div className="col-md-8"><label className="field">Name<input required value={f.name} onChange={set("name")} /></label></div>
          <div className="col-md-4"><label className="field">SKU<input required value={f.sku} onChange={set("sku")} /></label></div>
          <div className="col-md-6">
            <label className="field">Category
              <select required value={f.category} onChange={(e) => setF({ ...f, category: e.target.value, subcategory: "" })}>
                {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <div className="col-md-6">
            <label className="field">Subcategory
              <select value={f.subcategory} onChange={set("subcategory")}>
                <option value="">None</option>
                {subs.map((s) => <option key={s.slug} value={s.name}>{s.name}</option>)}
              </select>
            </label>
          </div>
          <div className="col-md-4"><label className="field">Price (₹) — admin only, never shown publicly<input required type="number" min="0" value={f.price} onChange={set("price")} /></label></div>
          <div className="col-md-4"><label className="field">Compare-at price (₹) — admin only<input type="number" min="0" value={f.compareAtPrice} onChange={set("compareAtPrice")} /></label></div>
          <div className="col-md-4"><label className="field">Stock<input type="number" min="0" value={f.stock} onChange={set("stock")} /></label></div>
          <div className="col-md-4"><label className="field">Material<input value={f.material} onChange={set("material")} /></label></div>
          <div className="col-md-4"><label className="field">Purity<input value={f.purity} onChange={set("purity")} /></label></div>
          <div className="col-md-4"><label className="field">Stone<input value={f.stone} onChange={set("stone")} /></label></div>
          <div className="col-12"><label className="field">Description<textarea rows={3} value={f.description} onChange={set("description")} /></label></div>
          <div className="col-12">
            <span className="field-label">Images (first = main image)</span>
            <ImageUploader value={f.images} onChange={(images) => setF({ ...f, images })} folder="jmc/products" />
          </div>
          <div className="col-12 checks">
            <label className="check"><input type="checkbox" checked={f.featured} onChange={set("featured")} /> Featured</label>
            <label className="check"><input type="checkbox" checked={f.newArrival} onChange={set("newArrival")} /> New Arrival</label>
            <label className="check"><input type="checkbox" checked={f.internationalShipping} onChange={set("internationalShipping")} /> International Shipping</label>
            <label className="check"><input type="checkbox" checked={f.active} onChange={set("active")} /> Active</label>
          </div>
        </div>
        <div className="d-flex gap-2 mt-3">
          <button className="btn-jmc btn-jmc-primary" disabled={busy}>{busy ? "Saving…" : "Save Product"}</button>
          <Link to="/admin/products" className="btn-jmc btn-jmc-outline">Cancel</Link>
        </div>
      </form>
    </div>
  );
}


export default function AdminProductForm() {
  const { id } = useParams();
  const cats = useAsync(adminGetCategories, []);
  const prod = useAsync(() => (id ? adminGetProduct(id) : Promise.resolve(null)), [id]);

  if (cats.loading || prod.loading) return <PageLoader />;
  if (cats.error) return <ErrorState message={cats.error} onRetry={cats.reload} />;
  if (prod.error) return <ErrorState message={prod.error} onRetry={prod.reload} />;
  const categories = cats.data?.data || [];
  const product = prod.data?.data?.product || null;

  return (
    <>
      <div className="admin-head"><h1>{id ? "Edit Product" : "Add Product"}</h1></div>
      {categories.length === 0 ? (
        <ErrorState message="Create a category first." />
      ) : (
        <ProductForm key={id || "new"} product={product} categories={categories} />
      )}
    </>
  );
}
