import { Link } from "react-router-dom";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { getBanners } from "../api/banners";
import useAsync from "../hooks/useAsync";

const isInternal = (l) => l && l.startsWith("/");

function HeroCopy({ title, subtitle, link }) {
  return (
    <div className="hero-copy">
      <span className="eyebrow light">Jai Maa Collection</span>
      <h1 className="display hero-title">
        {title || (
          <>
            Timeless Elegance,
            <br />
            Made to Be Remembered
          </>
        )}
      </h1>
      {subtitle && <p className="hero-sub">{subtitle}</p>}
      <div className="hero-buttons">
        {link ? (
          isInternal(link) ? (
            <Link to={link} className="btn-jmc btn-jmc-gold">
              Discover
            </Link>
          ) : (
            <a href={link} className="btn-jmc btn-jmc-gold" target="_blank" rel="noopener noreferrer">
              Discover
            </a>
          )
        ) : null}
        <Link to="/jadau-jewellery" className={`btn-jmc ${link ? "btn-jmc-ghost" : "btn-jmc-gold"}`}>
          Explore Jadau
        </Link>
        <Link to="/american-diamond" className="btn-jmc btn-jmc-ghost">
          Explore American Diamond
        </Link>
      </div>
    </div>
  );
}

export default function HeroBanner() {
  // A failing banners API must never break the homepage: fall back to the JMC hero.
  const { data } = useAsync(() => getBanners("home-hero"), []);
  const banners = [...(data?.data || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (!banners.length) {
    return (
      <section className="hero hero-fallback">
        <div className="container">
          <HeroCopy />
        </div>
      </section>
    );
  }

  return (
    <section className="hero">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        loop={banners.length > 1}
        autoplay={banners.length > 1 ? { delay: 6000, disableOnInteraction: false } : false}
        pagination={{ clickable: true }}
      >
        {banners.map((b) => (
          <SwiperSlide key={b.id}>
            <div className="hero-slide" style={{ backgroundImage: `url("${b.image}")` }}>
              <div className="hero-overlay" />
              <div className="container">
                <HeroCopy title={b.title} subtitle={b.subtitle} link={b.link} />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
