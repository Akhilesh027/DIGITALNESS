import { Link, useParams } from "react-router-dom";
import { serviceImages, defaultServiceImages } from "../../data/serviceImages";
import {
    ArrowUpRight,
    ChevronRight,
    CheckCircle2,
    Sparkles,
    Target,
    TrendingUp,
    ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";

const serviceBlogs = {
    "seo-audits": {
        title: "SEO Audits",
        category: "Digital Marketing",
        group: "SEO Services",
        sections: [
            {
                title: "SEO Audit Services That Reveal Real Growth Opportunities",
                text: "A professional SEO audit helps your business understand why your website is not getting enough visibility, traffic or enquiries. At Digitalness, we check technical SEO, page speed, indexing, keyword usage, content quality, backlinks, mobile experience and conversion gaps. The result is a clear improvement plan that helps your website perform better on Google and attract the right customers.",
                image:
                    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
            },
            {
                title: "A Clear SEO Roadmap Built for Better Rankings",
                text: "We do not stop with a basic report. Our SEO audit gives your business a practical roadmap with priority fixes, content suggestions and technical improvements. Every recommendation is created to improve search visibility, user experience and lead quality, so your website becomes stronger, cleaner and more ready for long-term organic growth.",
                image:
                    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
            },
        ],
    },
};

const caBlockedSlugs = [
    "taxation-services",
    "audit-and-assurance-services",
    "accounting-and-financial-services",
    "business-and-corporate-services",
    "advisory-and-consultancy",
    "specialized-services",
];

const formatTitle = (slug = "") =>
    slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const createDefaultService = (slug) => {
    const title = formatTitle(slug);

    return {
        title,
        category: "Digitalness Services",
        group: "Business Growth",
        sections: [
            {
                title: `${title} Services Designed for Modern Business Growth`,
                text: `${title} helps your business look professional, reach the right audience and create better customer response. At Digitalness, we plan every service with a clear focus on visibility, trust, user experience and measurable business growth. Our approach keeps your brand simple to understand, easy to remember and strong enough to compete in the digital market.`,
                image:
                    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
            },
            {
                title: `Why Your Business Needs ${title}`,
                text: `Customers compare brands online before making a decision. A well-planned ${title} service helps your business communicate clearly, build confidence and generate stronger enquiries. From strategy to execution, Digitalness focuses on clean presentation, useful content and performance-focused delivery that supports long-term business success.`,
                image:
                    "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80",
            },
        ],
    };
};

const SubCategoryPage = () => {
    const { slug } = useParams();

    if (caBlockedSlugs.includes(slug)) {
        return (
            <>
                <Navbar />
                <main className="flex min-h-screen items-center justify-center bg-[#edeafb] px-4 pt-28 text-center text-[#06053a]">
                    <div className="rounded-[32px] bg-white p-10 shadow-[0_25px_80px_rgba(6,5,58,0.14)]">
                        <h1 className="text-4xl font-bold">Service Not Available</h1>
                        <p className="mt-4 text-lg font-medium text-[#4b4b5f]">
                            This service is currently not listed under Digitalness services.
                        </p>
                        <Link
                            to="/"
                            className="mt-8 inline-flex rounded-full bg-[#06053a] px-7 py-4 font-bold text-white"
                        >
                            Back to Home
                        </Link>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    const blog = serviceBlogs[slug] || createDefaultService(slug);
    const firstSection = blog.sections[0];
    const secondSection = blog.sections[1];
    const pageImages = serviceImages[slug] || defaultServiceImages;

    firstSection.image = pageImages.first;
    secondSection.image = pageImages.second;
    return (
        <>
            <Navbar />

            <main className="overflow-hidden bg-[#edeafb] text-[#06053a]">
                <section
                    className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-cover bg-center px-4 pt-28"
                    style={{ backgroundImage: `url(${bannerBg})` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-[#edeafb]/80 to-[#d9d2ff]/80" />
                    <div className="absolute -left-20 top-24 h-44 w-44 rounded-full bg-[#06053a] blur-[90px]" />
                    <div className="absolute -right-20 bottom-10 h-52 w-52 rounded-full bg-[#8f7cff] blur-[100px]" />

                    <div className="relative z-10 mx-auto max-w-7xl text-center">
                        <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-[#06053a] shadow-sm backdrop-blur">
                            <Sparkles size={16} />
                            {blog.group}
                        </span>

                        <motion.h1
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45 }}
                            className="text-4xl font-bold tracking-tight text-[#06053a] md:text-6xl"
                        >
                            {blog.title}
                        </motion.h1>

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-[#111827]">
                            <Link to="/" className="transition hover:text-[#06053a]">
                                Home
                            </Link>
                            <ChevronRight size={15} />
                            <span>{blog.category}</span>
                            <ChevronRight size={15} />
                            <span>{blog.title}</span>
                        </div>
                    </div>
                </section>

                <section className="relative px-4 py-20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,5,58,0.08),transparent_35%)]" />

                    <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, x: -24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45 }}
                        >
                            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">
                                <Target size={16} />
                                Strategy First
                            </span>

                            <h2 className="text-3xl font-bold leading-tight md:text-5xl">
                                {firstSection.title}
                            </h2>

                            <p className="mt-6 text-[18px] font-medium leading-9 text-[#4b4b5f]">
                                {firstSection.text}
                            </p>

                            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                                {["SEO Friendly", "Lead Focused", "User Friendly", "Growth Driven"].map(
                                    (item) => (
                                        <div
                                            key={item}
                                            className="flex items-center gap-3 rounded-2xl bg-white p-4 font-bold shadow-sm"
                                        >
                                            <CheckCircle2 size={19} className="text-[#06053a]" />
                                            {item}
                                        </div>
                                    )
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45 }}
                            className="relative"
                        >
                            <div className="absolute -inset-4 rounded-[38px] bg-[#06053a]/10 blur-2xl" />
                            <div className="relative rounded-[34px] bg-white p-4 shadow-[0_30px_90px_rgba(6,5,58,0.18)]">
                                <img
                                    src={firstSection.image}
                                    alt={firstSection.title}
                                    className="h-[430px] w-full rounded-[26px] object-cover"
                                />
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section className="relative bg-[#06053a] px-4 py-20 text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(143,124,255,0.35),transparent_38%)]" />

                    <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, x: -24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45 }}
                            className="order-2 lg:order-1"
                        >
                            <div className="rounded-[34px] border border-white/15 bg-white/10 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.22)] backdrop-blur">
                                <img
                                    src={secondSection.image}
                                    alt={secondSection.title}
                                    className="h-[430px] w-full rounded-[26px] object-cover"
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 24 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45 }}
                            className="order-1 lg:order-2"
                        >
                            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
                                <TrendingUp size={16} />
                                Performance Focused
                            </span>

                            <h2 className="text-3xl font-bold leading-tight md:text-5xl">
                                {secondSection.title}
                            </h2>

                            <p className="mt-6 text-[18px] font-medium leading-9 text-white/80">
                                {secondSection.text}
                            </p>

                            <div className="mt-8 rounded-[28px] border border-white/15 bg-white/10 p-6 backdrop-blur">
                                <div className="flex items-start gap-4">
                                    <ShieldCheck className="mt-1 shrink-0" size={28} />
                                    <div>
                                        <h3 className="text-xl font-bold">
                                            Built with Digitalness Quality
                                        </h3>
                                        <p className="mt-2 leading-7 text-white/75">
                                            Every service page is planned with clean design, useful
                                            content, better readability and a clear path for customer
                                            enquiries.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Link
                                to="/contact"
                                className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 font-bold text-[#06053a] transition hover:scale-105"
                            >
                                Get Started
                                <ArrowUpRight size={19} />
                            </Link>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
};

export default SubCategoryPage;