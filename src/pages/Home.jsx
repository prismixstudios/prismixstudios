import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Home = () => {
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
              {/* News Card 1 */}
              <a
                href="https://m.economictimes.com/industry/media/entertainment/media/ajay-devgn-launches-ai-driven-media-company-prismix/articleshow/118796858.cms"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/50 backdrop-blur-lg shadow-lg rounded-lg overflow-hidden p-4 block flex flex-col h-full"
              >
                <div className="w-full h-48 overflow-hidden rounded-md">
                  <img
                    src="/news1.png"
                    alt="News 1"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl text-white font-[arial] md:text-2xl mt-4 text-center">
                  Ajay Devgn launches AI-driven media company Prismix
                </h3>
              </a>

              {/* News Card 2 */}
              <a
                href="https://yourstory.com/ai-story/exclusive-ajay-devgn-prismix-studios-partners-get-set-learn-ai-education-content-schools"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/50 backdrop-blur-lg shadow-lg rounded-lg overflow-hidden p-4 block flex flex-col h-full"
              >
                <div className="w-full h-48 overflow-hidden rounded-md">
                  <img
                    src="/news2_1.png"
                    alt="News 2"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl text-white font-[arial] md:text-2xl mt-4 text-center">
                  Ajay Devgn’s Prismix Studios partners with Get Set Learn to create AI content for students
                </h3>
              </a>

              {/* News Card 3 */}
              <a
                href="https://variety.com/2025/film/news/ajay-devgn-generative-ai-prismix-1236330979/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black/50 backdrop-blur-lg shadow-lg rounded-lg overflow-hidden p-4 block flex flex-col h-full"
              >
                <div className="w-full h-48 overflow-hidden rounded-md">
                  <img
                    src="/news3.png"
                    alt="News 3"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl text-white font-[arial] md:text-2xl mt-4 text-center">
                  Ajay Devgn Launches Generative AI Storytelling Venture Prismix
                  (EXCLUSIVE)
                </h3>
              </a>
            </div>
          </div>
        </div>
      </div>

      <section className="py-16 px-10 bg-black text-white">
        <h2 className="text-white text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl tracking-wider font-semi-bold text-center mb-10">
          Our Clients
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:mx-40 md:mx-40 lg:mx-40 gap-10 md:gap-20 lg:gap-30 xl:gap-30 justify-items-center">
          <img
            src="/sodexo.png"
            alt="Client 1"
            className="h-20 w-40 object-contain"
          />
          <img
            src="/being-human.png"
            alt="Client 2"
            className="h-20 w-40 object-contain"
          />
          <img
            src="/flf.png"
            alt="Client 3"
            className="h-20 w-40 object-contain"
          />
          <img
            src="/tata.png"
            alt="Client 4"
            className="h-20 w-40 object-contain"
          />
          <img
            src="/gsl.png"
            alt="Client 5"
            className="h-20 w-40 object-contain"
          />
          <img
            src="/spotlight.png"
            alt="Client 6"
            className="h-20 w-40 object-contain"
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
