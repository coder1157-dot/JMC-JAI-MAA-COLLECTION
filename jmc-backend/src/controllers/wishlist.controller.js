import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { assertObjectId } from '../utils/helpers.js';
import { toPublicProducts } from '../utils/serializers.js';

const payload = async (userId) => {
  const wl = await Wishlist.findOne({ user: userId }).populate({ path: 'products', match: { active: true } });
  return { products: toPublicProducts(wl?.products || []) };
};

export const getWishlist = async (req, res) =>
  sendSuccess(res, await payload(req.user._id), 'Wishlist fetched successfully');

export const addToWishlist = async (req, res) => {
  assertObjectId(req.params.productId, 'product id');
  if (!(await Product.exists({ _id: req.params.productId, active: true }))) throw new ApiError(404, 'Product not found');
  await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { products: req.params.productId } },
    { upsert: true, new: true }
  );
  sendSuccess(res, await payload(req.user._id), 'Added to wishlist', 201);
};

export const removeFromWishlist = async (req, res) => {
  assertObjectId(req.params.productId, 'product id');
  await Wishlist.findOneAndUpdate({ user: req.user._id }, { $pull: { products: req.params.productId } });
  sendSuccess(res, await payload(req.user._id), 'Removed from wishlist');
};
