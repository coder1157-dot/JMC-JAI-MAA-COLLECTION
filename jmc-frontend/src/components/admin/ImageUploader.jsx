import { useRef, useState } from "react";
import { uploadImage } from "../../api/admin";
import { useToast } from "../../context/ToastContext";

/**
 * Signed Cloudinary upload (POST /admin/uploads/signature → Cloudinary → secure_url).
 * `value` is an ordered array of { url, publicId, alt }. The first image is the MAIN image.
 * Supports multiple upload, preview, remove, reorder and "make main".
 * `single` stores/returns just one image (used for category/banner images).
 */
export default function ImageUploader({ value = [], onChange, folder = "jmc/products", single = false }) {
  const input = useRef(null);
  const [pending, setPending] = useState([]); // local previews while uploading
  const toast = useToast();

  const onFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const previews = files.map((f) => ({ name: f.name, src: URL.createObjectURL(f) }));
    setPending(previews);
    let next = single ? [] : [...value];
    let failed = 0;
    for (const f of single ? files.slice(0, 1) : files) {
      try {
        next = [...next, await uploadImage(f, folder)];
        onChange(single ? next.slice(0, 1) : next);
      } catch (e) {
        failed += 1;
        toast.error(`${f.name}: ${e.message}`);
      }
    }
    previews.forEach((p) => URL.revokeObjectURL(p.src));
    setPending([]);
    if (input.current) input.current.value = "";
    if (!failed) toast.success(files.length > 1 ? "Images uploaded" : "Image uploaded");
  };

  const move = (from, to) => {
    if (to < 0 || to >= value.length) return;
    const arr = [...value];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr);
  };

  return (
    <div className="uploader">
      <div className="uploader-thumbs">
        {value.map((im, i) => (
          <div key={im.url + i} className={`uploader-thumb ${i === 0 && !single ? "main" : ""}`}>
            <img src={im.url} alt="" />
            {!single && i === 0 && <span className="main-tag">Main</span>}
            <button type="button" className="rm" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove image">×</button>
            {!single && value.length > 1 && (
              <div className="thumb-tools">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier">←</button>
                {i !== 0 && <button type="button" onClick={() => move(i, 0)} title="Make main image">★</button>}
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label="Move later">→</button>
              </div>
            )}
          </div>
        ))}
        {pending.map((p) => (
          <div key={p.src} className="uploader-thumb uploading">
            <img src={p.src} alt="" />
            <span className="main-tag">Uploading…</span>
          </div>
        ))}
      </div>
      <input ref={input} type="file" accept="image/*" multiple={!single} hidden onChange={(e) => onFiles(e.target.files)} />
      <button type="button" className="btn-jmc btn-jmc-outline btn-sm-jmc" disabled={pending.length > 0} onClick={() => input.current?.click()}>
        {pending.length ? "Uploading…" : single ? "Upload image" : "Add images"}
      </button>
      {!single && value.length > 0 && <p className="muted small mt-2">The first image is the main image. Use ← → to reorder or ★ to make an image the main one.</p>}
    </div>
  );
}
