import React, { useEffect, useState } from "react";
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Lightbulb,
    Megaphone,
    PenTool,
    Rocket,
    Search,
    Target,
    TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
const processSteps = [
    {
        title: "Business Discovery",
        label: "Step 01",
        icon: Search,
        image:
            "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
        desc: "We understand your business, audience, competitors, current online presence and goals before planning any marketing activity.",
        points: ["Business audit", "Audience research", "Competitor study"],
    },
    {
        title: "Growth Strategy",
        label: "Step 02",
        icon: Target,
        image:
            "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80",
        desc: "We build a clear roadmap for Meta Ads, Google Ads, SEO, social media, creative direction and lead generation.",
        points: ["Campaign roadmap", "Budget planning", "Lead strategy"],
    },
    {
        title: "Creative Planning",
        label: "Step 03",
        icon: PenTool,
        image:
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        desc: "We prepare content, ad creatives, captions and landing page ideas that connect with your customers naturally.",
        points: ["Ad creatives", "Content ideas", "Landing direction"],
    },
    {
        title: "Campaign Launch",
        label: "Step 04",
        icon: Rocket,
        image:
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
        desc: "We launch campaigns across Meta, Google, GMB, SEO and organic platforms with proper tracking and monitoring.",
        points: ["Meta Ads", "Google Ads", "Tracking setup"],
    },
    {
        title: "Optimize & Scale",
        label: "Step 05",
        icon: TrendingUp,
        image:
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
        desc: "We review reports, leads, reach, cost per result and conversions to improve performance and scale growth.",
        points: ["Weekly reports", "Lead quality review", "Growth scaling"],
    },
];

const Process = () => {
    const [active, setActive] = useState(0);

    const nextSlide = () => {
        setActive((prev) => (prev + 1) % processSteps.length);
    };

    const prevSlide = () => {
        setActive((prev) => (prev === 0 ? processSteps.length - 1 : prev - 1));
    };

    useEffect(() => {
        const timer = setInterval(nextSlide, 4200);
        return () => clearInterval(timer);
    }, []);

    const activeStep = processSteps[active];
    const ActiveIcon = activeStep.icon;

    return (
        <section className="relative overflow-hidden bg-[#EDEAFB] py-20 text-[#06053A] sm:py-24 lg:py-28">
            <div className="absolute left-[-180px] top-[-120px] h-[420px] w-[420px] rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-[-160px] right-[-160px] h-[440px] w-[440px] rounded-full bg-white/80 blur-3xl" />
            <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#06053A]/5 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-6 flex justify-center"
                    >
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-[#06053A]/10 bg-white px-5 py-2.5 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#06053A]/40 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#06053A]"></span>
                            </span>

                            <span className="text-base font-bold uppercase tracking-[0.18em] text-[#06053A]">
                                Our Process
                            </span>
                        </div>
                    </motion.div>

                    <h2 className="text-2xl font-bold tracking-tight text-[#06053A] sm:text-3xl md:text-4xl">
                        From First Call To
                        <span className="relative mx-3 inline-block">
                            Real Growth
                            <span className="absolute -bottom-2 left-0 h-3 w-full rounded-full bg-white/90 -z-10" />
                        </span>
                    </h2>

                    <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
                        A clean, practical and result-focused process designed to help your
                        business attract better leads, improve visibility and grow with
                        confidence.
                    </p>
                </div>

                <div className="mt-14 grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="relative rounded-[40px] border border-white bg-white/75 p-4 shadow-[0_30px_100px_rgba(6,5,58,0.14)] backdrop-blur-xl">
                        <div className="relative overflow-hidden rounded-[32px]">
                            <img
                                src={activeStep.image}
                                alt={activeStep.title}
                                className="h-[360px] w-full object-cover transition-all duration-700 sm:h-[440px]"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-[#06053A]/85 via-[#06053A]/20 to-transparent" />

                            <div className="absolute left-6 top-6 rounded-full bg-white px-5 py-2 text-sm font-extrabold text-[#06053A] shadow-lg">
                                {activeStep.label}
                            </div>

                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#06053A] shadow-xl">
                                    <ActiveIcon size={30} />
                                </div>

                                <h3 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                                    {activeStep.title}
                                </h3>

                                <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-white/80">
                                    {activeStep.desc}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={prevSlide}
                            className="absolute left-0 top-1/2 z-20 flex h-12 w-12 -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#06053A] shadow-xl transition hover:scale-110"
                            aria-label="Previous"
                        >
                            <ChevronLeft size={22} />
                        </button>

                        <button
                            onClick={nextSlide}
                            className="absolute right-0 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 translate-x-4 items-center justify-center rounded-full bg-white text-[#06053A] shadow-xl transition hover:scale-110"
                            aria-label="Next"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {processSteps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = active === index;

                            return (
                                <button
                                    key={step.title}
                                    onClick={() => setActive(index)}
                                    className={`group w-full rounded-[28px] border p-5 text-left transition-all duration-500 ${isActive
                                        ? "border-[#06053A] bg-[#06053A] text-white shadow-[0_25px_70px_rgba(6,5,58,0.25)]"
                                        : "border-white bg-white/80 text-[#06053A] shadow-[0_18px_50px_rgba(6,5,58,0.08)] hover:-translate-y-1 hover:border-[#06053A]/20 hover:bg-white"
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition ${isActive
                                                ? "bg-white text-[#06053A]"
                                                : "bg-[#EDEAFB] text-[#06053A] group-hover:bg-[#06053A] group-hover:text-white"
                                                }`}
                                        >
                                            <Icon size={25} />
                                        </div>

                                        <div className="flex-1">
                                            <div className="mb-1 flex items-center justify-between gap-4">
                                                <span
                                                    className={`text-[11px] font-bold tracking-[0.22em] ${isActive ? "text-white/70" : "text-[#06053A]/50"
                                                        }`}
                                                >
                                                    {step.label}
                                                </span>

                                                <ArrowRight
                                                    size={18}
                                                    className={`transition ${isActive
                                                        ? "translate-x-1 text-white"
                                                        : "text-[#06053A]/50 group-hover:translate-x-1"
                                                        }`}
                                                />
                                            </div>

                                            <h4 className="text-lg font-bold leading-tight sm:text-xl">{step.title}</h4>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {step.points.map((point) => (
                                                    <span
                                                        key={point}
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${isActive
                                                            ? "bg-white/10 text-white"
                                                            : "bg-[#EDEAFB] text-[#06053A]"
                                                            }`}
                                                    >
                                                        <CheckCircle2 size={13} />
                                                        {point}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Process;