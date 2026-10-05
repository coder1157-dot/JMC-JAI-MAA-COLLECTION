import { ApiError } from './ApiError.js';

/** Fields that exist on the Product model but are private (admin / internal use only). */
export const PRIVATE_PRODUCT_FIELDS = ['price', 'compareAtPrice'];

/**
 * Public representation of a product: the normal JSON (with `id`) minus private pricing.
 * Every customer-facing product response must go through this function.
 */
export const toPublicProduct = (product) => {
  if (!product) return product;
  const obj = typeof product.toJSON === 'function' ? product.toJSON() : { ...product };
  PRIVATE_PRODUCT_FIELDS.forEach((f) => delete obj[f]);
  return obj;
};

export const toPublicProducts = (products = []) => products.map(toPublicProduct);

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
