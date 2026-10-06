import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { getCurrencies } from "../api/settings";
import { CURRENCY_KEY, CUSTOMER_TYPE_KEY } from "../api/axios";
import { CUSTOMER_TYPES } from "../utils/constants";

const CustomerTypeContext = createContext(null);
const CHOSEN_KEY = "jmc_customer_type_chosen"; // guest picked a mode explicitly → apply it to the account on login

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    if (value == null || value === "") localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
};
const valid = (t) => t === CUSTOMER_TYPES.INDIAN || t === CUSTOMER_TYPES.INTERNATIONAL;

/**
 * Indian / International customer mode (+ display currency for International).
 *
 * The backend decides prices and ordering by the ACCOUNT's customerType, so:
 *  - logged-in customers: the account's customerType is the source of truth; the header selector updates it
 *    through PUT /auth/profile (existing AuthContext.updateProfile).
 *  - guests: the choice is kept in localStorage; if they sign in afterwards it is applied to their account.
 */
export function CustomerTypeProvider({ children }) {
  const { user, isAuthenticated, isAdmin, updateProfile } = useAuth();
  const toast = useToast();
  const [guestType, setGuestType] = useState(() => (valid(read(CUSTOMER_TYPE_KEY)) ? read(CUSTOMER_TYPE_KEY) : CUSTOMER_TYPES.INDIAN));
  const [switching, setSwitching] = useState(false);
  const [currencyChoice, setCurrencyChoice] = useState(() => read(CURRENCY_KEY) || "");
  const [currencyInfo, setCurrencyInfo] = useState({ base: "INR", available: ["INR"], razorpay: [] });

  const accountType = isAuthenticated && !isAdmin && valid(user?.customerType) ? user.customerType : null;
  const customerType = accountType || guestType;

  // A guest choice that still has to be applied to the account that just signed in.
  const pendingSync =
    isAuthenticated && !isAdmin && !!user && read(CHOSEN_KEY) === "1" && valid(read(CUSTOMER_TYPE_KEY)) && read(CUSTOMER_TYPE_KEY) !== user.customerType;

  // On sign-in: adopt the guest's explicit choice (once), otherwise adopt the account's type.
  useEffect(() => {
    if (!isAuthenticated || isAdmin || !user) return;
    const wanted = read(CHOSEN_KEY) === "1" ? read(CUSTOMER_TYPE_KEY) : null;
    write(CHOSEN_KEY, null);
    if (valid(wanted) && wanted !== user.customerType) {
      setSwitching(true);
      updateProfile({ customerType: wanted })
        .catch((e) => toast.error(e.message))
        .finally(() => setSwitching(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, user?.id]);

  // Mirror the account's type locally (api/axios.js reads it to attach the display currency).
  useEffect(() => {
    if (accountType) {
      write(CUSTOMER_TYPE_KEY, accountType);
      setGuestType(accountType);
    }
  }, [accountType]);

  // Which currencies the backend can actually convert to (rates are never invented on the frontend).
  useEffect(() => {
    let alive = true;
    getCurrencies()
      .then((res) => {
        if (!alive) return;
        const d = res.data || {};
        const base = d.base || "INR";
        const available = d.available?.length ? d.available : [base];
        setCurrencyInfo({ base, available, razorpay: d.razorpay || [] });
        const stored = read(CURRENCY_KEY);
        if (stored && !available.includes(stored)) {
          write(CURRENCY_KEY, null);
          setCurrencyChoice("");
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const setCustomerType = useCallback(
    async (type) => {
      if (!valid(type) || type === customerType) return;
      if (isAuthenticated && !isAdmin) {
        setSwitching(true);
        try {
          await updateProfile({ customerType: type });
          toast.success(type === CUSTOMER_TYPES.INTERNATIONAL ? "International mode: prices and online ordering enabled." : "Indian mode: enquiry-only catalogue.");
        } catch (e) {
          toast.error(e.message);
        } finally {
          setSwitching(false);
        }
        return;
      }
      write(CUSTOMER_TYPE_KEY, type);
      write(CHOSEN_KEY, "1");
      setGuestType(type);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customerType, isAuthenticated, isAdmin, updateProfile]
  );

  const setCurrency = useCallback(
    (code) => {
      const next = !code || code === currencyInfo.base ? "" : code;
      write(CURRENCY_KEY, next);
      setCurrencyChoice(next);
    },
    [currencyInfo.base]
  );

  const currency = currencyChoice || currencyInfo.base;
  const isInternational = customerType === CUSTOMER_TYPES.INTERNATIONAL;

  const value = useMemo(
    () => ({
      customerType,
      isInternational,
      isIndian: !isInternational,
      // Cart / checkout are for International customers only (admins browse the catalogue, they do not shop).
      canShop: isInternational && !isAdmin,
      setCustomerType,
      switching,
      syncing: switching || pendingSync,
      currency,
      setCurrency,
      currencies: currencyInfo.available,
      baseCurrency: currencyInfo.base,
      razorpayCurrencies: currencyInfo.razorpay,
      // Changes whenever prices must be re-fetched (mode, currency or account).
      viewKey: `${customerType}|${currency}|${user?.id || "guest"}`,
    }),
    [customerType, isInternational, isAdmin, setCustomerType, switching, pendingSync, currency, setCurrency, currencyInfo, user?.id]
  );

  return <CustomerTypeContext.Provider value={value}>{children}</CustomerTypeContext.Provider>;
}

export const useCustomerType = () => useContext(CustomerTypeContext);
