import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaYoutube } from "react-icons/fa";
import Logo from "./Logo";
import { useSettings } from "../context/SettingsContext";
import { CART_ENABLED } from "../utils/constants";

export default function Footer() {
  const { whatsapp, phone, email, address, social } = useSettings();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-4">
            <Logo light />
            <p className="footer-text mt-3">
              Heritage Jadau and brilliant American Diamond jewellery, crafted to be cherished for generations.
              Personal consultation and international enquiries welcome.
            </p>
            <div className="footer-social">
              {social?.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <FaInstagram />
                </a>
              )}
              {social?.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <FaFacebookF />
                </a>
              )}
              {social?.youtube && (
                <a href={social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                  <FaYoutube />
                </a>
              )}
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                  <FaWhatsapp />
                </a>
              )}
            </div>
          </div>
          <div className="col-6 col-lg-2">
            <h4>Collections</h4>
            <ul>
              <li><Link to="/jadau-jewellery">Jadau Jewellery</Link></li>
              <li><Link to="/american-diamond">American Diamond</Link></li>
              <li><Link to="/new-arrivals">New Arrivals</Link></li>
            </ul>
          </div>
          <div className="col-6 col-lg-2">
            <h4>Account</h4>
            <ul>
              <li><Link to="/profile">My Account</Link></li>
              <li><Link to="/orders">Orders</Link></li>
              <li><Link to="/wishlist">Wishlist</Link></li>
              {CART_ENABLED && <li><Link to="/cart">Cart</Link></li>}
            </ul>
          </div>
          <div className="col-lg-4">
            <h4>Get in touch</h4>
            <ul>
              {phone && <li>Phone: <a href={`tel:${phone}`}>{phone}</a></li>}
              {email && <li>Email: <a href={`mailto:${email}`}>{email}</a></li>}
              {address && <li>{address}</li>}
              <li><Link to="/contact">Contact &amp; enquiries</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} JMC – Jai Maa Collection. All rights reserved.</div>
      </div>
    </footer>
  );
}
