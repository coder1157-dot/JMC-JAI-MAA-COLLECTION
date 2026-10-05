import { Link } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import HeroBanner from "../components/HeroBanner";
import ProductSection from "../components/ProductSection";
import { getFeatured, getNewArrivals } from "../api/products";
import { useCategories } from "../context/CategoriesContext";
import { useSettings } from "../context/SettingsContext";

export default function Home() {
  const { categories } = useCategories();
  const { whatsapp } = useSettings();
  const tiles = categories.length
    ? categories.filter((c) => c.active !== false)
    : [];

  return (
    <>
      <HeroBanner />

      {tiles.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">The Collections</span>
              <h2 className="display">Crafted for Every Celebration</h2>
              <span className="gold-rule" />
            </div>
            <div className="row g-4 justify-content-center">
              {tiles.slice(0, 2).map((c) => (
                <div className="col-md-6" key={c.id}>
                  <Link to={`/${c.slug}`} className="collection-tile" style={c.image ? { backgroundImage: `url("${c.image}")` } : undefined}>
                    <div className="collection-tile-inner">
                      <h3 className="display">{c.name}</h3>
                      <span>{c.description || "Explore the collection"}</span>
                      <em>Discover →</em>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <ProductSection eyebrow="Just In" title="New Arrivals" fetcher={getNewArrivals} limit={4} viewAll="/new-arrivals" tone="section-cream" />
      <ProductSection eyebrow="Our Signature Pieces" title="Featured Jewellery" fetcher={getFeatured} limit={4} />

      <section className="cta-band">
        <div className="container text-center">
          <span className="eyebrow light">Personal Consultation</span>
          <h2 className="display">Looking for something special?</h2>
          <p>Speak to us directly — we’ll help you choose the perfect piece, share prices and arrange delivery, anywhere in the world.</p>
          {whatsapp ? (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-jmc btn-jmc-gold">
              <FaWhatsapp /> Chat on WhatsApp
            </a>
          ) : (
            <Link to="/contact" className="btn-jmc btn-jmc-gold">
              Contact Us
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
