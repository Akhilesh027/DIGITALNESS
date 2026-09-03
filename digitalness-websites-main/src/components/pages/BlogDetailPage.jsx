import { Link, useParams } from "react-router-dom";
import crmDevelopment from "../../assets/banners/office-ivr-solutions/crm-integrations.png";
import mobileAppDevelopment from "../../assets/banners/mobile-development/android-development.png";
import performanceMarketing from "../../assets/banners/smm-services/meta-ads.png";
import photographyVideo from "../../assets/banners/photography/corporate-photography.png";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";
const slugify = (text) =>
    text
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");
const blogContent = {
    "digital-marketing": {
        title: "Digital Marketing Services for Business Growth",
        category: "Digital Marketing",
        date: "June 2026",
        readTime: "5 Min Read",
        image:
            "https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=1600&q=80",
        content: [
            "Digital marketing helps businesses reach the right audience through online platforms like Google, Meta, Instagram, YouTube and search engines.",
            "At Digitalness, we focus on practical strategies that bring visibility, enquiries and measurable growth. Every campaign is planned around your audience, business goals and budget.",
            "Our digital marketing approach includes campaign planning, creative direction, lead generation, conversion tracking and monthly performance improvement.",
        ],
    },
    "seo-services": {
        title: "SEO Services That Improve Your Google Visibility",
        category: "SEO",
        date: "June 2026",
        readTime: "6 Min Read",
        image:
            "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?auto=format&fit=crop&w=1600&q=80",
        content: [
            "SEO helps your business appear when customers search for your products or services on Google.",
            "A strong SEO strategy includes keyword research, on-page optimization, technical improvements, local SEO and content planning.",
            "Digitalness builds SEO strategies that are practical, long-term and focused on better visibility, traffic and enquiries.",
        ],
    },
    "website-development": {
        title: "Website Development That Converts Visitors Into Leads",
        category: "Web Development",
        date: "June 2026",
        readTime: "5 Min Read",
        image:
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80",
        content: [
            "Your website is often the first impression of your business. A professional website builds trust and helps visitors understand your services clearly.",
            "At Digitalness, we create fast, responsive, SEO-friendly websites that support marketing and lead generation.",
            "Our website development includes clean UI, mobile responsiveness, performance optimization and conversion-focused page structure.",
        ],
    },
    "branding-and-creatives": {
        title: "Branding & Creative Design for Strong Business Identity",
        category: "Branding",
        date: "June 2026",
        readTime: "4 Min Read",
        image:
            "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1600&q=80",
        content: [
            "Branding helps customers remember your business. Good design creates trust, recognition and emotional connection.",
            "Digitalness creates logos, ad creatives, social media posters, brand guidelines and marketing designs that match your business personality.",
            "Our creative approach focuses on clarity, premium presentation and designs that work well across digital platforms.",
        ],
    },
    "crm-development": {
        title: "CRM Development Solutions for Better Business Management",
        category: "CRM Development",
        date: "June 2026",
        readTime: "6 Min Read",
        banner: crmDevelopment,
        content: [
            "Managing leads, customers, employees, and daily operations becomes challenging as a business grows. A custom CRM system helps streamline every process in one centralized platform.",
            "Digitalness develops powerful CRM solutions tailored to your business workflow. From lead tracking and employee management to project monitoring and customer communication, everything can be managed efficiently.",
            "Our CRM systems improve productivity, automate repetitive tasks, provide real-time insights, and help businesses deliver better customer experiences while maintaining complete operational control.",
            "Whether you need a sales CRM, service CRM, recruitment CRM, educational CRM, or a complete enterprise management system, our team creates scalable and user-friendly solutions built for long-term growth."
        ]
    },

    "mobile-app-development": {
        title: "Mobile App Development Services for Modern Businesses",
        category: "Mobile App Development",
        date: "June 2026",
        readTime: "5 Min Read",
        banner: mobileAppDevelopment,
        content: [
            "Mobile applications have become an essential part of modern business growth. A well-designed app improves customer engagement, accessibility, and brand loyalty.",
            "At Digitalness, we develop fast, secure, and user-friendly Android and iOS applications tailored to your business objectives.",
            "Our development process focuses on seamless user experience, attractive design, high performance, and scalable architecture that supports future business expansion.",
            "Whether you need an eCommerce app, service booking platform, CRM app, educational app, healthcare solution, or custom business application, we deliver mobile experiences that help businesses connect with customers anytime, anywhere."
        ]
    },

    "performance-marketing": {
        title: "Performance Marketing Services That Deliver Measurable Results",
        category: "Performance Marketing",
        date: "June 2026",
        readTime: "5 Min Read",
        banner: performanceMarketing,
        content: [
            "Performance marketing focuses on achieving measurable business outcomes such as leads, sales, website traffic, app installs, and customer acquisition.",
            "Digitalness creates data-driven marketing campaigns across Meta Ads, Google Ads, YouTube Ads, and other digital platforms to maximize return on investment.",
            "Every campaign is optimized using audience research, conversion tracking, creative testing, and performance analysis to ensure efficient budget utilization.",
            "Our goal is simple — generate more qualified leads, lower acquisition costs, improve conversion rates, and help businesses scale through strategic performance marketing."
        ]
    },

    "photography-and-video": {
        title: "Professional Photography & Video Production Services",
        category: "Photography & Video",
        date: "June 2026",
        readTime: "4 Min Read",
        banner: photographyVideo,
        content: [
            "Visual content plays a critical role in building brand trust and capturing customer attention. Professional photography and video production help businesses showcase their products, services, and brand story effectively.",
            "Digitalness provides commercial photography, promotional videos, corporate shoots, social media reels, product photography, event coverage, and creative visual production services.",
            "Our team combines creativity, storytelling, and modern production techniques to create content that engages audiences and strengthens brand identity.",
            "From product showcases and promotional campaigns to corporate branding and social media content creation, we help businesses communicate their message through impactful visuals."
        ]
    },
};

