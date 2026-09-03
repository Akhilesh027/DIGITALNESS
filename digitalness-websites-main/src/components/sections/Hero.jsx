import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUpRight,
    BadgeCheck,
    BookOpenText,
    Building2,
    ChevronRight,
    MapPin,
    MessageCircle,
    PhoneCall,
    Star,
    TrendingUp,
    Users,
} from "lucide-react";

const clientLogos = [
    "https://digitalness.co.in/assets/img/clients/1.png",
    "https://digitalness.co.in/assets/img/clients/2.png",
    "https://digitalness.co.in/assets/img/clients/3.png",
    "https://digitalness.co.in/assets/img/clients/4.png",
    "https://digitalness.co.in/assets/img/clients/5.png",
    "https://digitalness.co.in/assets/img/clients/6.png",
    "https://digitalness.co.in/assets/img/clients/7.png",
    "https://digitalness.co.in/assets/img/clients/8.png",
    "https://digitalness.co.in/assets/img/clients/9.png",
    "https://digitalness.co.in/assets/img/clients/10.png",
];

const storySlides = [
    {
        tag: "Chapter 01",
        title: "Digitalness",
        image:
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
        imageAlt: "Digital marketing services and business analytics",
        subtitle: "Digital Marketing & Technology Company",
        desc: "We help businesses grow with strategy, creative campaigns, paid ads, SEO, websites and CRM solutions designed for real business results.",
    },
    {
        tag: "Chapter 02",
        title: "Our Services",
        image:
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
        imageAlt: "Digital marketing services and business analytics",
        services: [
            "SEO Services",
            "Google Ads",
            "Meta Ads",
            "Social Media Marketing",
            "Website Design",
            "Web Development",
            "CRM Development",
            "Mobile Applications",
            "Branding",
            "Creative Design",
        ],
    },
    {
        tag: "Chapter 03",
        title: "Our Growth Journey",
        image:
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
        imageAlt: "Business growth journey and performance insights",
        stats: [
            { value: "2019", label: "Founded" },
            { value: "100+", label: "Websites" },
            { value: "150+", label: "Marketing Clients" },
            { value: "100%", label: "Client Focus" },
        ],
    },
    {
        tag: "Chapter 04",
        title: "Contact Digitalness",
        image:
            "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80",
        imageAlt: "Digitalness team ready to connect with businesses",
        contact: [
            { icon: MessageCircle, label: "WhatsApp", value: "+91 91822 71282" },
            { icon: PhoneCall, label: "Customer Support", value: "+91 404 5369584" },
            {
                icon: MapPin,
                label: "Address",
                value:
                    "11/1, Meenakshi Residency, Main Rd, Prashanth Nagar, Uppal, Hyderabad, Telangana 500039",
            },
        ],
    },
];

