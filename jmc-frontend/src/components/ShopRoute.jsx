import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCustomerType } from "../context/CustomerTypeContext";
import { useToast } from "../context/ToastContext";
import PageLoader from "./PageLoader";

/** /cart and /checkout exist for International customers only; Indian mode stays enquiry-only. */
export default function ShopRoute({ children }) {
  const { loading } = useAuth();
  const { canShop, syncing } = useCustomerType();
  const toast = useToast();
  const wait = loading || syncing;

  useEffect(() => {
    if (!wait && !canShop) toast.info("Cart and checkout are available when International Client is selected.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wait, canShop]);

  if (wait) return <PageLoader />;
  if (!canShop) return <Navigate to="/" replace />;
  return children;
}
