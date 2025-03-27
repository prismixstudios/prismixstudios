import { FaLinkedin } from "react-icons/fa";
import { FaInstagram, FaYoutube, FaEnvelope } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const Footer = () => {
  return (
    <footer className="bg-black text-white h-20 flex items-center">
      <div className="w-full max-w-screen-xl mx-auto flex justify-center items-center gap-10 px-4 sm:gap-20 sm:px-20">
        {/* Logo Section */}
        <div>
          <img
            src="/logo.png"
            alt="Logo"
            className="h-20 w-auto object-contain"
          />
        </div>
        {/* Social Links Section */}
        <div className="flex items-center space-x-4">
          <a
            href="https://www.instagram.com/prismixstudios/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-xl hover:text-pink-500 transition duration-300"
          >
            <FaInstagram />
          </a>
          <a
            href="https://x.com/PrismixStudios"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-xl hover:text-blue-400 transition duration-300"
          >
            <FaXTwitter />
          </a>
          <a
            href="https://www.youtube.com/@prismixstudios"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-xl hover:text-red-500 transition duration-300"
          >
            <FaYoutube />
          </a>
          <a
            href="mailto:Contact@prismixstudios.com"
            className="text-white text-xl hover:text-green-400 transition duration-300"
          >
            <FaEnvelope />
          </a>
          <a
            href="https://www.linkedin.com/company/prismixstudios/posts/?feedView=all"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-xl hover:text-blue-400 transition duration-300"
          >
            <FaLinkedin />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
