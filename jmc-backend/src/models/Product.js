import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: { type: String, required: [true, 'SKU is required'], unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    // Category slug, e.g. "jadau-jewellery"; categoryName is the display name.
    category: { type: String, required: [true, 'Category is required'], lowercase: true, trim: true, index: true },
    categoryName: { type: String, default: '' },
    subcategory: { type: String, trim: true, default: '' },
    subcategorySlug: { type: String, lowercase: true, trim: true, default: '', index: true },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    compareAtPrice: { type: Number, min: 0, default: null },
    images: [
      {
        _id: false,
        url: { type: String, required: true },
        publicId: { type: String, default: '' }, // Cloudinary public_id
        alt: { type: String, default: '' },
      },
    ],
    stock: { type: Number, default: 0, min: 0 },
    material: { type: String, default: '' },
    purity: { type: String, default: '' },
    stone: { type: String, default: '' },
    featured: { type: Boolean, default: false, index: true },
    newArrival: { type: Boolean, default: false, index: true },
    internationalShipping: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

productSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Product', productSchema);
