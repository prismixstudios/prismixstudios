import { motion } from "framer-motion";

const About = () => {
  const teamMembers = [
    {
      name: "Ajay Devgn",
      designation: "Chairman",
      image: "/ajay.jpeg",
      description:
        "A four-time National Award-winning actor and industry veteran, Ajay Devgn brings over three decades of expertise to Prismix, a trailblazer in Generative AI. With a visionary approach to storytelling and technology, he drives AI-powered innovations in filmmaking, VFX, and digital content creation. Under his leadership, Prismix is redefining entertainment by seamlessly merging creativity with cutting-edge AI, setting new industry benchmarks.",
    },
    {
      name: "Sahil Nayar",
      designation: "Co-Founder & Chief Creative Officer",
      image: "/sahil.jpg",
      description:
        "Sahil Nayar is a seasoned professional in the Generative AI media content space, specializing in storytelling for entertainment and education. As Co-Founder and Chief Creative Officer of Prismix, he oversees content creation, and edutainment techniques to craft impactful experiences. A six sigma Black Belt with over 23 years of experience spanning media, corporate operations, and business consulting, Sahil combines creative vision with strategic insight.",
    },
    {
      name: "Danish Devgn",
      designation: "Co-Founder & Chief Business Officer",
      image: "/danish.jpeg",
      description:
        "A visionary entrepreneur, Danish Devgn drives Prismix’s mission to merge AI with entertainment. With expertise in filmmaking, VFX, and business strategy, he leads business development and strategic partnerships, ensuring Prismix stays at the forefront of AI-driven content creation. His innovative approach is shaping the future of digital storytelling.",
    },
    {
      name: "Vatsal Sheth",
      designation: "Co-Founder & Chief Executive Officer",
      image: "/vatsal.jpg",
      description:
        "Vatsal Sheth is an acclaimed Indian actor and entrepreneur, known for Taarzan: The Wonder Car, Ek Hasina Thi, and Just Mohabbat. As Co-Founder and CEO of Prismix Studios, Vatsal leads innovation in media and digital storytelling, blending technology with entertainment. A fitness enthusiast and sports lover, he continues to shape the future of Indian entertainment through his creative and business ventures.",
    },
    {
      name: "Nilesh Ghag",
      designation: "CFO",
      image: "/nilesh.jpeg",
      description:
        "With 28+ years of experience, Nilesh Ghag drives financial strategy across Media & entertainment, Renewable Energy, and Real Estate. As CFO, he oversees fiscal integrity for Devgn Films LLP, NY VFXWAALA LLP, Devgan Entertainment Software Ltd., NY Green Energy Pvt Ltd., and more. Under his leadership, NY VFXWAALA has flourished and NY Green Energy has scaled to 150 MW, with an ambitious target of 500 MW, and he has made a remarkable contribution to the production of blockbuster projects in Devgn films.",
    },
    {
      name: "Ruchi Kanojiya",
      designation: "Head - Compliance and Legal",
      image: "/ruchi.jpeg",
      description:
        "Ruchi Kanojiya, a Fellow Company Secretary and Lawyer with over 12 years of experience in Corporate governance, M&A, Regulatory Compliance, and IPR, plays a vital role in Devgn Group. She leads Compliance & Legal operations for entities such as Devgn Films LLP, NY VFXWAALA LLP, Goodbye Kansas Asia Pvt Ltd, Green Energy Pvt Ltd, Prismix Studios LLP, Lens Vault Studios Pvt Ltd, and more. Her vast experience strengthens legal frameworks across diverse verticals, including Media, Real Estate, and Renewable Energy.",
    },
  ];

  return (
    <div className="w-full">
      {/* First Section with Background Image & Overlay */}
      <div className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center px-6 lg:px-10 text-white">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/aboutus.png')`,
          }}
        ></div>

        {/* Overlay to Darken the Background */}
        <div className="absolute inset-0 bg-black opacity-75"></div>

        {/* Content Section */}
        <div className="relative max-w-[1200px] w-full flex flex-col lg:flex-row items-center justify-center">
          {/* Left Side - Image Collage */}
          <motion.div
            className="w-full lg:w-1/2 flex justify-center mb-6 lg:mb-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="grid grid-cols-2 gap-4 w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
              <div className="flex flex-col gap-4">
                <video
                  className="w-full h-[48%] rounded-lg shadow-lg overflow-hidden object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  src="/1.mp4"
                  type="video/mp4"
                ></video>

                {/* Second Instagram Video */}
                <video
                  className="w-full h-[48%] rounded-lg shadow-lg overflow-hidden object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  src="/2.mp4"
                  type="video/mp4"
                ></video>
              </div>

              {/* Third Instagram Video */}
              <video
                className="w-full h-full rounded-lg shadow-lg overflow-hidden object-cover"
                autoPlay
                loop
                muted
                playsInline
                src="/3.mp4"
                type="video/mp4"
                onError={() => console.error("Error loading video 3.mp4")}
              ></video>
            </div>
          </motion.div>

          {/* Right Side - Static Content */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left">
            <h1 className="text-white text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl tracking-wider leading-tight">
              Redefining media with&nbsp;
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-wider text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl leading-tight">
                generative AI
              </span>
            </h1>

            <p className="text-lg font-[arial] md:text-2xl lg:2xl xl:2xl leading-relaxed mt-4">
              At Prismix Studios, we bridge creativity and Generative AI to
              revolutionize storytelling across media. From short films to
              animated graphic novels, music videos, and corporate content, we
              bring untold stories to life.
            </p>
          </div>
        </div>
      </div>

      {/* Our Team Section */}
      <div className="bg-black py-16">
        <div
          className="py-16 bg-center relative "
          style={{
            backgroundImage: "url('/aboutus-vertical.png')",
            backgroundSize: "80% 100%", 
            backgroundRepeat: "no-repeat", 
            backgroundPosition: "center-top", 
            backgroundColor: "black",
          }}
        >
          <style>
            {`
      @media (max-width: 640px) {
        div[style] {
          background-size: 100% 120%; /* Zoom in and fill the space */
          background-position: center; /* Keep it centered */
        }
      }
    `}
          </style>
          {/* Overlay to Darken the Background */}
          <div className="absolute inset-0 bg-black opacity-75"></div>

          <motion.section
            className="w-full flex justify-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <div className="relative text-white max-w-6xl w-full mx-4 sm:mx-8 md:mx-auto px-6 sm:px-8 md:px-12 py-12 rounded-lg shadow-2xl">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semi-bold leading-tight text-center mb-2">
                The Team
              </h2>
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-400 text-center mb-10">
                Leaders and Legacy
              </h3>

              {/* Team Member Cards */}
              <div className="max-w-3xl mx-auto space-y-12">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    className="flex flex-col lg:flex-row items-center gap-12"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.2,
                    }}
                    viewport={{ once: true }}
                  >
                    {/* Profile Image Card */}
                    <motion.div className="relative bg-white/10 backdrop-blur-lg shadow-lg rounded-xl p-4 flex flex-col items-center w-56 h-[22rem] min-h-[22rem]">
                      <motion.img
                        src={member.image || "/placeholder.jpg"}
                        alt={member.name}
                        className="w-48 h-64 object-cover rounded-lg shadow-md"
                      />
                      <h3 className="text-xl font-[arial] font-bold md:text-2xl mt-2">
                        {member.name}
                      </h3>
                      <p className="text-white font-[arial] font-semibold text-sm md:text-lg lg:text-lg text-center tracking-wider xl:text-lg leading-tight mb-2">
                        {member.designation}
                      </p>
                    </motion.div>

                    {/* Description */}
                    <motion.div className="w-full lg:w-2/3 text-center lg:text-left">
                      <p className="text-md font-[arial] md:text-lg text-white leading-tight">
                        {member.description}
                      </p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default About;
