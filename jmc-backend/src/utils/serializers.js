import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';
import { convertFromBase, resolveCurrency } from './currency.js';

/** Fields that exist on the Product model but are private (admin / internal use only). */
export const PRIVATE_PRODUCT_FIELDS = ['price', 'compareAtPrice'];

/** Only INTERNATIONAL customers (logged in) may see prices on customer-facing endpoints. */
export const canViewPrices = (viewer) =>
  Boolean(viewer) && viewer.customerType === 'INTERNATIONAL' && env.INTERNATIONAL_ORDERING_ENABLED;

/**
 * Customer-facing representation of a product: the normal JSON (with `id`) minus private pricing.
 * Prices are included (converted to `opts.currency`, default base currency) only when the viewer is an
 * INTERNATIONAL customer, or when `opts.forcePrices` is set by an endpoint that is already access-gated (cart).
 * Every customer-facing product response must go through this function.
 */
export const toPublicProduct = (product, viewer = null, opts = {}) => {
  if (!product) return product;
  const obj = typeof product.toJSON === 'function' ? product.toJSON() : { ...product };
  if (opts.forcePrices || canViewPrices(viewer)) {
    const currency = resolveCurrency(opts.currency);
    obj.price = convertFromBase(obj.price, currency);
    if (typeof obj.compareAtPrice === 'number') obj.compareAtPrice = convertFromBase(obj.compareAtPrice, currency);
    obj.currency = currency;
  } else {
    PRIVATE_PRODUCT_FIELDS.forEach((f) => delete obj[f]);
  }
  return obj;
};

export const toPublicProducts = (products = [], viewer = null, opts = {}) =>
  products.map((p) => toPublicProduct(p, viewer, opts));

const MAX_IMAGES = 15;

/**
 * Normalises product images sent by the admin frontend.
 * Accepts an array of URL strings or { url, publicId, alt } objects (or a mix) and
 * returns the stored shape [{ url, publicId, alt }]. Order is preserved:
 * images[0] is the main image, the rest form the gallery.
 */
export const normaliseImages = (input) => {
  if (!Array.isArray(input)) throw new ApiError(400, 'images must be an array');
  if (input.length > MAX_IMAGES) throw new ApiError(400, `A product can have at most ${MAX_IMAGES} images`);

  const seen = new Set();
  const out = [];
  input.forEach((item, i) => {
    const raw = typeof item === 'string' ? { url: item } : item;
    const url = typeof raw?.url === 'string' ? raw.url.trim() : '';
    if (!/^https:\/\/\S+$/i.test(url)) throw new ApiError(400, `images[${i}] must be a valid https image URL`);
    if (seen.has(url)) return;
    seen.add(url);
    out.push({
      url,
      publicId: typeof raw.publicId === 'string' ? raw.publicId.trim() : '',
      alt: typeof raw.alt === 'string' ? raw.alt.trim().slice(0, 200) : '',
    });
  });
  return out;
};