const DigitalnessAboutStory = () => {
    const [active, setActive] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActive((prev) => (prev + 1) % storySlides.length);
        }, 4200);

        return () => clearInterval(timer);
    }, []);

    const current = storySlides[active];
    const repeatedLogos = [...clientLogos, ...clientLogos];

    return (
        <section className="relative overflow-hidden bg-[#EDEAFB] py-20 text-[#06053A] md:py-24">
            <div className="absolute -left-40 top-0 h-[380px] w-[380px] rounded-full bg-white/80 blur-3xl" />
            <div className="absolute -right-40 bottom-0 h-[380px] w-[380px] rounded-full bg-[#06053A]/10 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto mb-14 max-w-3xl text-center">
                    <h2 className="text-4xl font-bold leading-tight text-[#06053A] sm:text-5xl lg:text-5xl">
                        Building Digital Growth Through Trust, Strategy & Creativity
                    </h2>

                    <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
                        Discover our journey, services, achievements and trusted client
                        network through a premium storytelling experience.
                    </p>
                </div>

                <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="relative order-2 rounded-[36px] border border-white/70 bg-white/65 p-4 shadow-[0_28px_80px_rgba(6,5,58,0.12)] backdrop-blur-2xl md:p-5 lg:order-1">
                        <div className="absolute -top-5 left-8 rounded-full bg-[#06053A] px-5 py-2 text-sm font-bold text-white shadow-xl">
                            Story Vault
                        </div>

                        <div className="grid gap-5 lg:grid-cols-[0.36fr_0.64fr]">
                            <div className="rounded-[28px] bg-[#06053A] p-5 text-white">
                                <div className="flex h-full flex-col justify-between">
                                    <div>
                                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDEAFB] text-[#06053A]">
                                            <BookOpenText size={28} />
                                        </div>

                                        <h3 className="text-2xl font-bold leading-tight">
                                            Digitalness Story Book
                                        </h3>

                                        <p className="mt-4 text-sm leading-7 text-white/70">
                                            Auto-changing chapters explain who we are, what we do and
                                            why businesses trust us.
                                        </p>

                                        {current.image && (
                                            <motion.div
                                                key={current.image}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.45, ease: "easeOut" }}
                                                className="mt-4 overflow-hidden rounded-2xl border border-white/15"
                                            >
                                                <img
                                                    src={current.image}
                                                    alt={current.imageAlt}
                                                    loading="lazy"
                                                    className="h-24 w-full object-cover sm:h-28 lg:h-24 xl:h-28"
                                                />
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="mt-8 space-y-3">
                                        {storySlides.map((item, index) => (
                                            <button
                                                key={item.tag}
                                                onClick={() => setActive(index)}
                                                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold transition-all duration-300 ${active === index
                                                    ? "bg-[#EDEAFB] text-[#06053A]"
                                                    : "bg-white/10 text-white/70 hover:bg-white/15"
                                                    }`}
                                            >
                                                {item.tag}
                                                <ChevronRight size={16} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="relative min-h-[490px] overflow-hidden rounded-[28px] bg-white p-7 md:min-h-[510px] md:p-8">
                                <div className="absolute right-[-80px] top-[-80px] h-52 w-52 rounded-full bg-[#EDEAFB] blur-2xl" />
                                <div className="absolute bottom-[-80px] left-[-80px] h-52 w-52 rounded-full bg-[#06053A]/10 blur-2xl" />

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={current.title}
                                        initial={{ opacity: 0, y: 35, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -25, scale: 0.96 }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className="relative z-10"
                                    >
                                        <span className="inline-flex rounded-full bg-[#06053A] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white">
                                            {current.tag}
                                        </span>

                                        <h3 className="mt-7 text-4xl font-bold leading-tight text-[#06053A] sm:text-5xl">
                                            {current.title}
                                        </h3>

                                        {current.subtitle && (
                                            <p className="mt-3 text-lg font-semibold text-slate-700">
                                                {current.subtitle}
                                            </p>
                                        )}

                                        {current.desc && (
                                            <p className="mt-7 max-w-xl text-lg leading-9 text-slate-700">
                                                {current.desc}
                                            </p>
                                        )}

                                        {current.services && (
                                            <div className="mt-8 grid grid-cols-2 gap-4">
                                                {current.services.map((service) => (
                                                    <div
                                                        key={service}
                                                        className="rounded-2xl border border-[#06053A]/10 bg-[#EDEAFB] px-4 py-4 text-sm font-bold text-[#06053A] shadow-sm"
                                                    >
                                                        {service}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {current.stats && (
                                            <div className="mt-8 grid grid-cols-2 gap-5">
                                                {current.stats.map((stat) => (
                                                    <div
                                                        key={stat.label}
                                                        className="rounded-[24px] bg-[#EDEAFB] p-5 text-center shadow-[0_18px_50px_rgba(6,5,58,0.08)]"
                                                    >
                                                        <h4 className="text-4xl font-bold text-[#06053A]">
                                                            {stat.value}
                                                        </h4>
                                                        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                                                            {stat.label}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {current.contact && (
                                            <div className="mt-8 space-y-4">
                                                {current.contact.map((item) => {
                                                    const Icon = item.icon;

                                                    return (
                                                        <div
                                                            key={item.label}
                                                            className="flex gap-4 rounded-[22px] bg-[#EDEAFB] p-5 shadow-sm"
                                                        >
                                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#06053A] text-white">
                                                                <Icon size={20} />
                                                            </div>

                                                            <div>
                                                                <p className="font-bold text-[#06053A]">
                                                                    {item.label}
                                                                </p>
                                                                <p className="mt-1 text-sm leading-7 text-slate-700">
                                                                    {item.value}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    <div className="relative order-1 rounded-[36px] bg-[#06053A] p-5 text-white shadow-[0_28px_80px_rgba(6,5,58,0.22)] md:p-6 lg:order-2">
                        <div className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-2xl bg-white text-[#FDCC0D] shadow-xl">
                            <Star size={25} fill="currentColor" />
                        </div>

                        <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6">
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#06053A]">
                                    <Users size={30} />
                                </div>

                                <h3 className="text-3xl font-bold">Our Trustful Clients</h3>

                                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/70">
                                    A collection of businesses that partnered with Digitalness for
                                    visibility, marketing and growth.
                                </p>
                            </div>

                            <div className="relative mt-8 h-[370px] overflow-hidden rounded-[26px] bg-[#EDEAFB] p-5">
                                <div className="absolute left-0 top-0 z-20 h-20 w-full bg-gradient-to-b from-[#EDEAFB] to-transparent" />
                                <div className="absolute bottom-0 left-0 z-20 h-20 w-full bg-gradient-to-t from-[#EDEAFB] to-transparent" />

                                <motion.div
                                    animate={{ y: ["0%", "-50%"] }}
                                    transition={{
                                        duration: 30,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                    className="flex flex-col gap-5"
                                >
                                    {repeatedLogos.map((logo, index) => (
                                        <div
                                            key={index}
                                            className="group flex h-24 items-center justify-center rounded-[24px] border border-[#06053A]/10 bg-white p-5 shadow-[0_12px_35px_rgba(6,5,58,0.10)] transition-all duration-500 hover:scale-[1.04]"
                                        >
                                            <img
                                                src={logo}
                                                alt="Digitalness client logo"
                                                className="max-h-16 max-w-full object-contain opacity-100"
                                            />
                                        </div>
                                    ))}
                                </motion.div>
                            </div>

                            <div className="mt-6 grid grid-cols-3 gap-4">
                                {[
                                    { icon: TrendingUp, value: "Growth" },
                                    { icon: BadgeCheck, value: "Trusted" },
                                    { icon: Building2, value: "Brands" },
                                ].map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            key={item.value}
                                            className="rounded-2xl bg-white p-4 text-center"
                                        >
                                            <Icon className="mx-auto mb-2 text-[#25D366]" size={24} />
                                            <p className="text-sm font-bold text-black">
                                                {item.value}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-14 flex justify-center">
                    <Link
                        to="/contact"
                        className="group inline-flex items-center gap-3 rounded-full bg-[#06053A] px-8 py-4 text-sm font-bold text-white shadow-[0_18px_50px_rgba(6,5,58,0.25)] transition hover:-translate-y-1"
                    >
                        Start Your Digital Growth Journey
                        <ArrowUpRight
                            size={18}
                            className="transition group-hover:translate-x-1 group-hover:-translate-y-1"
                        />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default DigitalnessAboutStory;