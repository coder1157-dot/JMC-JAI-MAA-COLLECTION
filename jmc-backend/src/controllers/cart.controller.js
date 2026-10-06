import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { assertObjectId } from '../utils/helpers.js';
import { toPublicProduct } from '../utils/serializers.js';
import { convertFromBase, resolveCurrency, round2 } from '../utils/currency.js';

const getOrCreateCart = async (userId) =>
  (await Cart.findOne({ user: userId })) || (await Cart.create({ user: userId, items: [] }));

// Cart endpoints are only reachable by customers allowed to buy, so prices are shown here (in the requested currency).
const buildCartPayload = async (userId, requestedCurrency) => {
  const currency = resolveCurrency(requestedCurrency);
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  const items = (cart?.items || [])
    .filter((i) => i.product && i.product.active)
    .map((i) => ({
      id: i._id,
      product: toPublicProduct(i.product, null, { forcePrices: true, currency }),
      quantity: i.quantity,
      lineTotal: round2(convertFromBase(i.product.price, currency) * i.quantity),
      available: i.product.stock >= i.quantity,
    }));
  return {
    currency,
    items,
    totalItems: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: round2(items.reduce((n, i) => n + i.lineTotal, 0)),
  };
};

const parseQuantity = (value, fallback = 1) => {
  const q = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(q) || q < 1 || q > 100) throw new ApiError(400, 'Quantity must be a whole number between 1 and 100');
  return q;
};

export const getCart = async (req, res) =>
  sendSuccess(res, await buildCartPayload(req.user._id, req.query.currency ?? req.body?.currency), 'Cart fetched successfully');

export const addToCart = async (req, res) => {
  const { productId } = req.body;
  assertObjectId(productId, 'productId');
  const quantity = parseQuantity(req.body.quantity);

  const product = await Product.findOne({ _id: productId, active: true });
  if (!product) throw new ApiError(404, 'Product not found');

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((i) => i.product.equals(product._id));
  const newQty = (existing?.quantity || 0) + quantity;
  if (newQty > product.stock) throw new ApiError(400, `Only ${product.stock} unit(s) of this product are in stock`);

  if (existing) existing.quantity = newQty;
  else cart.items.push({ product: product._id, quantity });
  await cart.save();
  sendSuccess(res, await buildCartPayload(req.user._id, req.query.currency ?? req.body?.currency), 'Item added to cart', 201);
};

export const updateCartItem = async (req, res) => {
  assertObjectId(req.params.itemId, 'itemId');
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');
  // Either an absolute `quantity`, or `action: 'increase' | 'decrease'` (optionally with `by`, default 1).
  let quantity;
  if (req.body.action === 'increase' || req.body.action === 'decrease') {
    const by = parseQuantity(req.body.by, 1);
    quantity = item.quantity + (req.body.action === 'increase' ? by : -by);
    if (quantity < 1) throw new ApiError(400, 'Quantity cannot go below 1. Remove the item instead.');
    if (quantity > 100) throw new ApiError(400, 'Quantity must be a whole number between 1 and 100');
  } else {
    quantity = parseQuantity(req.body.quantity, undefined);
  }

  const product = await Product.findById(item.product);
  if (!product || !product.active) throw new ApiError(404, 'Product is no longer available');
  if (quantity > product.stock) throw new ApiError(400, `Only ${product.stock} unit(s) of this product are in stock`);

  item.quantity = quantity;
  await cart.save();
  sendSuccess(res, await buildCartPayload(req.user._id, req.query.currency ?? req.body?.currency), 'Cart updated successfully');
};

export const removeCartItem = async (req, res) => {
  assertObjectId(req.params.itemId, 'itemId');
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');
  item.deleteOne();
  await cart.save();
  sendSuccess(res, await buildCartPayload(req.user._id, req.query.currency ?? req.body?.currency), 'Item removed from cart');
};

export const clearCart = async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });
  sendSuccess(res, await buildCartPayload(req.user._id, req.query.currency ?? req.body?.currency), 'Cart cleared');
};
