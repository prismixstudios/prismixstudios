import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getLatestNews } from "../services/newsService";
import { news as STATIC_NEWS } from "../data/news";

const Home = () => {
  // Latest News section. Initial value comes from the static seed so the
  // section renders something on first paint; getLatestNews() then swaps in
  // the live items once GitHub raw JSON has loaded (≤ ~100 ms typically).
  // Only the first three items are displayed — older items stay in the JSON
  // but are not shown on the homepage.
  const [newsItems, setNewsItems] = useState(STATIC_NEWS);

  useEffect(() => {
    let alive = true;
    getLatestNews()
      .then((items) => {
        if (alive && Array.isArray(items) && items.length > 0) {
          setNewsItems(items);
        }
      })
      .catch(() => {
        // Already covered by the service-level fallback; nothing to do here.
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="relative w-full h-auto">
      {/* Full-Screen Video Section */}
      <section className="relative w-full h-auto">
        <div
          className="w-full"
          style={{ paddingTop: "56.25%" }}
        >
          <video
            className="absolute top-0 left-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/home-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      {/* Background & Text Section */}
      <section className="relative w-full h-[50vh] md:h-screen flex items-center justify-center snap-start">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center md:bg-[center_top] bg-no-repeat z-10 opacity-25"
          style={{ backgroundImage: "url('/desktop-bg-home.png')" }}
        ></div>

        <div className="absolute inset-0 bg-black bg-opacity-40"></div>

        <div className="relative z-20 flex flex-col items-center text-center px-10">
          <div className="block md:hidden">
            <h1 className="text-white text-3xl tracking-wider leading-tight">
              Unleashing the Future
            </h1>
            <h1 className="text-white text-3xl tracking-wider leading-tight">
              of Media With
            </h1>
            <h1 className="text-white text-3xl tracking-wider leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text font-semibold">
                AI-POWERED
              </span>
            </h1>
            <h1 className="text-white text-3xl tracking-wider leading-tight">
              Storytelling
            </h1>
          </div>

          <div className="hidden md:block">
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="max-w-3xl"
            >
              <h1 className="text-white text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl tracking-wider leading-tight">
                Unleashing the Future of
                <br />
              </h1>
              <h1 className="text-white text-4xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl tracking-wider leading-tight">
                Media With{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text font-semibold tracking-wider text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl leading-tight">
                  AI-POWERED
                </span>
              </h1>
              <h1 className="text-white text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl tracking-wider leading-tight">
                Storytelling
              </h1>
            </motion.div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-center space-x-4">
            <Link
              to="/whatwedo"
              onClick={() => window.scrollTo(0, 0)} 
              className="bg-white/10 border border-white/20 backdrop-blur-lg text-white px-4 py-3 rounded-lg text-sm sm:text-md md:text-lg lg:text-xl xl:text-2xl hover:bg-white hover:text-black transition duration-300 tracking-wider"
            >
              Explore Our Work
            </Link>
          </div>
        </div>
      </section>

      {/* News Section */}
      <div className="bg-black py-16">
        <div
          className="py-16 bg-center px-10 flex justify-center relative bg-no-repeat"
          style={{
            backgroundImage: "url('/desktop-bg-home.png')",
            backgroundSize: "70% 100%",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
         
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>

          <div className="relative w-full max-w-6xl z-10">
            <h2 className="text-white text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl tracking-wider font-semi-bold text-center mb-10">
              Latest News
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center items-start">
              {/*
                Latest News cards — dynamic.
                Source: data/latest-news.json on GitHub, fetched via newsService.
                Falls back to the seeded src/data/news.js if the fetch fails.
                Only the first three items are shown on the homepage; the rest
                stay in the dataset for archival / future tweaks.
              */}
              {newsItems.slice(0, 3).map((item, i) => (
                <a
                  key={item.id ?? i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-black/50 backdrop-blur-lg shadow-lg rounded-lg overflow-hidden p-4 block flex flex-col h-full"
                >
                  <div className="w-full h-48 overflow-hidden rounded-md">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl text-white font-[arial] md:text-2xl mt-4 text-center">
                    {item.title}
                  </h3>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="py-16 bg-black text-white overflow-hidden">
        <h2 className="text-white text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl tracking-wider font-semi-bold text-center mb-10">
          Our Clients
        </h2>
        <div className="overflow-hidden w-full">
          <div className="clients-marquee-track">
            {[
              { src: "/sodexo.png",      alt: "Sodexo" },
              { src: "/being-human.png", alt: "Being Human" },
              { src: "/flf.png",         alt: "FLF" },
              { src: "/tata.png",        alt: "Tata" },
              { src: "/gsl.png",         alt: "GSL" },
              { src: "/spotlight.png",   alt: "Spotlight" },
              { src: "/3Pine.png",       alt: "3Pine" },
              { src: "/starcruise2.png", alt: "Star Cruise" },
              { src: "/indivar.jpg",     alt: "Indivar" },
              { src: "/LuvFilms.jpg",    alt: "Luv Films" },
            ].concat([
              { src: "/sodexo.png",      alt: "Sodexo" },
              { src: "/being-human.png", alt: "Being Human" },
              { src: "/flf.png",         alt: "FLF" },
              { src: "/tata.png",        alt: "Tata" },
              { src: "/gsl.png",         alt: "GSL" },
              { src: "/spotlight.png",   alt: "Spotlight" },
              { src: "/3Pine.png",       alt: "3Pine" },
              { src: "/starcruise2.png", alt: "Star Cruise" },
              { src: "/indivar.jpg",     alt: "Indivar" },
              { src: "/LuvFilms.jpg",    alt: "Luv Films" },
            ]).map((client, i) => (
              <div key={i} className="flex-shrink-0 flex items-center justify-center px-10">
                <img
                  src={client.src}
                  alt={client.alt}
                  className="h-20 w-40 object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
