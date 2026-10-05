import Banner from '../models/Banner.js';
import { sendSuccess } from '../utils/response.js';

export const getBanners = async (req, res) => {
  const filter = { active: true };
  if (req.query.position) filter.position = String(req.query.position);
  const banners = await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 });
  sendSuccess(res, banners, 'Banners fetched successfully');
};
