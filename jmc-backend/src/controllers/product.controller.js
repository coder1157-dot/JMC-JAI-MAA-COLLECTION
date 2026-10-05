import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import {
  assertObjectId, buildPagination, escapeRegex, parsePagination, slugify,
} from '../utils/helpers.js';
import { toPublicProduct, toPublicProducts } from '../utils/serializers.js';

// Public sorting. price_asc / price_desc are intentionally not available here (price is private).
const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
};

// Price filters/sorting are admin-only: allowing them publicly would leak pricing information.
export const buildProductFilter = (query, { includeInactive = false, allowPrice = false } = {}) => {
  const filter = {};
  if (!includeInactive) filter.active = true;
  if (query.category) filter.category = slugify(query.category);
  if (query.subcategory) filter.subcategorySlug = slugify(query.subcategory);
  if (query.search && String(query.search).trim()) {
    const rx = new RegExp(escapeRegex(String(query.search).trim()), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { description: rx }, { material: rx }, { stone: rx }, { subcategory: rx }];
  }
  if (allowPrice) {
    const min = Number(query.minPrice);
    const max = Number(query.maxPrice);
    if (query.minPrice !== undefined && query.minPrice !== '' && !Number.isNaN(min)) filter.price = { ...filter.price, $gte: min };
    if (query.maxPrice !== undefined && query.maxPrice !== '' && !Number.isNaN(max)) filter.price = { ...filter.price, $lte: max };
  }
  if (query.featured === 'true') filter.featured = true;
  if (query.newArrival === 'true') filter.newArrival = true;
  return filter;
};

export const listProducts = async (req, res, extraFilter = {}, message = 'Products fetched successfully') => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { ...buildProductFilter(req.query), ...extraFilter };
  const sort = SORTS[req.query.sort] || SORTS.newest;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  sendSuccess(res, { products: toPublicProducts(products), pagination: buildPagination(page, limit, total) }, message);
};

export const getProducts = (req, res) => listProducts(req, res);
export const getNewArrivals = (req, res) =>
  listProducts(req, res, { newArrival: true }, 'New arrivals fetched successfully');
export const getFeatured = (req, res) =>
  listProducts(req, res, { featured: true }, 'Featured products fetched successfully');

export const getProductById = async (req, res) => {
  assertObjectId(req.params.id, 'product id');
  const product = await Product.findOne({ _id: req.params.id, active: true });
  if (!product) throw new ApiError(404, 'Product not found');
  sendSuccess(res, { product: toPublicProduct(product) }, 'Product fetched successfully');
};

export const getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: String(req.params.slug).toLowerCase(), active: true });
  if (!product) throw new ApiError(404, 'Product not found');
  sendSuccess(res, { product: toPublicProduct(product) }, 'Product fetched successfully');
};
