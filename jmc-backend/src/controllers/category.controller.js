import Category from '../models/Category.js';
import { sendSuccess } from '../utils/response.js';

export const getCategories = async (_req, res) => {
  const categories = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 });
  sendSuccess(res, categories, 'Categories fetched successfully');
};
