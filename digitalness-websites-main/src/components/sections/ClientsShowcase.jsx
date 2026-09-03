import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import srinivasaFurnitures from "../../assets/clients/SrinivasaFurnitures.png";

const clientLogos = [
    srinivasaFurnitures,
    "/assets/img/clients/sri-utsavam.svg",
    "/assets/img/clients/toni-and-guy.svg",
    "/assets/img/clients/meenakshi-dental.svg",
    "/assets/img/clients/royal-grand.svg",
    "/assets/img/clients/apex-interiors.svg",
    "/assets/img/clients/veda-ayurveda.svg",
    "/assets/img/clients/horizon-infra.svg",
    "/assets/img/clients/sunrise-motors.svg",
    "/assets/img/clients/saffron-dining.svg",
    "/assets/img/clients/balaji-jewellers.svg",
    "/assets/img/clients/prime-fitness.svg",
];

const ClientsShowcase = () => {
    const logos = [...clientLogos, ...clientLogos];

    return (
        <section className="relative overflow-hidden bg-[#EDEAFB] py-24 text-[#06053A]">
            <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-white/90 blur-3xl" />
            <div className="absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-white/80 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mx-auto mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#06053A]/10 bg-white px-5 py-2.5 shadow-sm"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#06053A]/40 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#06053A]"></span>
                    </span>

                    <span className="text-base font-bold uppercase tracking-[0.18em] text-[#06053A]">
                        Trusted Marketing Clients
                    </span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-xl font-bold leading-tight sm:text-2xl lg:text-5xl"
                >
                    Brands Growing With Digitalness
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg"
                >
                    Businesses trust us for consistent marketing, better visibility,
                    quality lead generation and long-term digital growth.
                </motion.p>

                <div className="relative mt-16 overflow-hidden py-16">
                    <div className="pointer-events-none absolute left-0 top-0 z-20 h-full w-28 bg-gradient-to-r from-[#EDEAFB] to-transparent" />
                    <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-28 bg-gradient-to-l from-[#EDEAFB] to-transparent" />

                    <motion.div
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{
                            duration: 65,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        className="flex w-max items-center gap-8 px-8"
                    >
                        {logos.map((logo, index) => (
                            <div
                                key={index}
                                className="group relative flex h-[190px] w-[220px] shrink-0 cursor-pointer items-center justify-center rounded-[26px] border border-white bg-white p-6 shadow-[0_20px_55px_rgba(6,5,58,0.10)] transition-all duration-700 ease-out hover:z-30 hover:h-[260px] hover:w-[310px] hover:-translate-y-8 hover:scale-105 hover:shadow-[0_35px_90px_rgba(6,5,58,0.18)]"
                            >
                                <div className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-white via-white to-[#EDEAFB]" />

                                <img
                                    src={logo}
                                    alt="Digitalness client logo"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.style.display = "none";
                                    }}
                                    className="relative z-10 max-h-[115px] max-w-[170px] object-contain opacity-100 transition-all duration-700 ease-out group-hover:max-h-[175px] group-hover:max-w-[255px] group-hover:scale-110"
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ClientsShowcase;