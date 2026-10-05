import { useState } from "react";
import { adminGetInventory, adminSetStock } from "../../api/admin";
import useAsync from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import PageLoader from "../../components/PageLoader";
import ErrorState from "../../components/ErrorState";
import Pagination from "../../components/Pagination";
import { productImage } from "../../utils/format";

export default function AdminInventory() {
  const [threshold, setThreshold] = useState(5);
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({});
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => adminGetInventory({ threshold, page, limit: 20 }), [threshold, page]);
  const products = data?.data?.products || [];

  const save = async (p) => {
    const stock = Number(draft[p.id]);
    if (!Number.isInteger(stock) || stock < 0) return toast.error("Enter a whole number of 0 or more.");
    try {
      await adminSetStock(p.id, stock);
      toast.success("Stock updated");
      setDraft((d) => {
        const n = { ...d };
        delete n[p.id];
        return n;
      });
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <div className="admin-head">
        <h1>Inventory</h1>
        <label className="inline-field">
          Low-stock threshold
          <input type="number" min="0" value={threshold} onChange={(e) => { setThreshold(Math.max(0, Number(e.target.value) || 0)); setPage(1); }} />
        </label>
      </div>
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Update</th></tr></thead>
              <tbody>
                {products.length === 0 && <tr><td colSpan={4} className="muted text-center">No products at or below {threshold} units.</td></tr>}
                {products.map((p) => (
                  <tr key={p.id}>
                    <td><div className="cell-product"><img className="thumb" src={productImage(p)} alt="" />{p.name}</div></td>
                    <td>{p.sku}</td>
                    <td><span className={`pill ${p.stock === 0 ? "pill-cancelled" : "pill-pending"}`}>{p.stock}</span></td>
                    <td>
                      <div className="stock-edit">
                        <input type="number" min="0" placeholder="New stock" value={draft[p.id] ?? ""} onChange={(e) => setDraft({ ...draft, [p.id]: e.target.value })} />
                        <button className="btn-jmc btn-jmc-primary btn-sm-jmc" disabled={draft[p.id] === undefined || draft[p.id] === ""} onClick={() => save(p)}>Save</button>
                      </div>
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
