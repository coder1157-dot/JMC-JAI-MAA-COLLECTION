import { useSettings } from "../../context/SettingsContext";

export default function AdminSettings() {
  const { whatsapp, phone, email, address, social, loading, error } = useSettings();
  const rows = [
    ["WhatsApp", whatsapp], ["Phone", phone], ["Email", email], ["Address", address],
    ["Instagram", social?.instagram], ["Facebook", social?.facebook], ["YouTube", social?.youtube],
  ];
  return (
    <>
      <div className="admin-head"><h1>Settings</h1></div>
      <div className="panel">
        <h2 className="panel-title">Public contact details</h2>
        {error && !whatsapp && <div className="alert-jmc error">{error}</div>}
        <dl className="kv">
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{loading ? "…" : v || "—"}</dd></div>
          ))}
        </dl>
        <p className="muted small mt-3">These come from <code>GET /settings/contact</code> and are configured with <code>JMC_*</code> environment variables on the server (e.g. <code>JMC_WHATSAPP_NUMBER</code>). They cannot be edited from this screen.</p>
      </div>
    </>
  );
}
