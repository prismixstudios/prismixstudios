import { FaLinkedin } from "react-icons/fa";
import { FaInstagram, FaYoutube, FaEnvelope } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        {/* Logo Section */}
        <div className="site-footer-logo-wrap">
          <img
            src="/logo.png"
            alt="Logo"
            className="site-footer-logo"
          />
        </div>
        {/* Social Links Section */}
        <div className="site-footer-socials">
          <a
            href="https://www.instagram.com/prismixstudios/"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-social site-footer-social-instagram"
          >
            <FaInstagram />
          </a>
          <a
            href="https://x.com/PrismixStudios"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-social site-footer-social-twitter"
          >
            <FaXTwitter />
          </a>
          <a
            href="https://www.youtube.com/@prismixstudios"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-social site-footer-social-youtube"
          >
            <FaYoutube />
          </a>
          <a
            href="mailto:Contact@prismixstudios.com"
            className="site-footer-social site-footer-social-email"
          >
            <FaEnvelope />
          </a>
          <a
            href="https://www.linkedin.com/company/prismixstudios/posts/?feedView=all"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-social site-footer-social-linkedin"
          >
            <FaLinkedin />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
