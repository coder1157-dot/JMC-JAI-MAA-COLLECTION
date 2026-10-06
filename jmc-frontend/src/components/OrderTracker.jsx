import { EXCEPTION_STATUSES, TRACK_STEPS } from "../utils/constants";
import { formatDateTime, statusLabel } from "../utils/format";

const EXCEPTION_LABEL = {
  cancelled: "Cancelled",
  refund_initiated: "Refund Initiated",
  refunded: "Refunded",
};

/**
 * Delivery timeline:  Order Placed → Confirmed → Processing → Packed → Shipped → Out for Delivery → Delivered
 * The current step is highlighted. Cancelled / Refund Initiated / Refunded are shown as a closing state
 * after the last delivery step that was reached.
 */
export default function OrderTracker({ order }) {
  const history = order.statusHistory || [];
  const stamp = {}; // latest time each status was reached
  history.forEach((h) => {
    stamp[h.status] = h.at;
  });
  const stepIndex = (s) => TRACK_STEPS.findIndex((t) => t.key === s);
  const exception = EXCEPTION_STATUSES.includes(order.status);

  let reached = stepIndex(order.status);
  if (exception) {
    // the furthest delivery step the order got to before it was cancelled / refunded
    reached = history.reduce((max, h) => Math.max(max, stepIndex(h.status)), 0);
  }

  const exceptionSteps = exception
    ? ["cancelled", "refund_initiated", "refunded"].filter((s) => s === order.status || (stamp[s] && s !== order.status))
    : [];

  return (
    <div className="tracker-wrap">
      {exception && (
        <div className={`alert-jmc ${order.status === "refunded" ? "info" : "error"}`}>
          {order.status === "cancelled" && "This order was cancelled."}
          {order.status === "refund_initiated" && "Your refund has been initiated. It will reach your original payment method shortly."}
          {order.status === "refunded" && "This order has been refunded."}
        </div>
      )}
      <ol className="tracker" aria-label="Order tracking">
        {TRACK_STEPS.map((step, i) => {
          const done = i < reached || (!exception && i === reached && order.status === "delivered");
          const current = !exception && i === reached && order.status !== "delivered";
          const state = done ? "done" : current ? "current" : exception && i <= reached ? "done" : "todo";
          return (
            <li key={step.key} className={`tracker-step ${state}`} aria-current={current ? "step" : undefined}>
              <span className="tracker-dot">{state === "done" ? "✓" : i + 1}</span>
              <span className="tracker-label">{step.label}</span>
              <span className="tracker-time">{stamp[step.key] ? formatDateTime(stamp[step.key]) : ""}</span>
            </li>
          );
        })}
        {exceptionSteps.map((s) => (
          <li key={s} className={`tracker-step exception ${s === order.status ? "current" : "done"}`}>
            <span className="tracker-dot">!</span>
            <span className="tracker-label">{EXCEPTION_LABEL[s]}</span>
            <span className="tracker-time">{stamp[s] ? formatDateTime(stamp[s]) : ""}</span>
          </li>
        ))}
      </ol>
      {(order.courier || order.trackingNumber) && (
        <p className="tracker-courier">
          {order.courier && <>Courier: <strong>{order.courier}</strong></>}
          {order.courier && order.trackingNumber && " · "}
          {order.trackingNumber && <>Tracking no.: <strong>{order.trackingNumber}</strong></>}
        </p>
      )}
      <details className="tracker-history">
        <summary>Full status history</summary>
        <ol className="timeline">
          {[...history].reverse().map((h, i) => (
            <li key={i} className={i === 0 ? "current" : ""}>
              <strong>{statusLabel(h.status)}</strong>
              {h.note && <span> — {h.note}</span>}
              <div className="muted small">{formatDateTime(h.at)}</div>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
