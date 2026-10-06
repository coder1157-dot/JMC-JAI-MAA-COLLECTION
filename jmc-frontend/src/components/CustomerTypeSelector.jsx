import { useCustomerType } from "../context/CustomerTypeContext";
import { CUSTOMER_TYPES } from "../utils/constants";

/** Premium Indian / International selector shown at the very top of the SAME website. */
export default function CustomerTypeSelector() {
  const { customerType, setCustomerType, switching, isInternational, currency, setCurrency, currencies } = useCustomerType();

  const options = [
    { value: CUSTOMER_TYPES.INDIAN, flag: "🇮🇳", short: "Indian", label: "Indian Client" },
    { value: CUSTOMER_TYPES.INTERNATIONAL, flag: "🌍", short: "International", label: "International Client" },
  ];

  return (
    <div className="customer-bar">
      <div className="container customer-bar-inner">
        <span className="customer-bar-label">Shopping as</span>
        <div className="customer-switch" role="radiogroup" aria-label="Customer type" aria-busy={switching}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={customerType === o.value}
              className={customerType === o.value ? "active" : ""}
              disabled={switching}
              onClick={() => setCustomerType(o.value)}
              title={o.label}
            >
              <span className="flag" aria-hidden="true">{o.flag}</span>
              <span>
                {o.short}
                <span className="client-word"> Client</span>
              </span>
            </button>
          ))}
        </div>
        {isInternational && currencies.length > 1 && (
          <label className="customer-currency">
            <span className="visually-hidden">Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Display currency">
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
