import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order, { ORDER_STATUSES } from '../models/Order.js';
import User from '../models/User.js';
import Banner from '../models/Banner.js';
import Coupon from '../models/Coupon.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { resolveCategory } from '../services/catalog.service.js';
import { createUploadSignature } from '../services/cloudinary.js';
import { buildProductFilter } from './product.controller.js';
import { normaliseImages } from '../utils/serializers.js';
import {
  assertObjectId, buildPagination, escapeRegex, parsePagination, pick, slugify,
} from '../utils/helpers.js';

/* ------------------------------ Products ------------------------------ */

const PRODUCT_FIELDS = [
  'name', 'sku', 'description', 'price', 'compareAtPrice', 'images', 'stock', 'material',
  'purity', 'stone', 'featured', 'newArrival', 'internationalShipping', 'active',
];

const uniqueProductSlug = async (name, sku, ignoreId) => {
  const base = slugify(name) || slugify(sku);
  const clash = await Product.exists({ slug: base, ...(ignoreId && { _id: { $ne: ignoreId } }) });
  return clash ? `${base}-${slugify(sku)}` : base;
};

export const adminListProducts = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 20);
  const filter = buildProductFilter(req.query, { includeInactive: true, allowPrice: true });
  if (req.query.active === 'true' || req.query.active === 'false') filter.active = req.query.active === 'true';
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  sendSuccess(res, { products, pagination: buildPagination(page, limit, total) }, 'Products fetched successfully');
};

export const adminGetProduct = async (req, res) => {
  assertObjectId(req.params.id, 'product id');
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  sendSuccess(res, { product }, 'Product fetched successfully');
};

export const adminCreateProduct = async (req, res) => {
  const data = pick(req.body, PRODUCT_FIELDS);
  if (data.images !== undefined) data.images = normaliseImages(data.images);
  Object.assign(data, await resolveCategory(req.body.category, req.body.subcategory));
  if (!data.name || !data.sku) throw new ApiError(400, 'name and sku are required');
  data.slug = req.body.slug ? slugify(req.body.slug) : await uniqueProductSlug(data.name, data.sku);
  const product = await Product.create(data);
  sendSuccess(res, { product }, 'Product created successfully', 201);
};

export const adminUpdateProduct = async (req, res) => {
  assertObjectId(req.params.id, 'product id');
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const changes = pick(req.body, PRODUCT_FIELDS);
  if (changes.images !== undefined) changes.images = normaliseImages(changes.images);
  product.set(changes);
  if (req.body.category !== undefined || req.body.subcategory !== undefined) {
    product.set(await resolveCategory(req.body.category ?? product.category, req.body.subcategory ?? product.subcategory));
  }
  if (req.body.slug) product.slug = slugify(req.body.slug);
  await product.save();
  sendSuccess(res, { product }, 'Product updated successfully');
};

export const adminDeleteProduct = async (req, res) => {
  assertObjectId(req.params.id, 'product id');
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  sendSuccess(res, {}, 'Product deleted successfully');
};

/* ------------------------------ Inventory ----------------------------- */

export const adminInventory = async (req, res) => {
  const threshold = Math.max(parseInt(req.query.threshold, 10) || 5, 0);
  const { page, limit, skip } = parsePagination(req.query, 50);
  const filter = { stock: { $lte: threshold } };
  const [products, total] = await Promise.all([
    Product.find(filter).sort({ stock: 1 }).skip(skip).limit(limit).select('name sku slug category subcategory stock active images'),
    Product.countDocuments(filter),
  ]);
  sendSuccess(res, { threshold, products, pagination: buildPagination(page, limit, total) }, 'Inventory fetched successfully');
};

export const adminSetStock = async (req, res) => {
  assertObjectId(req.params.id, 'product id');
  const stock = Number(req.body.stock);
  if (!Number.isInteger(stock) || stock < 0) throw new ApiError(400, 'stock must be a whole number, 0 or more');
  const product = await Product.findByIdAndUpdate(req.params.id, { stock }, { new: true });
  if (!product) throw new ApiError(404, 'Product not found');
  sendSuccess(res, { product }, 'Stock updated successfully');
};

/* ------------------------------ Categories ---------------------------- */

const normaliseSubcategories = (subs) =>
  (Array.isArray(subs) ? subs : [])
    .map((s) => (typeof s === 'string' ? s : s?.name))
    .filter((n) => typeof n === 'string' && n.trim())
    .map((n) => ({ name: n.trim(), slug: slugify(n) }));

export const adminListCategories = async (_req, res) => {
  sendSuccess(res, await Category.find().sort({ sortOrder: 1, name: 1 }), 'Categories fetched successfully');
};

export const adminCreateCategory = async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) throw new ApiError(400, 'name is required');
  const category = await Category.create({
    ...pick(req.body, ['description', 'image', 'active', 'sortOrder']),
    name,
    slug: slugify(req.body.slug || name),
    subcategories: normaliseSubcategories(req.body.subcategories),
  });
  sendSuccess(res, { category }, 'Category created successfully', 201);
};

export const adminUpdateCategory = async (req, res) => {
  assertObjectId(req.params.id, 'category id');
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  // The slug is referenced by products, so it is never changed here.
  category.set(pick(req.body, ['name', 'description', 'image', 'active', 'sortOrder']));
  if (req.body.subcategories !== undefined) category.subcategories = normaliseSubcategories(req.body.subcategories);
  await category.save();
  sendSuccess(res, { category }, 'Category updated successfully');
};

