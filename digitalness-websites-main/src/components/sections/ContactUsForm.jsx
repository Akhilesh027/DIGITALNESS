import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUpRight,
    Mail,
    MapPin,
    PhoneCall,
    Send,
    Building2,
    CheckCircle2,
    Loader2,
    AlertCircle,
    X,
} from "lucide-react";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";

const address =
    "11/1, Main Rd, near Indira Gandhi Statue, Prashanthinagar, Prashanth Nagar, Uppal, Hyderabad, Telangana 500039";

const mapUrl =
    "https://maps.google.com/?q=DIGITALNESS%20-Web%20Development%20%26%20Digital%20Marketing%20Agency";

const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
        return "https://server.digitalness.co.in/api";
    }
    return "https://server.digitalness.co.in/api";
};

const ContactUsForm = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        service: "Website Development",
        message: "",
    });

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errorMessage) setErrorMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (!formData.name.trim()) {
            setErrorMessage("Please enter your name.");
            return;
        }
        if (!formData.phone.trim()) {
            setErrorMessage("Please enter your phone number.");
            return;
        }

        setLoading(true);

        try {
            const apiUrl = getApiBaseUrl();
            const response = await fetch(`${apiUrl}/leads/public`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    contactNumber: formData.phone.trim(),
                    phone: formData.phone.trim(),
                    email: formData.email.trim(),
                    businessType: formData.service || "Website Inquiry",
                    service: formData.service,
                    requirements: [formData.service || "General Inquiry"],
                    message: formData.message.trim(),
                    source: "Website",
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Failed to submit request. Please try again.");
            }

            setSubmitted(true);
            setFormData({
                name: "",
                email: "",
                phone: "",
                service: "Website Development",
                message: "",
            });
        } catch (error) {
            console.error("Submission error:", error);
            setErrorMessage(error.message || "Something went wrong. Please try again or call us directly.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <section id="/contact" className="relative overflow-hidden bg-[#edeafb] pt-36 pb-24 text-[#06053a]">
                <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#06053a]/10 blur-3xl" />
                <div className="absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-white blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-4">
                    <div className="mx-auto mb-14 max-w-3xl text-center">
                        <span className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-bold uppercase tracking-[0.18em] shadow-lg">
                            Contact Digitalness
                        </span>

                        <h2 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
                            Let’s Build Your Digital Growth Plan
                        </h2>

                        <p className="mt-5 text-lg font-medium leading-8 text-black/70">
                            Share your requirement and our team will get back to you with the right strategy.
                        </p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="rounded-[34px] bg-[#06053a] p-6 text-white shadow-[0_30px_90px_rgba(6,5,58,0.22)] md:p-8"
                        >
                            {[
                                {
                                    icon: PhoneCall,
                                    title: "Support",
                                    value: "+91 91822 71282",
                                },
                                {
                                    icon: Mail,
                                    title: "Email Address",
                                    value: "sales@digitalness.co.in",
                                },
                                {
                                    icon: Building2,
                                    title: "Office Address",
                                    value: address,
                                },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.title}
                                        className="mb-5 rounded-3xl border border-white/15 bg-white/10 p-5"
                                    >
                                        <div className="flex gap-4">
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#06053a]">
                                                <Icon size={26} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold">{item.title}</h3>
                                                <p className="mt-1 text-sm font-medium leading-7 text-white/75">
                                                    {item.value}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <a
                                href={mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group mt-6 block overflow-hidden rounded-[28px] border border-white/15 bg-white p-3"
                            >
                                <div className="relative h-[280px] overflow-hidden rounded-[22px] bg-[#edeafb]">
                                    <iframe
                                        title="Digitalness Location"
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4684.539524899514!2d78.5516232855286!3d17.406131759696063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9f9e8f724e5f%3A0x94ff7031f5f54ff3!2sDIGITALNESS%20%C2%AE%20-Web%20Development%20%26%20Digital%20Marketing%20Agency!5e1!3m2!1sen!2sin!4v1780553059003!5m2!1sen!2sin"
                                        className="h-full w-full border-0"
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />

                                    <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl bg-white/95 px-4 py-3 text-[#06053a] shadow-xl backdrop-blur-xl">
                                        <span className="flex items-center gap-2 text-sm font-bold">
                                            <MapPin size={18} />
                                            Open in Google Maps
                                        </span>
                                        <ArrowUpRight size={20} className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    </div>
                                </div>
                            </a>
                        </motion.div>

                        <motion.form
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="rounded-[34px] bg-white p-6 shadow-[0_30px_90px_rgba(6,5,58,0.14)] md:p-10"
                        >
                            <span className="mb-4 inline-flex rounded-full bg-[#edeafb] px-4 py-2 text-sm font-bold">
                                Request a Free Quote
                            </span>

                            <h3 className="text-3xl font-bold md:text-5xl">
                                Tell us about your project
                            </h3>

                            {errorMessage && (
                                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <div className="mt-8 grid gap-5">
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="rounded-2xl border border-[#06053a]/15 px-5 py-4 outline-none focus:border-[#06053a]"
                                    placeholder="Your Name *"
                                />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="rounded-2xl border border-[#06053a]/15 px-5 py-4 outline-none focus:border-[#06053a]"
                                    placeholder="Your Email"
                                />

                                <div className="grid gap-5 md:grid-cols-2">
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        className="rounded-2xl border border-[#06053a]/15 px-5 py-4 outline-none focus:border-[#06053a]"
                                        placeholder="Your Phone *"
                                    />
                                    <div className="relative">
                                        <select
                                            name="service"
                                            value={formData.service}
                                            onChange={handleChange}
                                            className="h-[58px] w-full appearance-none rounded-2xl border border-[#06053a]/15 bg-white px-5 pr-12 text-[#06053a] outline-none focus:border-[#06053a]"
                                        >
                                            <option value="Website Development">Website Development</option>
                                            <option value="Digital Marketing">Digital Marketing</option>
                                            <option value="SEO Services">SEO Services</option>
                                            <option value="Branding">Branding</option>
                                            <option value="CRM Development">CRM Development</option>
                                            <option value="Performance Marketing">Performance Marketing</option>
                                            <option value="Photography & Video">Photography & Video</option>
                                            <option value="Mobile App Development">Mobile App Development</option>
                                        </select>

                                        <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#06053a]">
                                            ▼
                                        </span>
                                    </div>
                                </div>

                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows="6"
                                    className="rounded-2xl border border-[#06053a]/15 px-5 py-4 outline-none focus:border-[#06053a]"
                                    placeholder="Your Message / Requirement *"
                                />

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center justify-center gap-3 rounded-[18px] bg-[#06053a] px-8 py-4 font-bold text-white shadow-[0_18px_45px_rgba(6,5,58,0.25)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(6,5,58,0.35)] disabled:opacity-70"
                                >
                                    {loading ? (
                                        <>
                                            Submitting...
                                            <Loader2 size={19} className="animate-spin" />
                                        </>
                                    ) : (
                                        <>
                                            Send Request
                                            <Send size={19} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                </div>
            </section>

            {/* Success Confirmation Modal */}
            <AnimatePresence>
                {submitted && (
                    <motion.div
                        className="fixed inset-0 z-[999] flex items-center justify-center bg-[#06053a]/75 px-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 25 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 25 }}
                            className="relative w-full max-w-md rounded-[30px] bg-white p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.25)]"
                        >
                            <button
                                onClick={() => setSubmitted(false)}
                                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#edeafb] text-[#06053a]"
                            >
                                <X size={18} />
                            </button>

                            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <CheckCircle2 size={42} />
                            </div>

                            <h3 className="text-2xl font-bold text-[#06053a]">
                                Enquiry Received!
                            </h3>

                            <p className="mt-3 text-sm leading-7 text-black/70">
                                Thank you for reaching out to Digitalness. Our team has received your project details and will connect with you shortly.
                            </p>

                            <button
                                onClick={() => setSubmitted(false)}
                                className="mt-6 rounded-full bg-[#06053a] px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105"
                            >
                                Done
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </>
    );
};

export default ContactUsForm;