import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

export const getContact = (_req, res) => {
  const { whatsapp, phone, email, address, social } = env.contact;
  if (!whatsapp) {
    // Clear configuration error instead of crashing or returning a broken link.
    throw new ApiError(503, 'WhatsApp contact is not configured. Set JMC_WHATSAPP_NUMBER on the server.');
  }
  // Only public information. No secrets ever go in this response.
  sendSuccess(res, { whatsapp, phone, email, address, social }, 'Contact settings fetched successfully');
};
