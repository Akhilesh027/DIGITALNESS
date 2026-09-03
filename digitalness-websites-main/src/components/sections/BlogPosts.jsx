import { motion } from "framer-motion";
import {
    ArrowUpRight,
    CalendarDays,
    Clock3,
    Megaphone,
    MonitorSmartphone,
    SearchCheck,
} from "lucide-react";
import Container from "../common/Container";

const blogs = [
    {
        id: 1,
        image:
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",
        title: "Why a Professional Website Builds Better Business Trust",
        slug: "professional-website-builds-business-trust",
        category: "Website",
        description:
            "A professional website helps customers understand your business, trust your services and take action. Discover how responsive design, clear content and fast performance can turn visitors into genuine enquiries.",
        publishedAt: "01 June 2026",
        readTime: "5 Min Read",
        icon: MonitorSmartphone,
    },
    {
        id: 2,
        image:
            "https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=1200&q=85",
        title: "Digital Marketing Strategies That Bring Quality Leads",
        slug: "digital-marketing-strategies-for-quality-leads",
        category: "Digital Marketing",
        description:
            "Digital marketing is more than posting content. Learn how Meta Ads, Google Ads, audience targeting and campaign optimization can help businesses attract better leads and improve conversions.",
        publishedAt: "01 June 2026",
        readTime: "6 Min Read",
        icon: Megaphone,
    },
    {
        id: 3,
        image:
            "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?auto=format&fit=crop&w=1200&q=85",
        title: "How SEO Helps Local Businesses Grow on Google",
        slug: "how-seo-helps-local-businesses-grow",
        category: "SEO",
        description:
            "SEO helps your business appear when customers are actively searching. Understand how local SEO, useful content and website optimization can improve visibility and generate consistent organic enquiries.",
        publishedAt: "01 June 2026",
        readTime: "5 Min Read",
        icon: SearchCheck,
    },
];

const BlogPosts = () => {
    return (
        <section
            id="blogs"
            className="relative overflow-hidden bg-[#F1EFFF] py-20 text-[#06053A] sm:py-24 lg:py-28"
        >
            <div className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-white/80 blur-3xl" />
            <div className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-[#DCD6FF]/60 blur-3xl" />

            <Container>
                <div className="relative z-10 mx-auto mb-12 max-w-4xl text-center sm:mb-14">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-5 inline-flex items-center gap-3 rounded-full border border-[#06053A]/10 bg-white px-5 py-2.5 shadow-[0_10px_30px_rgba(6,5,58,0.08)]"
                    >
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#06053A]/35" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#06053A]" />
                        </span>

                        <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#06053A]">
                            Digitalness Blogs
                        </span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 22 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.08 }}
                        className="text-4xl font-bold leading-tight text-[#06053A] sm:text-5xl lg:text-[56px]"
                    >
                        Insights that help businesses grow smarter online
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.14 }}
                        className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg"
                    >
                        Explore practical articles about websites, digital marketing and
                        SEO, created to help businesses improve visibility, build trust and
                        generate better enquiries.
                    </motion.p>
                </div>

                <div className="relative z-10 mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {blogs.map((blog, index) => {
                        const Icon = blog.icon;

                        return (
                            <motion.article
                                key={blog.id}
                                initial={{ opacity: 0, y: 32 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{
                                    duration: 0.55,
                                    delay: index * 0.09,
                                }}
                                className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-[#06053A]/12 bg-white shadow-[0_16px_45px_rgba(6,5,58,0.08)] transition-all duration-500 hover:-translate-y-2 hover:border-[#06053A]/30 hover:shadow-[0_28px_75px_rgba(6,5,58,0.16)]"
                            >
                                <div className="relative h-[230px] overflow-hidden sm:h-[220px] lg:h-[240px]">
                                    <img
                                        src={blog.image}
                                        alt={blog.title}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-[#06053A]/70 via-[#06053A]/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90" />

                                    <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/60 bg-white/95 text-[#06053A] shadow-lg backdrop-blur-sm">
                                        <Icon size={21} />
                                    </div>

                                    <span className="absolute bottom-4 left-4 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#06053A] shadow-lg">
                                        {blog.category}
                                    </span>
                                </div>

                                <div className="flex flex-1 flex-col p-5 sm:p-6">
                                    <h3 className="line-clamp-2 text-xl font-bold leading-snug text-[#06053A] sm:text-2xl">
                                        {blog.title}
                                    </h3>

                                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600 sm:text-[15px]">
                                        {blog.description}
                                    </p>

                                    <div className="mt-5 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#06053A]/10 bg-[#F8F7FF] px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                                            <CalendarDays size={14} className="text-[#06053A]" />
                                            {blog.publishedAt}
                                        </span>

                                        <span className="inline-flex items-center gap-1.5 rounded-md border border-[#06053A]/10 bg-[#F8F7FF] px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                                            <Clock3 size={14} className="text-[#06053A]" />
                                            {blog.readTime}
                                        </span>
                                    </div>

                                    <div className="mt-auto pt-6">
                                        <a
                                            href={`/blogs/${blog.slug}`}
                                            aria-label={`Read ${blog.title}`}
                                            className="group/button flex w-full items-center justify-center gap-3 rounded-xl bg-[#06053A] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(6,5,58,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#19005C]"
                                        >
                                            Read More

                                            <ArrowUpRight
                                                size={17}
                                                className="transition-transform duration-300 group-hover/button:translate-x-1 group-hover/button:-translate-y-1"
                                            />
                                        </a>
                                    </div>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative z-10 mt-12 flex justify-center"
                >
                    <a
                        href="/blogs"
                        className="group inline-flex items-center gap-3 rounded-full border border-[#06053A]/15 bg-white px-7 py-4 text-sm font-bold text-[#06053A] shadow-[0_14px_40px_rgba(6,5,58,0.1)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#06053A] hover:text-white"
                    >
                        Explore All Blogs

                        <ArrowUpRight
                            size={18}
                            className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                        />
                    </a>
                </motion.div>
            </Container>
        </section>
    );
};

export default BlogPosts;