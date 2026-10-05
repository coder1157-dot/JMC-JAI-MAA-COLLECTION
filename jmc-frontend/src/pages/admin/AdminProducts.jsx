import { useState } from "react";
import { Link } from "react-router-dom";
import { adminDeleteProduct, adminGetProducts, adminUpdateProduct } from "../../api/admin";
import useAsync from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import PageLoader from "../../components/PageLoader";
import ErrorState from "../../components/ErrorState";
import Pagination from "../../components/Pagination";
import { formatPrice, productImage } from "../../utils/format";

export default function AdminProducts() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");

  const { data, loading, error, reload } = useAsync(() => adminGetProducts({ page, limit: 20, search, active }), [page, search, active]);
  const products = data?.data?.products || [];

  const toggleActive = async (p) => {
    try {
      await adminUpdateProduct(p.id, { active: !p.active });
      toast.success(p.active ? "Product deactivated" : "Product activated");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const del = async (p) => {
    if (!window.confirm(`Delete “${p.name}”? This cannot be undone.`)) return;
    try {
      await adminDeleteProduct(p.id);
      toast.success("Product deleted");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <div className="admin-head">
        <h1>All Products</h1>
        <Link to="/admin/products/new" className="btn-jmc btn-jmc-primary btn-sm-jmc">+ Add Product</Link>
      </div>
      <form className="admin-filters" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); }}>
        <input placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }}>
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button className="btn-jmc btn-jmc-primary btn-sm-jmc">Search</button>
      </form>
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price (internal)</th><th>Stock</th><th>Status</th><th /></tr></thead>
              <tbody>
                {products.length === 0 && <tr><td colSpan={7} className="muted text-center">No products found.</td></tr>}
                {products.map((p) => (
                  <tr key={p.id}>
                    <td><div className="cell-product"><img className="thumb" src={productImage(p)} alt="" />{p.name}</div></td>
                    <td>{p.sku}</td>
                    <td>{p.categoryName}{p.subcategory ? ` · ${p.subcategory}` : ""}</td>
                    <td>{formatPrice(p.price)}</td>
                    <td>{p.stock}</td>
                    <td><span className={`pill ${p.active ? "pill-delivered" : "pill-cancelled"}`}>{p.active ? "Active" : "Inactive"}</span></td>
                    <td className="row-actions">
                      <Link className="link-btn" to={`/admin/products/${p.id}/edit`}>Edit</Link>
                      <button className="link-btn" onClick={() => toggleActive(p)}>{p.active ? "Deactivate" : "Activate"}</button>
                      <button className="link-btn danger" onClick={() => del(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={data.data.pagination} onPage={setPage} />
        </>
      )}
    </>
  );
}
