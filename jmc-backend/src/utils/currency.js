import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Razorpay wants the smallest unit (paise/cents). All currencies supported by JMC have 2 decimals. */
export const toMinorUnits = (amount) => Math.round(round2(amount) * 100);

export const isBaseCurrency = (c) => c === env.currency.base;

/** Validates a requested currency (defaults to the base currency). */
export const resolveCurrency = (requested) => {
  const base = env.currency.base;
  const c = String(requested || base).trim().toUpperCase();
  if (!env.currency.supported.includes(c) && c !== base) {
    throw new ApiError(400, `Unsupported currency "${c}". Supported: ${[...new Set([base, ...env.currency.supported])].join(', ')}`);
  }
  if (c !== base && !env.currency.rates[c]) {
    throw new ApiError(400, `Prices in ${c} are not available right now. Please use ${base}.`);
  }
  return c;
};

export const getRate = (currency) => (isBaseCurrency(currency) ? 1 : env.currency.rates[currency]);

export const convertFromBase = (amount, currency) => round2(Number(amount) * getRate(currency));
