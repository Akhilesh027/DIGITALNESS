import { motion } from "framer-motion";
import teamImage from "../../assets/team/team.png";
import {
    ArrowUpRight,
    CheckCircle2,
    Lightbulb,
    Users,
    ShieldCheck,
    SearchCheck,
    Handshake,
    BarChart3,
    BadgeCheck,
} from "lucide-react";
import Container from "../common/Container";

const points = [
    {
        title: "Strategy Before Execution",
        description:
            "We understand your business, target audience and goals before creating a tailored digital marketing strategy focused on measurable, long-term growth.",
        hoverLine: "Every action starts with a clear, goal roadmap.",
        icon: Lightbulb,
    },
    {
        title: "Dedicated Team of Specialists",
        description:
            "From SEO and paid advertising to branding, website development, CRM solutions and content marketing, every service is managed by an experienced specialist.",
        hoverLine: "The right specialist supports every part of your growth.",
        icon: Users,
    },
    {
        title: "Transparent Project Management",
        description:
            "Stay informed with regular updates, realistic timelines, clear communication and practical recommendations throughout every stage of your project.",
        hoverLine: "Clear updates, honest timelines and no hidden surprises.",
        icon: ShieldCheck,
    },
    {
        title: "SEO-Focused Digital Solutions",
        description:
            "We create fast, user-friendly websites, targeted campaigns and valuable content designed to improve search visibility, engagement and conversions.",
        hoverLine: "Built to be discovered, trusted and chosen online.",
        icon: SearchCheck,
    },
    {
        title: "Long-Term Growth Partnership",
        description:
            "We build lasting client relationships by understanding your evolving goals and providing reliable digital solutions that support sustainable business growth.",
        hoverLine: "Consistent support that evolves with your business.",
        icon: Handshake,
    },
    {
        title: "Measurable Business Results",
        description:
            "Our SEO, digital marketing and technology solutions are focused on improving online visibility, generating qualified enquiries, increasing customer engagement and driving measurable business growth.",
        hoverLine: "Progress tracked through leads, visibility and conversions.",
        icon: BarChart3,
    },
];

const trustPoints = [
    "250+ businesses served across digital marketing and technology",
    "In-house team for SEO, ads, branding, websites, CRM and creatives",
    "Clear reporting, practical suggestions and long-term support",
    "Growth-focused execution for leads, visibility and conversions",
    "Tailored strategies built around every client’s goals, audience and market",
    "Responsive support from initial planning through launch and optimisation",
];

