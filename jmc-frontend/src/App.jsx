import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { CART_ENABLED } from "./utils/constants";
import { ToastProvider } from "./context/ToastContext";
import { SettingsProvider } from "./context/SettingsContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { CategoriesProvider } from "./context/CategoriesContext";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ScrollToTop from "./components/ScrollToTop";
import PageLoader from "./components/PageLoader";

const Home = lazy(() => import("./pages/Home"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const NewArrivals = lazy(() => import("./pages/NewArrivals"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductForm = lazy(() => import("./pages/admin/AdminProductForm"));
const AdminEnquiries = lazy(() => import("./pages/admin/AdminEnquiries"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminStores = lazy(() => import("./pages/admin/AdminStores"));
const AdminShipping = lazy(() => import("./pages/admin/AdminShipping"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <CategoriesProvider>
          <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <ScrollToTop />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route element={<MainLayout />}>
                        {/* Public */}
                        <Route path="/" element={<Home />} />
                        <Route path="/jadau-jewellery" element={<CategoryPage slug="jadau-jewellery" />} />
                        <Route path="/jadau-jewellery/:subcategory" element={<CategoryPage slug="jadau-jewellery" />} />
                        <Route path="/american-diamond" element={<CategoryPage slug="american-diamond" />} />
                        <Route path="/american-diamond/:subcategory" element={<CategoryPage slug="american-diamond" />} />
                        <Route path="/new-arrivals" element={<NewArrivals />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Customer (login required) */}
                        <Route element={<ProtectedRoute />}>
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/account" element={<Navigate to="/profile" replace />} />
                          <Route path="/wishlist" element={<Wishlist />} />
                          <Route path="/cart" element={CART_ENABLED ? <Cart /> : <Navigate to="/" replace />} />
                          <Route path="/checkout" element={CART_ENABLED ? <Checkout /> : <Navigate to="/" replace />} />
                          <Route path="/orders" element={<Orders />} />
                          <Route path="/orders/:id" element={<OrderDetail />} />
                        </Route>
                        <Route path="*" element={<NotFound />} />
                      </Route>

                      {/* Admin */}
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route element={<AdminRoute />}>
                        <Route element={<AdminLayout />}>
                          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                          <Route path="/admin/dashboard" element={<Dashboard />} />
                          <Route path="/admin/products" element={<AdminProducts />} />
                          <Route path="/admin/products/new" element={<AdminProductForm />} />
                          <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
                          <Route path="/admin/categories" element={<AdminCategories key="list" />} />
                          <Route path="/admin/categories/new" element={<AdminCategories key="new" />} />
                          <Route path="/admin/inventory" element={<AdminInventory />} />
                          <Route path="/admin/orders" element={<AdminOrders />} />
                          <Route path="/admin/users" element={<AdminUsers />} />
                          <Route path="/admin/enquiries" element={<AdminEnquiries />} />
                          <Route path="/admin/reviews" element={<AdminReviews />} />
                          <Route path="/admin/stores" element={<AdminStores />} />
                          <Route path="/admin/shipping" element={<AdminShipping />} />
                          <Route path="/admin/banners" element={<AdminBanners />} />
                          <Route path="/admin/coupons" element={<AdminCoupons />} />
                          <Route path="/admin/settings" element={<AdminSettings />} />
                          <Route path="/admin/profile" element={<AdminProfile />} />
                          <Route path="/admin/analytics" element={<AdminAnalytics />} />
                        </Route>
                      </Route>
                    </Routes>
                  </Suspense>
                </WishlistProvider>
              </CartProvider>
          </AuthProvider>
        </CategoriesProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
