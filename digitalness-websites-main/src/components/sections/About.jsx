import { motion } from "framer-motion";
import {
    ArrowUpRight,
    CheckCircle2,
    Sparkles,
    Target,
    Users,
    TrendingUp,
} from "lucide-react";
import Container from "../common/Container";
import { Link } from "react-router-dom";
import ContactUsForm from "./ContactUsForm";
// Optimized high-quality placeholder image for professional agency aesthetic
const aboutImage =
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80";

const highlights = [
    "SEO, performance marketing, branding, websites and CRM solutions",
    "High-quality digital solutions designed to accelerate business growth",
    "Clear strategy, honest communication and measurable execution",
];

const stats = [
    { value: "2019", label: "Founded", icon: Sparkles },
    { value: "360°", label: "Digital Growth", icon: Target },
    { value: "Trust", label: "Client-first Approach", icon: Users },
];

const About = () => {
    // Animation Variants for staggering internal elements
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <section id="about" className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-zinc-100 py-24 lg:py-32">
            {/* Subtle Sophisticated Background Orbs */}
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-[#06035a]/5 blur-3xl" />
            <div className="absolute bottom-12 right-1/4 h-96 w-96 rounded-full bg-violet-100/50 blur-3xl" />

            <Container className="relative grid items-center gap-16 lg:grid-cols-12">

                {/* Left Content Column */}
                <motion.div
                    className="lg:col-span-7"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                >
                    {/* Badge */}
                    <motion.div
                        variants={itemVariants}
                        className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06035a]/40 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#06035a]"></span>
                        </span>
                        <span className="text-base font-bold uppercase tracking-widest text-[#06035a]">
                            About Digitalness
                        </span>
                    </motion.div>

                    {/* Animated Heading */}
                    <motion.h2
                        variants={itemVariants}
                        className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:leading-[1.15]"
                    >
                        We help businesses grow with{" "}
                        <motion.span
                            className="relative inline-block px-2 text-[#06035a] isolation-auto"
                            initial={{ backgroundSize: "0% 100%" }}
                            whileInView={{ backgroundSize: "100% 100%" }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6, duration: 0.6, ease: "easeInOut" }}
                            style={{

                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "left bottom",
                            }}
                        >
                            smart digital marketing
                        </motion.span>
                        , creative design and reliable technology.
                    </motion.h2>

                    {/* Paragraph */}
                    <motion.p
                        variants={itemVariants}
                        className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600"
                    >
                        Digitalness Industries LLP is a results-driven digital marketing and
                        technology agency in Hyderabad, helping businesses achieve measurable
                        and sustainable growth. Through{" "}
                        <strong className="font-semibold text-slate-900">SEO, performance marketing, web development, branding, CRM solutions</strong>{" "}
                        and intelligent automation, we create integrated digital experiences
                        that improve search visibility, generate qualified leads, streamline
                        operations and build lasting brand value.
                    </motion.p>

                    {/* Checklist */}
                    <motion.div variants={itemVariants} className="mt-8 space-y-4">
                        {highlights.map((item, index) => (
                            <motion.div
                                key={index}
                                className="flex items-start gap-3 text-slate-700"
                                whileHover={{ x: 4 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <CheckCircle2 className="mt-1 shrink-0 text-emerald-500" size={20} />
                                <p className="font-medium leading-normal text-slate-700">{item}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* CTA Button */}
                    <motion.div variants={itemVariants} className="mt-10">
                        <Link
                            to="/contact"
                            className="group inline-flex items-center gap-2.5 rounded-xl bg-[#06035a] px-6 py-4 text-sm font-semibold text-white shadow-md shadow-[#06035a]/10 transition-all duration-200 hover:bg-[#06035a]/90 hover:shadow-lg hover:shadow-[#06035a]/20"
                        >
                            Let’s Build Your Growth
                            <ArrowUpRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Right Image & Stats Column */}
                <div className="lg:col-span-5 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-2.5 shadow-xl shadow-slate-100/80"
                    >
                        <div className="relative overflow-hidden rounded-[22px] bg-slate-100">
                            <img
                                src={aboutImage}
                                alt="Digital marketing presentation"
                                className="h-[380px] w-full object-cover object-center sm:h-[440px] transition-transform duration-700 hover:scale-105"
                            />
                            {/* Seamless Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                        </div>

                        {/* Floating Glass Card */}
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-lg backdrop-blur-md">
                                <div className="mb-2 flex items-center gap-2 text-slate-900">
                                    <TrendingUp size={18} className="text-[#06035a]" />
                                    <h3 className="font-bold text-base">Growth with purpose</h3>
                                </div>
                                <p className="text-sm leading-relaxed text-slate-600">
                                    Every campaign, website and design decision is planned to help
                                    your business attract the right audience and convert them with confidence.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Layout Alignment */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="grid gap-4 sm:grid-cols-3"
                    >
                        {stats.map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#06035a]/20 hover:shadow-md"
                                >
                                    <div className="mb-3 inline-flex p-2 rounded-xl bg-[#06035a]/5 text-[#06035a]">
                                        <Icon size={20} />
                                    </div>
                                    <h4 className="text-2xl font-bold tracking-tight text-slate-900">{stat.value}</h4>
                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                        {stat.label}
                                    </p>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>

            </Container>
        </section>
    );
};

export default About;