const BlogDetailPage = () => {
    const { slug } = useParams();
    const blog = blogContent[slug];

    if (!blog) {
        return (
            <>
                <Navbar />
                <section className="bg-[#edeafb] px-4 py-40 text-center text-[#06053A]">
                    <h1 className="text-4xl font-bold">Blog Not Found</h1>
                    <Link to="/" className="mt-6 inline-flex font-bold">
                        Back to Home
                    </Link>
                </section>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="bg-[#edeafb] pt-32 text-[#06053A]">
                <section className="mx-auto max-w-6xl px-4 pb-20">
                    <Link
                        to="/"
                        className="mb-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold shadow-sm"
                    >
                        <ArrowLeft size={17} />
                        Back to Home
                    </Link>

                    <div className="overflow-hidden rounded-[34px] bg-white shadow-[0_30px_90px_rgba(6,5,58,0.12)]">
                        <img
                            src={blog.image}
                            alt={blog.title}
                            className="h-[280px] w-full object-cover md:h-[460px]"
                        />

                        <div className="p-6 md:p-10">
                            <span className="rounded-full bg-[#edeafb] px-4 py-2 text-sm font-bold">
                                {blog.category}
                            </span>

                            <h1 className="mt-6 max-w-4xl text-3xl font-bold leading-tight md:text-5xl">
                                {blog.title}
                            </h1>

                            <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold text-[#06053A]/65">
                                <span className="flex items-center gap-2">
                                    <CalendarDays size={17} />
                                    {blog.date}
                                </span>

                                <span className="flex items-center gap-2">
                                    <Clock size={17} />
                                    {blog.readTime}
                                </span>
                            </div>

                            <div className="mt-8 space-y-6 text-lg leading-9 text-black/70">
                                {blog.content.map((para) => (
                                    <p key={para}>{para}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
};

export default BlogDetailPage;