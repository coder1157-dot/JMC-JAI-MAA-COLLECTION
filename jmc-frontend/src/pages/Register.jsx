import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { homeFor, useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { name: form.name.trim(), email: form.email.trim(), password: form.password };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      const res = await register(payload);
      navigate(homeFor(res.data.user, from), { replace: true });
    } catch (err) {
      setError([err.message, ...(err.errors || []).filter((x) => x !== err.message)].join(" "));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section auth-wrap">
      <div className="auth-card">
        <span className="eyebrow">Join JMC</span>
        <h1 className="display">Create Account</h1>
        {error && <div className="alert-jmc error">{error}</div>}
        <form onSubmit={submit}>
          <label className="field">Full name<input required value={form.name} onChange={set("name")} autoComplete="name" /></label>
          <label className="field">Email<input type="email" required value={form.email} onChange={set("email")} autoComplete="email" /></label>
          <label className="field">Phone (optional)<input type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" /></label>
          <label className="field">Password (min. 8 characters)<input type="password" required minLength={8} value={form.password} onChange={set("password")} autoComplete="new-password" /></label>
          <button className="btn-jmc btn-jmc-primary w-100" disabled={busy}>{busy ? "Creating…" : "Create Account"}</button>
        </form>
        <p className="auth-alt">Already registered? <Link to="/login" state={{ from: location.state?.from }}>Sign in</Link></p>
      </div>
    </section>
  );
}
