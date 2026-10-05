import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { assertObjectId } from '../utils/helpers.js';

const getOrCreateCart = async (userId) =>
  (await Cart.findOne({ user: userId })) || (await Cart.create({ user: userId, items: [] }));

const buildCartPayload = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  const items = (cart?.items || [])
    .filter((i) => i.product && i.product.active)
    .map((i) => ({
      id: i._id,
      product: i.product,
      quantity: i.quantity,
      lineTotal: i.product.price * i.quantity,
    }));
  return {
    items,
    totalItems: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((n, i) => n + i.lineTotal, 0),
  };
};

const parseQuantity = (value, fallback = 1) => {
  const q = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(q) || q < 1 || q > 100) throw new ApiError(400, 'Quantity must be a whole number between 1 and 100');
  return q;
};

export const getCart = async (req, res) =>
  sendSuccess(res, await buildCartPayload(req.user._id), 'Cart fetched successfully');

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
  sendSuccess(res, await buildCartPayload(req.user._id), 'Item added to cart', 201);
};

export const updateCartItem = async (req, res) => {
  assertObjectId(req.params.itemId, 'itemId');
  const quantity = parseQuantity(req.body.quantity, undefined);
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');

  const product = await Product.findById(item.product);
  if (!product || !product.active) throw new ApiError(404, 'Product is no longer available');
  if (quantity > product.stock) throw new ApiError(400, `Only ${product.stock} unit(s) of this product are in stock`);

  item.quantity = quantity;
  await cart.save();
  sendSuccess(res, await buildCartPayload(req.user._id), 'Cart updated successfully');
};

export const removeCartItem = async (req, res) => {
  assertObjectId(req.params.itemId, 'itemId');
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found');
  item.deleteOne();
  await cart.save();
  sendSuccess(res, await buildCartPayload(req.user._id), 'Item removed from cart');
};

export const clearCart = async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });
  sendSuccess(res, await buildCartPayload(req.user._id), 'Cart cleared');
};
