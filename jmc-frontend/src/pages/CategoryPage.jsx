import ProductListing from "../components/ProductListing";
import { useCategories } from "../context/CategoriesContext";

const INTRO = {
  "jadau-jewellery": "Heritage Jadau, handcrafted with kundan and colour — made to be passed down.",
  "american-diamond": "Brilliant American Diamond pieces with a luminous, modern sparkle.",
};

export default function CategoryPage({ slug }) {
  const { categories } = useCategories();
  const cat = categories.find((c) => c.slug === slug);
  return (
    <ProductListing
      fixedCategory={slug}
      eyebrow="Collection"
      title={cat?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      intro={cat?.description || INTRO[slug]}
    />
  );
}
