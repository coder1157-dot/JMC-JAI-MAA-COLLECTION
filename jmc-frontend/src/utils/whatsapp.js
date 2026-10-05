/**
 * Build the wa.me enquiry link for a product (no login, no backend call).
 * `whatsapp` is the digits-only number from GET /settings/contact.
 */
export function buildWhatsAppUrl(whatsapp, product) {
  const link = `${window.location.origin}/product/${product.slug || product.id}`;
  const message = `Hello JMC – Jai Maa Collection,

I am interested in this product:

Product: ${product.name}
Category: ${product.categoryName || ""}
Subcategory: ${product.subcategory || ""}
SKU: ${product.sku || ""}
Product ID: ${product.id}
Product Link: ${link}

Please share the latest price, payment options and delivery details.

Thank you.`;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}
