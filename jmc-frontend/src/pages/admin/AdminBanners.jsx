import CrudPage from "../../components/admin/CrudPage";
import { adminCreateBanner, adminDeleteBanner, adminGetBanners, adminUpdateBanner } from "../../api/admin";

export default function AdminBanners() {
  return (
    <CrudPage
      title="Banners"
      itemName="Banner"
      load={adminGetBanners}
      create={adminCreateBanner}
      update={adminUpdateBanner}
      remove={adminDeleteBanner}
      defaults={{ title: "", subtitle: "", image: "", link: "", position: "home-hero", active: true, sortOrder: 0 }}
      toBody={(f) => ({ ...f, sortOrder: Number(f.sortOrder) || 0 })}
      columns={[
        { label: "Image", render: (b) => <img className="thumb" src={b.image} alt="" /> },
        { label: "Title", render: (b) => b.title },
        { label: "Position", render: (b) => b.position },
        { label: "Order", render: (b) => b.sortOrder },
        { label: "Active", render: (b) => (b.active ? "Yes" : "No") },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "subtitle", label: "Subtitle" },
        { name: "image", label: "Image", type: "image", folder: "jmc/banners", required: true },
        { name: "link", label: "Link (e.g. /jadau-jewellery)" },
        { name: "position", label: "Position", placeholder: "home-hero" },
        { name: "sortOrder", label: "Sort order", type: "number" },
        { name: "active", label: "Active", type: "checkbox" },
      ]}
    />
  );
}
