/**
 * Idempotent seed: safe to run any number of times.
 *  - Categories are upserted by slug (names/subcategories kept in sync).
 *  - Sample products are inserted only if their SKU does not exist yet,
 *    so later edits made in the admin panel are never overwritten.
 *  - The admin user is created only if that email does not exist.
 * Nothing is ever deleted.
 */
import mongoose from 'mongoose';
import { env, getMissingRequiredEnv } from '../config/env.js';
import { connectDB } from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { DEFAULT_CATEGORIES } from '../utils/catalog.js';
import { slugify } from '../utils/helpers.js';

const PREFIX = { 'jadau-jewellery': 'JDU', 'american-diamond': 'AD' };

const sampleProduct = (cat, sub, index) => {
  const isJadau = cat.slug === 'jadau-jewellery';
  const subSlug = slugify(sub);
  const code = subSlug.split('-').map((w) => w[0]).join('').toUpperCase();
  const sku = `${PREFIX[cat.slug]}-${code}-001`;
  return {
    name: `Sample ${cat.name} ${sub}`,
    slug: `sample-${cat.slug}-${subSlug}`,
    sku,
    description: `Sample ${sub.toLowerCase()} from the ${cat.name} collection. Replace with real product details from the admin panel.`,
    category: cat.slug,
    categoryName: cat.name,
    subcategory: sub,
    subcategorySlug: subSlug,
    price: isJadau ? 15000 + index * 2500 : 3000 + index * 750,
    compareAtPrice: null,
    images: [], // add real images via the admin panel / Cloudinary
    stock: 5,
    material: isJadau ? 'Jadau' : 'American Diamond',
    purity: '',
    stone: isJadau ? 'Kundan' : 'American Diamond (CZ)',
    featured: index < 2,
    newArrival: index < 3,
    internationalShipping: true,
    active: true,
  };
};

const run = async () => {
  const missing = getMissingRequiredEnv();
  if (missing.length) throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  await connectDB();

  // Categories
  for (const c of DEFAULT_CATEGORIES) {
    await Category.updateOne(
      { slug: c.slug },
      {
        $set: {
          name: c.name,
          sortOrder: c.sortOrder,
          subcategories: c.subcategories.map((name) => ({ name, slug: slugify(name) })),
        },
        $setOnInsert: { slug: c.slug, active: true },
      },
      { upsert: true }
    );
  }
  console.log(`Categories upserted: ${DEFAULT_CATEGORIES.length}`);

  // Sample products
  let inserted = 0;
  for (const cat of DEFAULT_CATEGORIES) {
    for (const [i, sub] of cat.subcategories.entries()) {
      const doc = sampleProduct(cat, sub, i);
      const r = await Product.updateOne({ sku: doc.sku }, { $setOnInsert: doc }, { upsert: true });
      inserted += r.upsertedCount;
    }
  }
  console.log(`Sample products inserted: ${inserted} (existing ones left untouched)`);

  // Admin user
  let email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  let password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    if (env.isProd) throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create the admin user in production.');
    email = 'admin@jmc.local';
    password = 'ChangeMe@12345';
    console.warn('SEED_ADMIN_* not set: using development-only admin credentials (admin@jmc.local).');
  }
  if (await User.exists({ email })) {
    console.log(`Admin user already exists: ${email}`);
  } else {
    await User.create({ name: 'JMC Admin', email, password, role: 'admin' });
    console.log(`Admin user created: ${email}`);
  }
};

try {
  await run();
  console.log('Seed complete.');
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
