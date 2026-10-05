import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { homeFor, useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await login(form);
      // admin → /admin/dashboard, customer → /profile (or the page they came from)
      navigate(homeFor(res.data.user, from), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section auth-wrap">
      <div className="auth-card">
        <span className="eyebrow">Welcome back</span>
        <h1 className="display">Sign In</h1>
        {location.state?.notice && <div className="alert-jmc info">{location.state.notice}</div>}
        {error && <div className="alert-jmc error">{error}</div>}
        <form onSubmit={submit}>
          <label className="field">
            Email
            <input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="field">
            Password
            <input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <button className="btn-jmc btn-jmc-primary w-100" disabled={busy}>
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="auth-alt">
          New to JMC? <Link to="/register" state={{ from: location.state?.from }}>Create an account</Link>
        </p>
      </div>
    </section>
  );
}
