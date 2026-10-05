import { useLocation, useNavigate } from "react-router-dom";
import CrudPage from "../../components/admin/CrudPage";
import { adminCreateCategory, adminDeleteCategory, adminGetCategories, adminUpdateCategory } from "../../api/admin";

export default function AdminCategories() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const startNew = pathname.endsWith("/new");
  return (
    <CrudPage
      startNew={startNew}
      onDone={() => startNew && navigate("/admin/categories")}
      title="All Categories"
      itemName="Category"
      load={adminGetCategories}
      create={adminCreateCategory}
      update={adminUpdateCategory}
      remove={adminDeleteCategory}
      defaults={{ name: "", slug: "", description: "", image: "", subcategories: "", active: true, sortOrder: 0 }}
      toForm={(c) => ({
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image: c.image || "",
        subcategories: (c.subcategories || []).map((s) => s.name).join("\n"),
        active: c.active !== false,
        sortOrder: c.sortOrder ?? 0,
      })}
      toBody={(f) => {
        const body = {
          name: f.name.trim(),
          description: f.description,
          image: f.image,
          subcategories: String(f.subcategories).split("\n").map((s) => s.trim()).filter(Boolean),
          active: f.active,
          sortOrder: Number(f.sortOrder) || 0,
        };
        // slug is immutable on update; only send when creating (backend ignores otherwise)
        if (f.slug.trim()) body.slug = f.slug.trim();
        return body;
      }}
      columns={[
        { label: "Name", render: (c) => c.name },
        { label: "Slug", render: (c) => c.slug },
        { label: "Subcategories", render: (c) => (c.subcategories || []).length },
        { label: "Active", render: (c) => (c.active ? "Yes" : "No") },
        { label: "Order", render: (c) => c.sortOrder },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "slug", label: "Slug (leave blank to auto-generate; cannot change later)" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "image", label: "Image", type: "image", folder: "jmc/categories" },
        { name: "subcategories", label: "Subcategories (one per line)", type: "lines" },
        { name: "sortOrder", label: "Sort order", type: "number" },
        { name: "active", label: "Active", type: "checkbox" },
      ]}
    />
  );
}
