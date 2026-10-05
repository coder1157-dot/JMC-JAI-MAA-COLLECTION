// Default catalogue used by the seed script. After seeding, the database
// (Category collection) is the source of truth.
export const DEFAULT_CATEGORIES = [
  {
    name: 'Jadau Jewellery',
    slug: 'jadau-jewellery',
    sortOrder: 1,
    subcategories: [
      'Short Set', 'Long Set', 'Semi Long Set', 'Earrings', 'Rings', 'Nose Pins',
      'Mangalsutra', 'Kamarbandh', 'Maang Tikka', 'Pendant Set', 'Bangles',
      'Hand Glass', 'Dasti', 'Other Articles',
    ],
  },
  {
    name: 'American Diamond',
    slug: 'american-diamond',
    sortOrder: 2,
    subcategories: [
      'Short Set', 'Rings', 'Bracelet', 'Short Pendant Set', 'Long Pendant Set',
      'Chains', 'Other Articles',
    ],
  },
];
