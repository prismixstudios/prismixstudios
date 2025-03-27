import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation(); // Track current location

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
    { to: "/contact", text: "Contact" },
  ];

  return (
    <nav className="bg-black h-20 px-10 shadow-lg flex items-center">
      <div className="container mx-auto flex justify-between items-center">
        {/* Left Links */}
        <ul className="hidden md:flex flex-1 justify-end gap-x-16 text-2xl text-white tracking-wider">
          {navLinks.slice(0, 2).map(({ to, text }) => (
            <li key={text} className="relative group">
              <Link
                to={to}
                className={`transition duration-300 ${
                  location.pathname === to ? "text-white font-bold" : ""
                }`}
              >
                {text}
              </Link>
              <motion.div className="absolute left-0 bottom-[-4px] h-[2px] w-full bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
              {location.pathname === to && (
                <motion.div
                  className="absolute left-0 bottom-[-4px] h-[2px] w-full bg-white"
                  layoutId="underline"
                />
              )}
            </li>
          ))}
        </ul>

        {/* Logo in the Center */}
        <div className="mx-auto md:mx-24 flex-shrink-0">
          <img
            src="/logo.png"
            alt="Prismix Logo"
            className="h-[128px] w-auto object-contain"
          />
        </div>

        {/* Right Links */}
        <ul className="hidden md:flex flex-1 justify-start gap-x-16 text-2xl text-white tracking-wider">
          {navLinks.slice(2).map(({ to, text }) => (
            <li key={text} className="relative group">
              <Link
                to={to}
                className={`transition duration-300 ${
                  location.pathname === to ? "text-white font-bold" : ""
                }`}
              >
                {text}
              </Link>
              <motion.div className="absolute left-0 bottom-[-4px] h-[2px] w-full bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
              {location.pathname === to && (
                <motion.div
                  className="absolute left-0 bottom-[-4px] h-[2px] w-full bg-white"
                  layoutId="underline"
                />
              )}
            </li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white text-3xl hamburger"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: isOpen ? 0 : "-100%", opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`md:hidden fixed top-0 left-0 w-full h-screen bg-black flex flex-col items-center space-y-5 mobile-menu z-50 pt-20 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Close Button */}
        <button
          className="absolute top-5 right-5 text-white text-4xl"
          onClick={() => setIsOpen(false)}
        >
          ✖
        </button>

        {/* Mobile Menu Links */}
        <ul className="space-y-6 text-center">
          {navLinks.map(({ to, text }, index) => (
            <motion.li
              key={text}
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: isOpen ? 0 : "-100%", opacity: isOpen ? 1 : 0 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
            >
              <Link
                to={to}
                className={`text-2xl text-white transition duration-300 ${
                  location.pathname === to ? "text-white font-bold" : ""
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
