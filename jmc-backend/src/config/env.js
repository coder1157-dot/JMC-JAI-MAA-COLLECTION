import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const NODE_ENV = process.env.NODE_ENV || 'development';

/** Digits only. A bare 10-digit Indian number gets the 91 country code. */
export const normalizeWhatsAppNumber = (raw) => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length === 10 ? `91${digits}` : digits;
};

const parseOrigins = (value) =>
  String(value ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

const whatsapp = normalizeWhatsAppNumber(process.env.JMC_WHATSAPP_NUMBER);

export const env = {
  NODE_ENV,
  isProd: NODE_ENV === 'production',
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI: process.env.MONGO_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_ORIGINS: parseOrigins(process.env.FRONTEND_URL),
  // JMC is an enquiry-based catalogue (prices are private). The customer cart/checkout/payment APIs
  // expose product prices, so they are disabled unless this is explicitly set to "true".
  ONLINE_ORDERING_ENABLED: String(process.env.ONLINE_ORDERING_ENABLED || 'false').toLowerCase() === 'true',
  contact: {
    whatsapp, // e.g. 919259542580 (may be '' if not configured)
    phone: (process.env.JMC_PHONE || whatsapp.slice(-10)).replace(/\D/g, ''),
    email: process.env.JMC_EMAIL || '',
    address: process.env.JMC_ADDRESS || '',
    social: {
      instagram: process.env.JMC_INSTAGRAM || '',
      facebook: process.env.JMC_FACEBOOK || '',
      youtube: process.env.JMC_YOUTUBE || '',
    },
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
};

/** Called once at startup. Returns a list of problems (empty = OK). */
export const getMissingRequiredEnv = () => {
  const missing = [];
  if (!env.MONGO_URI) missing.push('MONGO_URI');
  if (!env.JWT_SECRET) missing.push('JWT_SECRET');
  return missing;
};
