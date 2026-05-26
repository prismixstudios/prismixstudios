import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        isOpen &&
        !event.target.closest(".mobile-menu") &&
        !event.target.closest(".hamburger")
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isOpen]);

  const navLinks = [
    { to: "/", text: "Home" },
    { to: "/about", text: "About Us" },
    { to: "/whatwedo", text: "What We Do" },
    { to: "/blogs", text: "Blogs" },
    { to: "/contact", text: "Contact Us" },
  ];

  const renderLink = ({ to, text }) => (
    <li key={text} className="site-nav-item">
      <Link
        to={to}
        className={`site-nav-link ${
          location.pathname === to ? "site-nav-link-active" : ""
        }`}
      >
        {text}
      </Link>
    </li>
  );

  return (
    <nav className="site-navbar">
      <div className="site-navbar-inner">
        <Link to="/" className="site-nav-logo-link">
          <img src="/logo.png" alt="Prismix Logo" className="site-nav-logo" />
        </Link>

        <ul className="site-nav-group site-nav-primary">
          {navLinks.map(renderLink)}
        </ul>

        <button
          className="hamburger site-mobile-menu-button"
          aria-label="Open navigation menu"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          Menu
        </button>
      </div>

      <motion.div
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: isOpen ? 0 : "-100%", opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`mobile-menu site-mobile-menu ${
          isOpen ? "site-mobile-menu-open" : ""
        }`}
      >
        <button
          className="site-mobile-close"
          aria-label="Close navigation menu"
          onClick={() => setIsOpen(false)}
        >
          Close
        </button>

        <ul className="site-mobile-links">
          {navLinks.map(({ to, text }, index) => (
            <motion.li
              key={text}
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: isOpen ? 0 : "-100%", opacity: isOpen ? 1 : 0 }}
              transition={{ delay: index * 0.12, duration: 0.35 }}
            >
              <Link
                to={to}
                className={`site-mobile-link ${
                  location.pathname === to ? "site-nav-link-active" : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                {text}
              </Link>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </nav>
  );
};

export default Navbar;
