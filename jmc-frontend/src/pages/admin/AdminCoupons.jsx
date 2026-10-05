import CrudPage from "../../components/admin/CrudPage";
import { adminCreateCoupon, adminDeleteCoupon, adminGetCoupons, adminUpdateCoupon } from "../../api/admin";
import { formatDate } from "../../utils/format";

const num = (v) => (v === "" || v == null ? undefined : Number(v));

export default function AdminCoupons() {
  return (
    <CrudPage
      title="Coupons"
      itemName="Coupon"
      load={adminGetCoupons}
      create={adminCreateCoupon}
      update={adminUpdateCoupon}
      remove={adminDeleteCoupon}
      defaults={{ code: "", type: "percent", value: "", minOrderAmount: "", maxDiscount: "", usageLimit: "", expiresAt: "", description: "", active: true }}
      toForm={(c) => ({
        code: c.code,
        type: c.type,
        value: c.value ?? "",
        minOrderAmount: c.minOrderAmount ?? "",
        maxDiscount: c.maxDiscount ?? "",
        usageLimit: c.usageLimit ?? "",
        expiresAt: c.expiresAt ? String(c.expiresAt).slice(0, 10) : "",
        description: c.description || "",
        active: c.active !== false,
      })}
      toBody={(f) => {
        const body = {
          code: f.code.trim().toUpperCase(),
          type: f.type,
          value: Number(f.value),
          description: f.description,
          active: f.active,
        };
        const min = num(f.minOrderAmount), max = num(f.maxDiscount), lim = num(f.usageLimit);
        if (min !== undefined) body.minOrderAmount = min;
        if (max !== undefined) body.maxDiscount = max;
        if (lim !== undefined) body.usageLimit = lim;
        if (f.expiresAt) body.expiresAt = f.expiresAt;
        return body;
      }}
      columns={[
        { label: "Code", render: (c) => <strong>{c.code}</strong> },
        { label: "Discount", render: (c) => (c.type === "percent" ? `${c.value}%` : `₹${c.value}`) },
        { label: "Min order", render: (c) => (c.minOrderAmount ? `₹${c.minOrderAmount}` : "—") },
        { label: "Used", render: (c) => `${c.usedCount ?? 0}${c.usageLimit ? ` / ${c.usageLimit}` : ""}` },
        { label: "Expires", render: (c) => (c.expiresAt ? formatDate(c.expiresAt) : "—") },
        { label: "Active", render: (c) => (c.active ? "Yes" : "No") },
      ]}
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "type", label: "Type", type: "select", required: true, options: [{ value: "percent", label: "Percent (%)" }, { value: "fixed", label: "Fixed amount (₹)" }] },
        { name: "value", label: "Value", type: "number", required: true },
        { name: "minOrderAmount", label: "Minimum order amount (₹)", type: "number" },
        { name: "maxDiscount", label: "Maximum discount (₹)", type: "number" },
        { name: "usageLimit", label: "Usage limit", type: "number" },
        { name: "expiresAt", label: "Expires on", type: "date" },
        { name: "description", label: "Description" },
        { name: "active", label: "Active", type: "checkbox" },
      ]}
    />
  );
}