export const adminDeleteCategory = async (req, res) => {
  assertObjectId(req.params.id, 'category id');
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  if (await Product.exists({ category: category.slug })) {
    throw new ApiError(409, 'This category still has products. Move or delete them first, or deactivate the category.');
  }
  await category.deleteOne();
  sendSuccess(res, {}, 'Category deleted successfully');
};

/* -------------------------------- Orders ------------------------------ */

export const adminListOrders = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 20);
  const filter = {};
  if (ORDER_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.search) filter.orderNumber = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email phone').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  sendSuccess(res, { orders, pagination: buildPagination(page, limit, total) }, 'Orders fetched successfully');
};

export const adminGetOrder = async (req, res) => {
  assertObjectId(req.params.id, 'order id');
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) throw new ApiError(404, 'Order not found');
  sendSuccess(res, { order }, 'Order fetched successfully');
};

export const adminUpdateOrderStatus = async (req, res) => {
  assertObjectId(req.params.id, 'order id');
  const { status, paymentStatus, note } = req.body;
  if (status !== undefined && !ORDER_STATUSES.includes(status)) throw new ApiError(400, `status must be one of: ${ORDER_STATUSES.join(', ')}`);
  if (paymentStatus !== undefined && !['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
    throw new ApiError(400, 'paymentStatus must be one of: pending, paid, failed, refunded');
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (status && status !== order.status) {
    // Return stock to inventory the first time an order is cancelled/refunded.
    const wasReleased = ['cancelled', 'refunded'].includes(order.status);
    if (['cancelled', 'refunded'].includes(status) && !wasReleased) {
      await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })));
    } else if (wasReleased && !['cancelled', 'refunded'].includes(status)) {
      throw new ApiError(400, 'A cancelled or refunded order cannot be reopened. Ask the customer to place a new order.');
    }
    order.status = status;
    order.statusHistory.push({ status, note: typeof note === 'string' ? note : '' });
  }
  if (paymentStatus) order.paymentStatus = paymentStatus;
  await order.save();
  sendSuccess(res, { order }, 'Order updated successfully');
};

/* -------------------------------- Users ------------------------------- */

export const adminListUsers = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 20);
  const filter = {};
  if (['customer', 'admin'].includes(req.query.role)) filter.role = req.query.role;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  sendSuccess(res, { users, pagination: buildPagination(page, limit, total) }, 'Users fetched successfully');
};

export const adminSetUserStatus = async (req, res) => {
  assertObjectId(req.params.id, 'user id');
  if (typeof req.body.active !== 'boolean') throw new ApiError(400, 'active must be true or false');
  if (String(req.user._id) === req.params.id) throw new ApiError(400, 'You cannot change your own status');
  const user = await User.findByIdAndUpdate(req.params.id, { active: req.body.active }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  sendSuccess(res, { user }, 'User updated successfully');
};

/* ---------------------- Banners & coupons (CRUD) ---------------------- */

const crud = (Model, label, fields, { upperCaseKey } = {}) => ({
  list: async (_req, res) => sendSuccess(res, await Model.find().sort({ createdAt: -1 }), `${label}s fetched successfully`),
  create: async (req, res) => {
    const doc = await Model.create(pick(req.body, fields));
    sendSuccess(res, { [label.toLowerCase()]: doc }, `${label} created successfully`, 201);
  },
  update: async (req, res) => {
    assertObjectId(req.params.id, `${label.toLowerCase()} id`);
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new ApiError(404, `${label} not found`);
    doc.set(pick(req.body, fields));
    await doc.save();
    sendSuccess(res, { [label.toLowerCase()]: doc }, `${label} updated successfully`);
  },
  remove: async (req, res) => {
    assertObjectId(req.params.id, `${label.toLowerCase()} id`);
    if (!(await Model.findByIdAndDelete(req.params.id))) throw new ApiError(404, `${label} not found`);
    sendSuccess(res, {}, `${label} deleted successfully`);
  },
});

export const banners = crud(Banner, 'Banner', ['title', 'subtitle', 'image', 'link', 'position', 'active', 'sortOrder']);
export const coupons = crud(Coupon, 'Coupon', [
  'code', 'description', 'type', 'value', 'minOrderAmount', 'maxDiscount', 'usageLimit', 'expiresAt', 'active',
]);

/* ------------------------------ Analytics ----------------------------- */

export const adminAnalytics = async (_req, res) => {
  const [users, products, orders, byStatus, revenueAgg, lowStock, recentOrders] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]),
    Product.countDocuments({ stock: { $lte: 5 }, active: true }),
    Order.find().sort({ createdAt: -1 }).limit(5).select('orderNumber total status paymentStatus createdAt'),
  ]);
  sendSuccess(res, {
    totals: { customers: users, products, orders, lowStockProducts: lowStock, revenue: revenueAgg[0]?.revenue || 0 },
    ordersByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    recentOrders,
  }, 'Analytics fetched successfully');
};

/* ------------------------------- Uploads ------------------------------ */

export const adminUploadSignature = (req, res) => {
  const folder = typeof req.body.folder === 'string' && /^[a-z0-9/_-]{1,60}$/i.test(req.body.folder) ? req.body.folder : undefined;
  sendSuccess(res, createUploadSignature(folder), 'Upload signature created');
};
