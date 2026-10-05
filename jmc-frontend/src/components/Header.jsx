import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiHeart, FiMenu, FiSearch, FiShoppingBag, FiUser, FiX, FiChevronDown } from "react-icons/fi";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useCategories } from "../context/CategoriesContext";
import { CART_ENABLED } from "../utils/constants";

const NAV = [
  { label: "Home", to: "/", end: true },
  { label: "Jadau Jewellery", to: "/jadau-jewellery", cat: "jadau-jewellery" },
  { label: "American Diamond", to: "/american-diamond", cat: "american-diamond" },
  { label: "New Arrivals", to: "/new-arrivals" },
  { label: "About JMC", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expanded, setExpanded] = useState("");
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const wishlist = useWishlist();
  const { categories } = useCategories();

  const subsOf = (slug) => categories.find((c) => c.slug === slug)?.subcategories || [];
  const close = () => {
    setOpen(false);
    setSearchOpen(false);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setQ("");
    close();
  };

  return (
    <header className="site-header">
      <div className="announce-bar">Timeless Jewellery • Personal Consultation • International Enquiries</div>

      <div className="header-main">
        <div className="container header-inner">
          <button className="icon-btn menu-toggle" onClick={() => setOpen(true)} aria-label="Open menu">
            <FiMenu />
          </button>

          <Logo />

          <nav className="desktop-nav" aria-label="Main">
            {NAV.map((n) => (
              <div className="nav-item" key={n.to}>
                <NavLink to={n.to} end={n.end} className="nav-link-jmc">
                  {n.label}
                  {n.cat && subsOf(n.cat).length > 0 && <FiChevronDown className="chev" />}
                </NavLink>
                {n.cat && subsOf(n.cat).length > 0 && (
                  <div className="mega">
                    <div className="mega-grid">
                      {subsOf(n.cat).map((s) => (
                        <Link key={s.slug} to={`${n.to}/${s.slug}`}>
                          {s.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="header-actions">
            <button className="icon-btn" onClick={() => setSearchOpen((s) => !s)} aria-label="Search">
              <FiSearch />
            </button>
            <Link to="/wishlist" className="icon-btn hide-xs" aria-label="Wishlist">
              <FiHeart />
              {wishlist.count > 0 && <span className="count-dot">{wishlist.count}</span>}
            </Link>
            <Link to={isAdmin ? "/admin/dashboard" : isAuthenticated ? "/profile" : "/login"} className="icon-btn hide-sm" aria-label="Account">
              <FiUser />
            </Link>
            {CART_ENABLED && (
              <Link to="/cart" className="icon-btn" aria-label="Cart">
                <FiShoppingBag />
                {totalItems > 0 && <span className="count-dot">{totalItems}</span>}
              </Link>
            )}
          </div>
        </div>

        {searchOpen && (
          <form className="search-drawer" onSubmit={submitSearch}>
            <div className="container">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jewellery…" aria-label="Search jewellery" />
              <button type="submit" className="btn-jmc btn-jmc-primary btn-sm-jmc">
                Search
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Mobile drawer */}
      <div className={`drawer-backdrop ${open ? "show" : ""}`} onClick={close} />
      <aside className={`mobile-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <Logo />
          <button className="icon-btn" onClick={close} aria-label="Close menu">
            <FiX />
          </button>
        </div>
        <nav>
          {NAV.map((n) => (
            <div key={n.to} className="drawer-item">
              <div className="drawer-row">
                <NavLink to={n.to} end={n.end} onClick={close}>
                  {n.label}
                </NavLink>
                {n.cat && subsOf(n.cat).length > 0 && (
                  <button className="icon-btn" onClick={() => setExpanded(expanded === n.cat ? "" : n.cat)} aria-label="Toggle subcategories">
                    <FiChevronDown style={{ transform: expanded === n.cat ? "rotate(180deg)" : "none" }} />
                  </button>
                )}
              </div>
              {n.cat && expanded === n.cat && (
                <div className="drawer-sub">
                  {subsOf(n.cat).map((s) => (
                    <Link key={s.slug} to={`${n.to}/${s.slug}`} onClick={close}>
                      {s.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="drawer-item">
            <div className="drawer-row">
              <Link to="/wishlist" onClick={close}>
                Wishlist
              </Link>
            </div>
          </div>
          <div className="drawer-item">
            <div className="drawer-row">
              <Link to={isAdmin ? "/admin/dashboard" : isAuthenticated ? "/profile" : "/login"} onClick={close}>
                {isAdmin ? "Admin Panel" : isAuthenticated ? "My Account" : "Sign In / Register"}
              </Link>
            </div>
          </div>
        </nav>
      </aside>
    </header>
  );
}
