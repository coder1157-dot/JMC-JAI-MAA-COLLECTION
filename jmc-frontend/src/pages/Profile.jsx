import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { CART_ENABLED } from "../utils/constants";

export default function Profile() {
  const { user, isAdmin, updateProfile, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || "", phone: user.phone || "" });
  }, [user]);

  if (isAdmin) return <Navigate to="/admin/dashboard" replace />; // admins never see the customer profile

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim() });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">My Account</span>
          <h1 className="display">Hello, {user?.name?.split(" ")[0] || "there"}</h1>
        </div>
      </section>
      <section className="section">
        <div className="container narrow-col">
          <div className="quick-links">
            <Link to="/orders">My Orders</Link>
            <Link to="/wishlist">Wishlist</Link>
            {CART_ENABLED && <Link to="/cart">Cart</Link>}
          </div>
          <form className="panel" onSubmit={save}>
            <h2 className="panel-title">Profile</h2>
            <label className="field">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field">Email<input value={user?.email || ""} disabled /></label>
            <label className="field">Phone<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <button className="btn-jmc btn-jmc-primary" disabled={busy}>{busy ? "Saving…" : "Save Changes"}</button>
          </form>
          <div className="text-center mt-4">
            <button
              className="btn-jmc btn-jmc-outline"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
