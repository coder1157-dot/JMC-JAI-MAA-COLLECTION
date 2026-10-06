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

const parseList = (value, fallback) => {
  const list = String(value ?? '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  return list.length ? list : fallback;
};

/** CURRENCY_RATES='{"USD":0.012}' = how many USD one unit of BASE_CURRENCY buys. Never invented here. */
const parseRates = (value) => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([k, v]) => [k.toUpperCase(), Number(v)])
        .filter(([, v]) => Number.isFinite(v) && v > 0)
    );
  } catch {
    console.warn('CURRENCY_RATES is not valid JSON and was ignored.');
    return {};
  }
};

const baseCurrency = String(process.env.BASE_CURRENCY || 'INR').trim().toUpperCase();
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
  // International customers can buy (cart / checkout / payments) even while ONLINE_ORDERING_ENABLED=false.
  // Set INTERNATIONAL_ORDERING_ENABLED=false to switch international purchasing (and price visibility) off.
  INTERNATIONAL_ORDERING_ENABLED: String(process.env.INTERNATIONAL_ORDERING_ENABLED || 'true').toLowerCase() !== 'false',
  currency: {
    // Product.price is stored in this currency (the admin price is the source of truth).
    base: baseCurrency,
    supported: parseList(process.env.SUPPORTED_CURRENCIES, ['INR', 'USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD', 'SGD']),
    rates: parseRates(process.env.CURRENCY_RATES),
  },
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
    // Currencies the Razorpay merchant account can actually charge. Non-INR needs international payments enabled by Razorpay.
    currencies: parseList(process.env.RAZORPAY_CURRENCIES, ['INR']),
  },
};

/** Called once at startup. Returns a list of problems (empty = OK). */
export const getMissingRequiredEnv = () => {
  const missing = [];
  if (!env.MONGO_URI) missing.push('MONGO_URI');
  if (!env.JWT_SECRET) missing.push('JWT_SECRET');
  return missing;
};
