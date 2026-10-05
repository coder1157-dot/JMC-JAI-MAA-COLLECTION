import Category from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/helpers.js';

/**
 * Validates category + subcategory against the Category collection and returns
 * the denormalised fields stored on a product.
 */
export const resolveCategory = async (categorySlug, subcategoryName) => {
  const category = await Category.findOne({ slug: slugify(categorySlug) });
  if (!category) throw new ApiError(400, `Unknown category "${categorySlug}"`);

  let subcategory = '';
  let subcategorySlug = '';
  if (subcategoryName) {
    const sub = category.subcategories.find(
      (s) => s.slug === slugify(subcategoryName) || s.name.toLowerCase() === String(subcategoryName).toLowerCase()
    );
    if (!sub) throw new ApiError(400, `Unknown subcategory "${subcategoryName}" for ${category.name}`);
    subcategory = sub.name;
    subcategorySlug = sub.slug;
  }
  return { category: category.slug, categoryName: category.name, subcategory, subcategorySlug };
};
