import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiBarChart2, FiBox, FiGrid, FiImage, FiLayers, FiLogOut, FiMenu, FiMessageCircle, FiPackage,
  FiPercent, FiSettings, FiShoppingBag, FiStar, FiTruck, FiUser, FiUsers, FiMapPin,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

// Admin-only navigation. The customer header/footer are never rendered inside the admin panel.
const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: FiGrid },
  {
    label: "Products", icon: FiBox,
    children: [
      { to: "/admin/products", label: "All Products", end: true },
      { to: "/admin/products/new", label: "Add Product" },
    ],
  },
  {
    label: "Categories", icon: FiLayers,
    children: [
      { to: "/admin/categories", label: "All Categories", end: true },
      { to: "/admin/categories/new", label: "Add Category" },
    ],
  },
  { to: "/admin/users", label: "Users Management", icon: FiUsers },
  { to: "/admin/enquiries", label: "Enquiries", icon: FiMessageCircle },
  { to: "/admin/orders", label: "Orders", icon: FiShoppingBag },
  { to: "/admin/reviews", label: "Reviews", icon: FiStar },
  { to: "/admin/coupons", label: "Coupons", icon: FiPercent },
  { to: "/admin/stores", label: "Stores", icon: FiMapPin },
  { to: "/admin/shipping", label: "Shipping", icon: FiTruck },
  { to: "/admin/analytics", label: "Analytics", icon: FiBarChart2 },
  { to: "/admin/inventory", label: "Inventory", icon: FiPackage },
  { to: "/admin/banners", label: "Banners", icon: FiImage },
  { to: "/admin/settings", label: "Settings", icon: FiSettings },
  { to: "/admin/profile", label: "Admin Profile", icon: FiUser },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const close = () => setOpen(false);

  return (
    <div className="admin-shell">
      <aside className={`admin-side ${open ? "open" : ""}`}>
        <div className="admin-brand">
          <span>JMC</span>
          <small>Admin Panel</small>
        </div>
        <nav>
          {NAV.map((item) =>
            item.children ? (
              <div className="nav-group" key={item.label}>
                <div className="nav-group-label"><item.icon /> {item.label}</div>
                {item.children.map((c) => (
                  <NavLink key={c.to} to={c.to} end={c.end} className="sub" onClick={close}>
                    {c.label}
                  </NavLink>
                ))}
              </div>
            ) : (
              <NavLink key={item.to} to={item.to} onClick={close}>
                <item.icon /> {item.label}
              </NavLink>
            )
          )}
        </nav>
        <button
          className="admin-logout"
          onClick={() => {
            logout();
            navigate("/admin/login", { replace: true });
          }}
        >
          <FiLogOut /> Logout
        </button>
      </aside>
      {open && <div className="admin-backdrop" onClick={close} />}
      <div className="admin-main">
        <div className="admin-topbar">
          <button className="icon-btn admin-menu" onClick={() => setOpen(!open)} aria-label="Menu">
            <FiMenu />
          </button>
          <span className="admin-who">{user?.name || user?.email} · Administrator</span>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
