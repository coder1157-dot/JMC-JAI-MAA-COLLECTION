import { useState } from "react";
import useAsync from "../../hooks/useAsync";
import { useToast } from "../../context/ToastContext";
import PageLoader from "../PageLoader";
import ErrorState from "../ErrorState";
import Modal from "./Modal";
import ImageUploader from "./ImageUploader";

/**
 * Generic admin CRUD page.
 * fields: [{ name, label, type: text|number|textarea|checkbox|select|date|lines|image, required, options }]
 * columns: [{ label, render(row) }]
 * toForm(row) / toBody(form) let a page translate between API shape and form shape.
 */
export default function CrudPage({ title, itemName, load, create, update, remove, columns, fields, defaults, toForm, toBody, listFromRes = (r) => r.data, startNew = false, onDone }) {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(load, []);
  const [editing, setEditing] = useState(startNew ? "new" : null); // null | "new" | row
  const [form, setForm] = useState(startNew ? { ...defaults } : {});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const rows = data ? listFromRes(data) || [] : [];

  const openNew = () => {
    setForm({ ...defaults });
    setFormError("");
    setEditing("new");
  };
  const openEdit = (row) => {
    setForm(toForm ? toForm(row) : { ...defaults, ...row });
    setFormError("");
    setEditing(row);
  };
  const closeForm = () => {
    setEditing(null);
    onDone?.();
  };
  const set = (name, v) => setForm((f) => ({ ...f, [name]: v }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const body = toBody ? toBody(form) : form;
      if (editing === "new") await create(body);
      else await update(editing.id, body);
      toast.success(`${itemName} saved`);
      closeForm();
      reload();
    } catch (err) {
      setFormError([err.message, ...(err.errors || []).filter((x) => x !== err.message)].join(" "));
    } finally {
      setBusy(false);
    }
  };

  const del = async (row) => {
    if (!window.confirm(`Delete this ${itemName.toLowerCase()}?`)) return;
    try {
      await remove(row.id);
      toast.success(`${itemName} deleted`);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="admin-head">
        <h1>{title}</h1>
        <button className="btn-jmc btn-jmc-primary btn-sm-jmc" onClick={openNew}>+ New {itemName}</button>
      </div>
      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}<th /></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={columns.length + 1} className="text-center muted">Nothing here yet.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  {columns.map((c) => <td key={c.label}>{c.render(r)}</td>)}
                  <td className="row-actions">
                    <button className="link-btn" onClick={() => openEdit(r)}>Edit</button>
                    <button className="link-btn danger" onClick={() => del(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing === "new" ? `New ${itemName}` : `Edit ${itemName}`} onClose={closeForm}>
          <form onSubmit={save}>
            {formError && <div className="alert-jmc error">{formError}</div>}
            {fields.map((f) => {
              const v = form[f.name];
              if (f.type === "checkbox")
                return (
                  <label className="check" key={f.name}>
                    <input type="checkbox" checked={!!v} onChange={(e) => set(f.name, e.target.checked)} /> {f.label}
                  </label>
                );
              return (
                <label className="field" key={f.name}>
                  {f.label}
                  {f.type === "textarea" || f.type === "lines" ? (
                    <textarea rows={f.type === "lines" ? 6 : 3} required={f.required} value={v ?? ""} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />
                  ) : f.type === "select" ? (
                    <select required={f.required} value={v ?? ""} onChange={(e) => set(f.name, e.target.value)}>
                      {f.options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
                    </select>
                  ) : f.type === "image" ? (
                    <ImageUploader single folder={f.folder} value={v ? [{ url: v }] : []} onChange={(arr) => set(f.name, arr[0]?.url || "")} />
                  ) : (
                    <input type={f.type || "text"} required={f.required} min={f.type === "number" ? 0 : undefined} step={f.step} value={v ?? ""} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />
                  )}
                </label>
              );
            })}
            <div className="d-flex gap-2 mt-3">
              <button className="btn-jmc btn-jmc-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
              <button type="button" className="btn-jmc btn-jmc-outline" onClick={closeForm}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
