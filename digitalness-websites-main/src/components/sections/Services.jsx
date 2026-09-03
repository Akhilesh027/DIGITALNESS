import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import Container from "../common/Container";
import { services } from "../../data/services";
import rocket from "../../assets/rocket.png";
import { Link } from "react-router-dom";

const slugify = (text) =>
    text
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");

const Services = () => {
    return (
        <section
            id="services"
            className="relative overflow-hidden bg-[#edeafb] py-28 text-[#06053A]"
        >
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-0 top-20 h-72 w-72 rounded-full bg-[#06053A]/10 blur-3xl"
                />

                <motion.div
                    animate={{ x: [0, -80, 0], y: [0, 50, 0] }}
                    transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute right-0 top-40 h-80 w-80 rounded-full bg-white blur-3xl"
                />

                <motion.div
                    animate={{ y: [0, 60, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#06053A]/10 blur-3xl"
                />

                <div className="absolute inset-0 bg-gradient-to-b from-[#edeafb] via-[#f5f3ff] to-[#edeafb]" />
            </div>

            <div className="absolute left-1/2 top-[48%] hidden h-[520px] w-[1200px] -translate-x-1/2 rounded-[50%] border border-[#06053A]/10 lg:block" />
            <div className="absolute left-1/2 top-[58%] hidden h-[360px] w-[900px] -translate-x-1/2 rounded-[50%] border border-[#06053A]/10 lg:block" />

            <Container>
                <div className="relative z-10 mx-auto mb-16 max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#06053A]/10 bg-white px-5 py-2.5 shadow-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#06053A]/40 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#06053A]"></span>
                        </span>

                        <span className="text-base font-bold uppercase tracking-widest text-[#06035a]">
                            Our Services
                        </span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl font-bold leading-tight text-[#06053A] md:text-5xl"
                    >
                        Digital services that launch your brand higher
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="mx-auto mt-6 max-w-3xl text-lg font-medium leading-8 text-[#5B5B7A]"
                    >
                        We create websites, campaigns, branding and digital systems that
                        help businesses grow with clarity, creativity and performance.
                    </motion.p>
                </div>

                <div className="relative z-10">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {services.slice(0, 4).map((service, index) => {
                            const Icon = service.icon;

                            return (
                                <motion.article
                                    key={service.title}
                                    initial={{ opacity: 0, y: 45 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.08 }}
                                    className={`group relative overflow-hidden rounded-[28px] border border-[#06053A]/10 bg-white p-6 shadow-[0_20px_60px_rgba(6,5,58,0.08)] transition duration-500 hover:-translate-y-5 hover:border-[#06053A]/20 hover:shadow-[0_30px_90px_rgba(6,5,58,0.16)] ${index === 0 || index === 3 ? "lg:mt-24" : "lg:mt-8"
                                        }`}
                                >
                                    <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#06053a] transition duration-500 group-hover:scale-125" />

                                    <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06053A] text-white shadow-[0_16px_35px_rgba(6,5,58,0.22)] transition duration-500 group-hover:scale-110">
                                        <Icon size={27} />
                                    </div>

                                    <span className="relative mb-4 inline-flex rounded-full bg-[#edeafb] px-3 py-1 text-xs font-black text-[#06053A]">
                                        {service.tag || "Growth"}
                                    </span>

                                    <h3 className="relative text-xl font-black leading-tight text-[#06053A]">
                                        {service.title}
                                    </h3>

                                    <p className="relative mt-4 text-sm font-medium leading-7 text-[#5B5B7A]">
                                        {service.description}
                                    </p>

                                    <div className="relative mt-5 space-y-2">
                                        {service.features?.slice(0, 2).map((feature) => (
                                            <div
                                                key={feature}
                                                className="flex items-center gap-2 text-sm font-semibold text-[#5B5B7A]"
                                            >
                                                <CheckCircle2 size={15} className="text-[#06053A]" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>

                                    <Link
                                        to={`/blogs/${slugify(service.title)}`}
                                        className="relative mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#06053A] bg-white px-5 py-3 text-sm font-black text-[#06053A] transition-all duration-300 hover:bg-[#06053A] hover:text-white"
                                    >
                                        Explore Service
                                        <ArrowUpRight
                                            size={17}
                                            className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                                        />
                                    </Link>
                                </motion.article>
                            );
                        })}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.85 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative z-20 mx-auto my-10 flex w-full justify-center lg:-my-2"
                    >
                        <motion.img
                            src={rocket}
                            alt="Digitalness Rocket"
                            animate={{ y: [0, -25, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="w-[180px] drop-shadow-[0_20px_60px_rgba(6,5,58,0.25)] md:w-[240px] lg:w-[300px]"
                        />
                    </motion.div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {services.slice(4, 8).map((service, index) => {
                            const Icon = service.icon;

                            return (
                                <motion.article
                                    key={service.title}
                                    initial={{ opacity: 0, y: 45 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.08 }}
                                    className={`group relative overflow-hidden rounded-[28px] border border-[#06053A]/10 bg-white p-6 shadow-[0_20px_60px_rgba(6,5,58,0.08)] transition duration-500 hover:-translate-y-5 hover:border-[#06053A]/20 hover:shadow-[0_30px_90px_rgba(6,5,58,0.16)] ${index === 0 || index === 3 ? "lg:-mt-8" : "lg:mt-10"
                                        }`}
                                >
                                    <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#06053a] transition duration-500 group-hover:scale-125" />

                                    <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06053A] text-white shadow-[0_16px_35px_rgba(6,5,58,0.22)] transition duration-500 group-hover:scale-110">
                                        <Icon size={27} />
                                    </div>

                                    <span className="relative mb-4 inline-flex rounded-full bg-[#edeafb] px-3 py-1 text-xs font-black text-[#06053A]">
                                        {service.tag || "Growth"}
                                    </span>

                                    <h3 className="relative text-xl font-black leading-tight text-[#06053A]">
                                        {service.title}
                                    </h3>

                                    <p className="relative mt-4 text-sm font-medium leading-7 text-[#5B5B7A]">
                                        {service.description}
                                    </p>

                                    <Link
                                        to={`/blogs/${slugify(service.title)}`}
                                        className="relative mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#06053A] bg-white px-5 py-3 text-sm font-black text-[#06053A] transition-all duration-300 hover:bg-[#06053A] hover:text-white"
                                    >
                                        Explore Service
                                        <ArrowUpRight
                                            size={17}
                                            className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                                        />
                                    </Link>
                                </motion.article>
                            );
                        })}
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default Services;