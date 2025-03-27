import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FaPlay, FaPause, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

const WhatWeDo = () => {
  const [playingVideo, setPlayingVideo] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const videoRefs = useRef({});
  const swiperRef = useRef(null);

  const videos = [
    {
      src: "video-3.mp4",
      id: 3,
      title: "International Women's Day Film for Tata Motors",
    },
    {
      src: "video-2.mp4",
      id: 2,
      title: "Being Human Body Building",
    },
    { src: "video-1.mp4", id: 1, title: "Book of Silence " },
  ];

  const togglePlayPause = (id) => {
    const vid = videoRefs.current[id];

    if (vid.paused) {
      Object.values(videoRefs.current).forEach((v) => v.pause());
      swiperRef.current?.autoplay.stop();
      vid.play();
      setPlayingVideo(id);
    } else {
      vid.pause();
      setPlayingVideo(null);
      swiperRef.current?.autoplay.start();
    }
  };

  const toggleMute = () => {
    Object.values(videoRefs.current).forEach((vid) => {
      vid.muted = !isMuted;
    });
    setIsMuted(!isMuted);
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col md:flex-row items-center justify-center px-4 sm:px-6 md:px-12 overflow-hidden">
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center md:bg-[center_top] bg-no-repeat z-10 opacity-25"
        style={{
          backgroundImage: "url('/whatwedo.png')",
          backgroundSize: "cover",
        }}
      ></div>

      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      <div className="relative z-10 max-w-7xl w-full flex flex-col md:flex-row-reverse items-center justify-between gap-4 md:gap-12 pt-40">
        {/* Right Side - Video Carousel */}
        <div className="w-full md:w-[50%] relative">
          <Swiper
            modules={[Autoplay, Pagination]}
            slidesPerView={1}
            centeredSlides={true}
            loop={true}
            autoplay={{ delay: 2500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            className="w-full flex justify-center items-center h-[40vh] md:h-[50vh]"
          >
            {videos.map((video) => (
              <SwiperSlide
                key={video.id}
                className="relative flex justify-center"
              >
                <div
                  className="relative group w-[90%] sm:w-full max-w-[600px] mx-auto px-2"
                  onMouseEnter={() => setHoveredVideo(video.id)}
                  onMouseLeave={() => setHoveredVideo(null)}
                >
                  {/* Video Player */}
                  <div className="w-full aspect-video relative">
                    <video
                      ref={(el) => (videoRefs.current[video.id] = el)}
                      src={video.src}
                      className="w-full h-full rounded-lg object-cover transition-all duration-300"
                      onPlay={() => setPlayingVideo(video.id)}
                      onPause={() => setPlayingVideo(null)}
                      muted={isMuted}
                      playsInline
                      onClick={() => togglePlayPause(video.id)}
                    />

                    {playingVideo !== video.id && (
                      <button
                        onClick={() => togglePlayPause(video.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg text-white p-4"
                      >
                        <FaPlay className="text-5xl" />
                      </button>
                    )}

                    {playingVideo === video.id && hoveredVideo === video.id && (
                      <button
                        onClick={() => togglePlayPause(video.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg text-white p-4 hidden md:flex"
                      >
                        <FaPause className="text-5xl" />
                      </button>
                    )}

                    <button
                      onClick={toggleMute}
                      className="absolute bottom-4 right-4 bg-black/50 text-white p-3 rounded-full"
                    >
                      {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>

                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="swiper-pagination"></div>
          </div>
        </div>

       
        <div className="w-full md:w-[50%] flex flex-col gap-4 text-center md:text-left">
          <motion.h2
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-white tracking-wider text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl leading-tight"
          >
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
              {" "}
              AI-Driven&nbsp;
            </span>
            Content Creation
          </motion.h2>

          <ul className="flex flex-wrap font-[arial] text-md sm:text-md md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl gap-3 sm:gap-4 pb-10">
            {[
              "Customized Edutainment content for school children across all age groups. ",
              "Short Films & Series – AI-generated storytelling for digital and OTT platforms.",
              "Animated Graphic Novels – Engaging visual narratives crafted with AI.",
              "Music Videos – AI-enhanced visuals that redefine the music experience.",
              "Corporate Content & Ad campaigns - High quality branding, communications and training solutions powered by AI",
              "Social Media Content – Scalable, AI-optimized content for all platforms.",
            ].map((item, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-white/10 border border-white/20 backdrop-blur-lg text-white px-4 py-2 sm:px-5 sm:py-3 rounded-2xl shadow-lg w-full md:w-auto text-base sm:text-lg md:text-xl"
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default WhatWeDo;
