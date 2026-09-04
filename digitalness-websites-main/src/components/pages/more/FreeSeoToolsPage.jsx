import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
    Search,
    BarChart3,
    KeyRound,
    Filter,
    ArrowRight,
    Zap,
    ShieldCheck,
    CheckCircle2,
    Gauge,
    Sparkles,
} from "lucide-react";
import Container from "../../common/Container";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";

export default function FreeSeoToolsPage() {
    const [domainInput, setDomainInput] = useState("");
    const navigate = useNavigate();

    const handleQuickScan = (e) => {
        e.preventDefault();
        if (!domainInput.trim()) return;
        const cleanUrl = domainInput.trim().replace(/^https?:\/\//, "");
        navigate(`/seo-analyzer?url=${encodeURIComponent(cleanUrl)}`);
    };

    const tools = [
        {
            title: "Website SEO Analyzer",
            description:
                "Deep-crawl any web page to identify technical SEO bottlenecks, missing meta tags, broken schema, heading hierarchies, and mobile responsiveness issues.",
            icon: Gauge,
            badge: "Most Popular",
            badgeColor: "bg-purple-100 text-purple-800",
            link: "/seo-analyzer",
            highlights: [
                "Full Technical SEO Audit",
                "Meta Titles & Descriptions Check",
                "Page Speed & Vitals Score",
                "Actionable Recommendations",
            ],
        },
        {
            title: "Free Keyword Explorer",
            description:
                "Discover high-intent, low-competition keywords for your industry. Uncover search volume trends, CPC estimates, and ranking opportunities to grow organic traffic.",
            icon: KeyRound,
            badge: "Keyword Research",
            badgeColor: "bg-blue-100 text-blue-800",
            link: "/free-keyword-tool",
            highlights: [
                "Long-Tail Keyword Generation",
                "Search Volume Trends",
                "Competitor Keyword Gaps",
                "Content Topic Suggestions",
            ],
        },
        {
            title: "Fix Your Funnel Audit",
            description:
                "Pinpoint leaks in your customer acquisition journey. Discover why visitors bounce without converting, and get data-backed steps to skyrocket landing page conversions.",
            icon: Filter,
            badge: "Conversion Rate (CRO)",
            badgeColor: "bg-emerald-100 text-emerald-800",
            link: "/fix-your-funnel",
            highlights: [
                "Conversion Funnel Breakdown",
                "Form Drop-Off Analysis",
                "Call-to-Action Placement Review",
                "Speed vs Conversion Correlation",
            ],
        },
    ];

    const benefits = [
        {
            icon: Zap,
            title: "Instant Results in Seconds",
            desc: "No waiting days for consultant PDFs. Our automated diagnostic engines evaluate live data immediately.",
        },
        {
            icon: ShieldCheck,
            title: "100% Free & No Credit Card",
            desc: "Access essential SEO diagnostic metrics with zero hidden charges or trial locks.",
        },
        {
            icon: BarChart3,
            title: "Prioritized Action Steps",
            desc: "Clear, step-by-step guidance on what to fix first to see real organic rank increases.",
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Navbar />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-[#06053A] to-[#120f54] text-white pt-32 pb-20 md:pt-40 md:pb-28">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.25),transparent_50%)] pointer-events-none" />
                <Container>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-3xl mx-auto text-center space-y-6"
                    >
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm border border-purple-400/20">
                            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                            Free Marketing Toolkit
                        </span>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                            Free SEO & Growth Tools
                        </h1>
                        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                            Audit technical errors, unearth profitable keywords, and optimize your conversion funnel with our suite of free online utilities.
                        </p>

                        {/* Quick Website Audit Bar */}
                        <form
                            onSubmit={handleQuickScan}
                            className="pt-4 max-w-xl mx-auto flex flex-col sm:flex-row gap-2"
                        >
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={domainInput}
                                    onChange={(e) => setDomainInput(e.target.value)}
                                    placeholder="Enter your website URL (e.g., example.com)"
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm text-sm sm:text-base"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer"
                            >
                                Free Scan
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                </Container>
            </section>

            {/* Tools Grid */}
            <section className="py-16 md:py-24">
                <Container>
                    <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
                            Select a Free Optimization Tool
                        </h2>
                        <p className="text-slate-600 text-sm sm:text-base">
                            Engineered for founders, marketers, and business owners looking to grow traffic.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {tools.map((tool, idx) => {
                            const Icon = tool.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                                    className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 rounded-xl bg-purple-50 text-[#06053A] group-hover:scale-105 transition-transform">
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tool.badgeColor}`}>
                                                {tool.badge}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#06053A] transition-colors">
                                            {tool.title}
                                        </h3>
                                        <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                            {tool.description}
                                        </p>

                                        <div className="space-y-2 mb-6 pt-4 border-t border-slate-100">
                                            {tool.highlights.map((h, hIdx) => (
                                                <div key={hIdx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    <span>{h}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Link
                                        to={tool.link}
                                        className="w-full py-3 px-4 rounded-xl bg-[#06053A] hover:bg-[#151368] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm group-hover:shadow transition-all"
                                    >
                                        Launch Tool
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Features Strip */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 p-8 rounded-2xl bg-white border border-slate-200">
                        {benefits.map((b, idx) => {
                            const Icon = b.icon;
                            return (
                                <div key={idx} className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-purple-50 text-[#06053A] shrink-0">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-1">{b.title}</h4>
                                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{b.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Custom Strategy CTA */}
                    <div className="mt-16 p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-[#06053A] to-[#120f54] text-white text-center space-y-4">
                        <h3 className="text-2xl sm:text-3xl font-bold">Need a Custom Done-For-You SEO Strategy?</h3>
                        <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
                            Our team of SEO specialists, content creators, and performance marketers can handle your search rankings end-to-end.
                        </p>
                        <div className="pt-2">
                            <Link
                                to="/contact"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                            >
                                Schedule Free Strategy Call
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </Container>
            </section>

            <Footer />
        </div>
    );
}
