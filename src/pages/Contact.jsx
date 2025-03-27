import { useState } from "react";
import emailjs from "@emailjs/browser";

const Contact = () => {
  const [formData, setFormData] = useState({
    from_name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage("");

    emailjs
      .send(
        import.meta.env.VITE_SERVICE_ID,
        import.meta.env.VITE_TEMPLATE_ID,
        {
          from_name: formData.from_name,
          email: formData.email,
          message: formData.message,
        },
        import.meta.env.VITE_PUBLIC_KEY
      )
      .then(
        (response) => {
          console.log("Email sent successfully:", response);
          setLoading(false);
          setFormData({ from_name: "", email: "", message: "" });
          setStatusMessage("✅ Message Sent Successfully!");
        },
        (error) => {
          console.error("Failed to send email:", error);
          setLoading(false);
          setStatusMessage("❌ Failed to Send Message. Please Try Again.");
        }
      );
  };

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center px-6 md:px-12">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-[-1]"
        style={{ backgroundImage: "url('/news.png')", opacity: 1 }}
      ></div>

      <div className="absolute inset-0 bg-black opacity-70 z-[-1]"></div>

      <div className="relative z-10 bg-black/50 backdrop-blur-lg rounded-xl p-10 w-full max-w-5xl flex flex-col md:flex-row items-center md:items-start shadow-lg">
        <div className="w-full md:w-1/2 text-white flex flex-col items-center md:items-end justify-center text-center md:text-right pr-0 md:pr-10 self-stretch">
          <h2 className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl tracking-wider leading-tight bg-gradient-to-r text-white">
            Want to <br /> collaborate <br /> or explore <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
              AI-driven <br />
            </span>
            storytelling?
          </h2>
        </div>

        <div className="w-full md:w-1/2 bg-gradient-to-br from-[#62137d] via-[#482177] to-[#1c326b] p-6 rounded-lg shadow-lg self-stretch flex flex-col justify-center">
          <h3 className="text-white text-4xl mb-6 text-center">Let's Talk</h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col">
              <label className="text-white text-md sm:text-lg">Your Name</label>
              <input
                type="text"
                name="from_name"
                value={formData.from_name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full p-2 bg-white/20 text-white rounded-2xl focus:outline-none"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-white text-md sm:text-lg">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full p-2 bg-white/20 text-white rounded-2xl focus:outline-none"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-white text-md sm:text-lg">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message here..."
                rows="4"
                className="w-full p-2 bg-white/20 text-white rounded-2xl focus:outline-none"
                required
              ></textarea>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-transparent shadow-[0_0_10px_rgba(255,255,255,0.8)] text-white text-md sm:text-lg px-3 py-1.5 rounded-md hover:bg-white hover:text-black"
                disabled={loading}
              >
                {loading ? "Sending..." : "Submit"}
              </button>
            </div>
          </form>

          {statusMessage && (
            <p
              className={`text-center text-lg mt-4 ${
                statusMessage.includes("✅") ? "text-green-400" : "text-red-400"
              }`}
            >
              {statusMessage}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Contact;
