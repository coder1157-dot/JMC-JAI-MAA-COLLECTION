import { FaWhatsapp } from "react-icons/fa";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { useSettings } from "../context/SettingsContext";

export default function Contact() {
  const { whatsapp, phone, email, address, loading, error } = useSettings();
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Personal Consultation</span>
          <h1 className="display">Contact JMC</h1>
          <p className="lead-text">Questions about a piece, a custom order or international delivery? We’re a message away.</p>
        </div>
      </section>
      <section className="section">
        <div className="container narrow-col">
          {error && !whatsapp && <p className="text-center">Contact details are unavailable right now. Please try again shortly.</p>}
          <div className="contact-cards">
            {whatsapp && (
              <a className="contact-card whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                <FaWhatsapp />
                <strong>WhatsApp</strong>
                <span>Start a conversation</span>
              </a>
            )}
            {phone && (
              <a className="contact-card" href={`tel:${phone}`}>
                <FiPhone />
                <strong>Call</strong>
                <span>{phone}</span>
              </a>
            )}
            {email && (
              <a className="contact-card" href={`mailto:${email}`}>
                <FiMail />
                <strong>Email</strong>
                <span>{email}</span>
              </a>
            )}
            {address && (
              <div className="contact-card">
                <FiMapPin />
                <strong>Visit</strong>
                <span>{address}</span>
              </div>
            )}
          </div>
          {loading && <p className="text-center mt-3">Loading contact details…</p>}
        </div>
      </section>
    </>
  );
}
