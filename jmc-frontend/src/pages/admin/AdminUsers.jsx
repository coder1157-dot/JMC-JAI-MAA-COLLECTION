import { useState } from "react";
import { adminGetUsers, adminSetUserStatus } from "../../api/admin";
import useAsync from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import PageLoader from "../../components/PageLoader";
import ErrorState from "../../components/ErrorState";
import Pagination from "../../components/Pagination";
import { formatDate } from "../../utils/format";

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => adminGetUsers({ page, limit: 20, role, search }), [page, role, search]);
  const users = data?.data?.users || [];

  const toggle = async (u) => {
    try {
      await adminSetUserStatus(u.id, !u.active);
      toast.success(u.active ? "User disabled" : "User enabled");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <div className="admin-head"><h1>Users</h1></div>
      <form className="admin-filters" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(q.trim()); }}>
        <input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </select>
        <button className="btn-jmc btn-jmc-primary btn-sm-jmc">Search</button>
      </form>
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Status</th><th /></tr></thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan={7} className="muted text-center">No users found.</td></tr>}
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td><td>{u.email}</td><td>{u.phone || "—"}</td><td>{u.role}</td><td>{formatDate(u.createdAt)}</td>
                    <td><span className={`pill ${u.active ? "pill-delivered" : "pill-cancelled"}`}>{u.active ? "Active" : "Disabled"}</span></td>
                    <td><button className="link-btn" onClick={() => toggle(u)}>{u.active ? "Disable" : "Enable"}</button></td>
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