const WhyChoose = () => {
    return (
        <section className="relative overflow-hidden bg-white py-24">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#edeafb,transparent_35%),radial-gradient(circle_at_bottom_right,#edeafb,transparent_35%)]" />

            <Container className="relative">
                <div className="mx-auto mb-16 max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-8 flex justify-center"
                    >
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-[#06053a]/10 bg-white px-5 py-2.5 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#06053a]/40 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#06053a]"></span>
                            </span>

                            <span className="text-base font-bold uppercase tracking-widest text-[#06035a]">
                                Why Choose Digitalness
                            </span>
                        </div>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl font-bold leading-tight text-[#06053a] md:text-4xl"
                    >
                        A growth partner who works with{" "}
                        <span className="px-3 text-[#4f46e5]">
                            clarity, care and strategy.
                        </span>
                    </motion.h2>

                    <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#06053a]/70">
                        We help businesses build a stronger digital presence through SEO,
                        digital marketing, branding, website development, CRM solutions and
                        performance-focused campaigns.
                    </p>
                </div>

                <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
                    <motion.div
                        initial={{ opacity: 0, x: -35 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="sticky top-28 h-full"
                    >
                        <div className="h-full overflow-hidden rounded-[36px] border border-[#06053a]/10 bg-white shadow-[0_25px_80px_rgba(6,5,58,0.12)]">
                            <div className="relative overflow-hidden">
                                <img
                                    src={teamImage}
                                    alt="Digitalness Team"
                                    className="h-[320px] w-full object-cover"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-[#06053a]/80 via-transparent to-transparent" />

                                <div className="absolute bottom-6 left-6">
                                    <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#06053a]">
                                        Digitalness Team
                                    </div>
                                </div>
                            </div>

                            <div className="p-8">
                                <h3 className="text-3xl font-bold text-[#06053a]">
                                    Real people behind real results.
                                </h3>

                                <p className="mt-4 leading-8 text-[#06053a]/70">
                                    Our team combines digital marketing, SEO, branding, website
                                    development, CRM solutions and creative design expertise to
                                    help businesses grow with confidence.
                                </p>

                                <div className="mt-6 grid grid-cols-3 gap-3">
                                    <div className="rounded-2xl bg-[#edeafb] p-4 text-center">
                                        <h4 className="text-2xl font-bold text-[#06053a]">250+</h4>
                                        <p className="text-xs font-semibold text-[#06053a]/70">
                                            Digital Marketing Clients
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-[#edeafb] p-4 text-center">
                                        <h4 className="text-2xl font-bold text-[#06053a]">100+</h4>
                                        <p className="text-xs font-semibold text-[#06053a]/70">
                                            Websites, CRMs & Apps
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-[#edeafb] p-4 text-center">
                                        <h4 className="text-2xl font-bold text-[#06053a]">100%</h4>
                                        <p className="text-xs font-semibold text-[#06053a]/70">
                                            Client Satisfaction Focus
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-7 rounded-3xl border border-[#06053a]/10 bg-[#faf9ff] p-5">
                                    <div className="mb-4 flex items-center gap-2">
                                        <BadgeCheck size={20} className="text-[#4f46e5]" />
                                        <h4 className="font-bold text-[#06053a]">
                                            Why clients trust our team
                                        </h4>
                                    </div>

                                    <div className="space-y-3">
                                        {trustPoints.map((item) => (
                                            <div key={item} className="flex gap-3 text-sm text-[#06053a]/75">
                                                <CheckCircle2
                                                    size={17}
                                                    className="mt-0.5 shrink-0 text-[#06053a]"
                                                />
                                                <p className="leading-6 font-medium">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-7 rounded-3xl bg-[#06053a] p-5 text-white">
                                    <p className="text-sm leading-7 text-white/80">
                                        “We work like an extended digital team for your business -
                                        with planning, execution, reporting and continuous
                                        improvement.”
                                    </p>

                                    <div className="mt-4">
                                        <h5 className="font-bold">Digitalness Team</h5>
                                        <p className="text-xs font-semibold text-white/60">
                                            Digital Marketing • SEO • Websites • CRM
                                        </p>
                                    </div>
                                </div>

                                <a
                                    href="#contact"
                                    className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#06053a] px-6 py-4 text-sm font-bold text-white transition hover:scale-105"
                                >
                                    Meet Our Team
                                    <ArrowUpRight size={18} />
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    <div className="relative">
                        <div className="absolute left-6 top-0 hidden h-full w-[2px] bg-[#06053a]/10 md:block" />

                        <div className="space-y-6">
                            {points.map((point, index) => {
                                const Icon = point.icon;

                                return (
                                    <motion.div
                                        key={point.title}
                                        initial={{ opacity: 0, x: 35 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: index * 0.08 }}
                                        className="group relative rounded-[30px] border border-[#06053a]/10 bg-white p-6 shadow-[0_18px_55px_rgba(6,5,58,0.08)] transition-all duration-500 hover:-translate-y-2 hover:border-[#06053a]/20 hover:bg-[#edeafb] hover:shadow-[0_28px_80px_rgba(6,5,58,0.16)] md:ml-16"
                                    >
                                        <div className="absolute -left-[74px] top-7 hidden h-14 w-14 items-center justify-center rounded-2xl bg-[#06053a] text-white shadow-xl md:flex">
                                            <Icon size={22} />
                                        </div>

                                        <div className="mb-4 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#06053a] text-white md:hidden">
                                                    <Icon size={21} />
                                                </div>

                                                <h3 className="text-2xl font-bold text-[#06053a]">
                                                    {point.title}
                                                </h3>
                                            </div>

                                            <span className="text-4xl font-bold text-[#06053a]/10">
                                                0{index + 1}
                                            </span>
                                        </div>

                                        <p className="leading-8 text-[#06053a]/70">
                                            {point.description}
                                        </p>

                                        <div className="mt-5 flex translate-y-1 items-center gap-2 text-sm font-bold text-[#06053a] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                            <CheckCircle2 size={16} />
                                            {point.hoverLine}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default WhyChoose;