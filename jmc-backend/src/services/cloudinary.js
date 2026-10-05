import crypto from 'crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const isCloudinaryConfigured = () =>
  Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

/**
 * Signed-upload parameters. The admin frontend uploads images directly to
 * Cloudinary using these values, then saves the returned secure_url and
 * public_id in product.images. The API secret never leaves the server.
 */
export const createUploadSignature = (folder = 'jmc/products') => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, 'Image upload is not configured. Set the CLOUDINARY_* environment variables.');
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${folder}&timestamp=${timestamp}${env.cloudinary.apiSecret}`;
  const signature = crypto.createHash('sha1').update(toSign).digest('hex');
  return {
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
    timestamp,
    folder,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/image/upload`,
  };
};
