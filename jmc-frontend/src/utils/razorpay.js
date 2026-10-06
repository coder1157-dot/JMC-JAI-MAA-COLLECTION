import { createPaymentOrder, reportPaymentFailure, verifyPayment } from "../api/payments";

let loading;

/** Loads Razorpay Checkout on demand (only when the customer picks online payment). */
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  if (loading) return loading;
  loading = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => {
      loading = null;
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return loading;
}

/** code: "load" | "cancelled" | "failed" | "verify" */
export class PaymentError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

/**
 * The single online-payment flow (used by Checkout and by "Retry payment" on the order page):
 * backend creates the Razorpay order → Razorpay opens → customer pays → BACKEND verifies the signature.
 * Resolves with the order returned by the backend verification; success is never decided on the frontend.
 */
export async function payOrder(order, customer = {}) {
  const ok = await loadRazorpay();
  if (!ok) throw new PaymentError("Unable to load the payment window. Please check your connection and retry.", "load");
  const { data: pay } = await createPaymentOrder(order.id);

  return new Promise((resolve, reject) => {
    let settled = false;
    let lastFailure = "";
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };

    const rzp = new window.Razorpay({
      key: pay.keyId,
      amount: pay.amount,
      currency: pay.currency,
      order_id: pay.razorpayOrderId,
      name: "JMC – Jai Maa Collection",
      description: `Order ${order.orderNumber}`,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      theme: { color: "#5B1424" },
      handler: async (r) => {
        try {
          const res = await verifyPayment({
            orderId: order.id,
            razorpay_order_id: r.razorpay_order_id,
            razorpay_payment_id: r.razorpay_payment_id,
            razorpay_signature: r.razorpay_signature,
          });
          finish(resolve, res.data.order);
        } catch (e) {
          finish(
            reject,
            new PaymentError(
              `We could not confirm your payment yet (${e.message}). If money was deducted, please contact us before paying again.`,
              "verify"
            )
          );
        }
      },
      modal: {
        ondismiss: () => {
          if (settled) return;
          reportPaymentFailure(order.id).catch(() => {});
          finish(
            reject,
            lastFailure
              ? new PaymentError(lastFailure, "failed")
              : new PaymentError("Payment was cancelled. You can retry from your order page.", "cancelled")
          );
        },
      },
    });
    // Razorpay lets the customer retry inside the same window, so a failure is only recorded here;
    // the outcome is decided by `handler` (paid + verified) or by closing the window.
    rzp.on("payment.failed", (resp) => {
      lastFailure = resp?.error?.description || "Payment failed. Please try again.";
      reportPaymentFailure(order.id).catch(() => {});
    });
    rzp.open();
  });
}
