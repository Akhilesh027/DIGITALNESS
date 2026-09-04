import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Network,
    Home,
    Compass,
    Wrench,
    BookOpen,
    Shield,
    ArrowRight,
    Search,
    ExternalLink
} from "lucide-react";
import Container from "../../common/Container";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";

export default function SitemapPage() {
    const sitemapGroups = [
        {
            title: "Core Pages",
            icon: Home,
            links: [
                { name: "Home", path: "/" },
                { name: "About Us", path: "/about" },
                { name: "Contact Us", path: "/contact" },
                { name: "Careers & Internships", path: "/careers" },
                { name: "Certifications & Accreditation", path: "/certifications" },
                { name: "Partner With Us", path: "/partner-with-us" },
            ],
        },
        {
            title: "Marketing Services",
            icon: Compass,
            links: [
                { name: "Search Engine Optimization (SEO)", path: "/services/seo" },
                { name: "Social Media Marketing (SMM)", path: "/services/social-media-marketing" },
                { name: "Google & Meta Paid Ads (PPC)", path: "/services/performance-marketing" },
                { name: "Content Marketing & Strategy", path: "/services/content-marketing" },
                { name: "Local SEO & Business Listings", path: "/services/local-seo" },
                { name: "Conversion Rate Optimization (CRO)", path: "/services/cro" },
            ],
        },
        {
            title: "Web & Tech Solutions",
            icon: Wrench,
            links: [
                { name: "Custom Website Design", path: "/services/web-design" },
                { name: "E-Commerce Development", path: "/services/ecommerce" },
                { name: "WordPress & CMS Solutions", path: "/services/wordpress" },
                { name: "Landing Page Optimization", path: "/services/landing-pages" },
                { name: "Speed & Core Web Vitals", path: "/services/speed-optimization" },
            ],
        },
        {
            title: "Free Tools & Resources",
            icon: BookOpen,
            links: [
                { name: "Free SEO Tools Suite", path: "/free-seo-tools" },
                { name: "Website SEO Analyzer", path: "/seo-analyzer" },
                { name: "Free Keyword Tool", path: "/free-keyword-tool" },
                { name: "Fix Your Funnel Audit", path: "/fix-your-funnel" },
                { name: "Digital Marketing Blog", path: "/blogs" },
            ],
        },
        {
            title: "Legal & Transparency",
            icon: Shield,
            links: [
                { name: "Privacy Policy", path: "/privacy-policy" },
                { name: "Terms and Conditions", path: "/terms" },
                { name: "Sitemap (Current Page)", path: "/sitemap" },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Navbar />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-[#06053A] to-[#120f54] text-white pt-32 pb-16 md:pt-40 md:pb-24">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.2),transparent_50%)] pointer-events-none" />
                <Container>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-3xl mx-auto text-center space-y-4"
                    >
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                            <Network className="w-4 h-4 text-purple-300" />
                            Site Structure
                        </span>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                            Website Sitemap
                        </h1>
                        <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
                            Easily discover and navigate every section, service, tool, and legal document across the Digitalness digital platform.
                        </p>
                    </motion.div>
                </Container>
            </section>

            {/* Sitemap Grid */}
            <section className="py-12 md:py-20">
                <Container>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sitemapGroups.map((group, idx) => {
                            const Icon = group.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                                    className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                                            <div className="p-2.5 rounded-xl bg-purple-50 text-[#06053A]">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <h2 className="text-xl font-bold text-slate-900">
                                                {group.title}
                                            </h2>
                                        </div>
                                        <ul className="space-y-3">
                                            {group.links.map((link, lIdx) => (
                                                <li key={lIdx}>
                                                    <Link
                                                        to={link.path}
                                                        className="group flex items-center justify-between text-slate-600 hover:text-[#06053A] text-sm font-medium transition-colors py-1"
                                                    >
                                                        <span className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:bg-[#06053A]" />
                                                            {link.name}
                                                        </span>
                                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 text-[#06053A] transition-all" />
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Search / Assistance CTA */}
                    <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 text-center space-y-4">
                        <h3 className="text-xl font-bold text-slate-900">Looking for something specific?</h3>
                        <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
                            Our digital experts are ready to guide you. Request a consultation or discuss a custom marketing strategy today.
                        </p>
                        <div className="pt-2">
                            <Link
                                to="/contact"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#06053A] text-white font-medium hover:bg-[#120f54] shadow-md hover:shadow-lg transition-all"
                            >
                                Contact Our Team
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
