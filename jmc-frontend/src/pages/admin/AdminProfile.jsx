import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function AdminProfile() {
  const { user, updateProfile, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || "", phone: user.phone || "" });
  }, [user]);

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
      <div className="admin-head"><h1>Admin Profile</h1></div>
      <form className="panel" style={{ maxWidth: 560 }} onSubmit={save}>
        <label className="field">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="field">Email<input value={user?.email || ""} disabled /></label>
        <label className="field">Role<input value={user?.role || ""} disabled /></label>
        <label className="field">Phone<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <div className="d-flex gap-2">
          <button className="btn-jmc btn-jmc-primary" disabled={busy}>{busy ? "Saving…" : "Save Changes"}</button>
          <button type="button" className="btn-jmc btn-jmc-outline" onClick={() => { logout(); navigate("/admin/login", { replace: true }); }}>Logout</button>
        </div>
      </form>
    </>
  );
}
