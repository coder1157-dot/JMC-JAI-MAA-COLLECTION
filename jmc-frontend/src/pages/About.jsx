import { Link } from "react-router-dom";

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Our Story</span>
          <h1 className="display">About JMC</h1>
          <p className="lead-text">Jai Maa Collection — jewellery with heritage, crafted to be remembered.</p>
        </div>
      </section>
      <section className="section">
        <div className="container narrow-col">
          <p>
            JMC – Jai Maa Collection brings together the timeless artistry of Jadau jewellery and the modern brilliance of
            American Diamond designs. Every piece is chosen for its craftsmanship, its character and its ability to become part of
            your family’s story.
          </p>
          <p>
            We believe buying jewellery should feel personal. That is why every JMC piece can be discussed directly with our team —
            from details and pricing to payment options and delivery, within India and across the world.
          </p>
          <div className="text-center mt-4">
            <Link to="/contact" className="btn-jmc btn-jmc-primary">Speak to Us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
