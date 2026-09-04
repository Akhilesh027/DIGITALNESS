import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Menu, X, ChevronDown, ArrowUpRight, Search, Megaphone, ThumbsUp, MapPin,
    Monitor, Code2, Smartphone, Wrench, Palette, Target, FileImage, PenTool,
    PhoneCall, Printer, Camera, MessageCircle, Radio, PlugZap,
    HelpCircle, Users, DollarSign, BookOpen, Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Container from "../common/Container";
import logo from "../../assets/logo/logo.png";

const slugify = (text) =>
    text.toLowerCase().replace(/&/g, "and").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

const getServicePath = (link) => `/services/${slugify(link)}`;

const menuData = [
    {
        label: "Digital Marketing",
        columns: [
            { title: "SEO Services", icon: Search, links: ["SEO Audits", "On-page SEO", "Off-page SEO", "Technical SEO", "Backlinks", "Local SEO"] },
            { title: "SEM Services", icon: Megaphone, links: ["Google Ads", "Microsoft Ads", "Amazon Ads", "Display Ads"] },
            { title: "SMM Services", icon: ThumbsUp, links: ["Meta Ads", "LinkedIn Ads", "Snapchat Ads", "YouTube Ads"] },
            { title: "Local SEO Services", icon: MapPin, links: ["Google Local Business", "Account Setup", "Verification Process", "Business Optimization"] },
        ],
        ctaTitle: "Increase in organic traffic",
        ctaText: "Maximize your online presence with our expert strategies.",
        ctaButton: "Get Started",
    },
    {
        label: "Web Design & Development",
        columns: [
            { title: "Web Design", icon: Monitor, links: ["Responsive Design", "UI/UX Design", "Prototyping", "Design Systems"] },
            { title: "Web Development", icon: Code2, links: ["Front-end Development", "Back-end Development", "E-Commerce Solutions", "Custom Management Systems", "API Development"] },
            { title: "Mobile Development", icon: Smartphone, links: ["iOS Development", "Android Development", "Cross-Platform Solutions", "Mobile UX/UI Design"] },
            { title: "Maintenance & Support", icon: Wrench, links: ["Ongoing Maintenance", "Performance Optimization", "Security Updates", "Technical Support"] },
        ],
        ctaTitle: "Boost Your Online Presence",
        ctaText: "Custom web solutions tailored to your business needs",
        ctaButton: "Get Started",
    },
    {
        label: "Branding",
        columns: [
            { title: "Brand Identity", icon: Palette, links: ["Logo Design", "Color Palette", "Typography", "Brand Guidelines"] },
            { title: "Brand Strategy", icon: Target, links: ["Market Research", "Brand Positioning", "Brand Messaging", "Competitive Analysis"] },
            { title: "Marketing Materials", icon: FileImage, links: ["Business Cards", "Brochures & Flyers", "Social Media Graphics"] },
            { title: "Graphic Design", icon: PenTool, links: ["Custom Illustrations", "Packaging Design", "Signage", "Print Design"] },
        ],
        ctaTitle: "Elevate Your Brand",
        ctaText: "Comprehensive branding solutions to make your mark.",
        ctaButton: "Get Started",
    },
    {
        label: "Other Services",
        large: true,
        columns: [
            {
                title: "Office IVR Solutions",
                icon: PhoneCall,
                links: [
                    "Office Contact",
                    "Cloud Contact Center",
                    "Toll-free & Virtual Number",
                    "IVR Setup & Configuration",
                    "Custom IVR Menu Design",
                    "Call Routing & Forwarding",
                    "Voicemail Services",
                    "Integration with CRM Systems",
                ],
            },
            {
                title: "Print Marketing Services",
                icon: Printer,
                links: [
                    "Display Stands",
                    "Brochure’s Stands",
                    "Lighting Display’s",
                    "Backdrop Stands / Glowsign Box",
                    "Aluminum Signage Profiles",
                    "Letter Box / QR Code stand",
                ],
            },
            {
                title: "Photography & Videography",
                icon: Camera,
                links: [
                    "Corporate Photography",
                    "Event Photography",
                    "Product Photography",
                    "Drone Videography",
                    "Promotional Videos",
                ],
            },
            {
                title: "WhatsApp Marketing",
                icon: MessageCircle,
                links: [
                    "WhatsApp API",
                    "WhatsApp Campaigns",
                    "Multi-user Chat",
                    "CTWA",
                    "After Call Automation",
                ],
            },
            {
                title: "Traditional Marketing Services",
                icon: Radio,
                links: [
                    "FM Radio Ads",
                    "TV Ads",
                    "Auto Ads",
                    "Bus Stand Ads",
                    "Hoarding Ads",
                    "Metro Ads",
                    "Pamphlet Ads",
                    "Newspaper Ads",
                ],
            },
            {
                title: "Integrations Solutions",
                icon: PlugZap,
                links: [
                    "Call Masking",
                    "Truecaller for Business",
                    "Bulk SMS API",
                    "CRM",
                    "Custom CRMs",
                ],
            },
            {
                title: "Support & Maintenance",
                icon: Wrench,
                links: [
                    "Ongoing UX Support",
                    "AI Model Updates",
                    "Performance Monitoring",
                    "User Feedback Integration",
                ],
            },
        ],
        ctaTitle: "Explore Our Diverse Services",
        ctaText: "Complete digital, communication, print and marketing solutions for your business.",
        ctaButton: "Get Started",
        ctaLink: "/contact",
    },
    {
        label: "More",
        columns: [
            { title: "Who We Are", icon: HelpCircle, links: ["Our Approach", "About Us", "Careers", "Partner with Us", "Certifications", "Contact Info"] },
            { title: "Community Impact", icon: Users, links: ["Company Values", "Facebook", "Instagram", "LinkedIn", "YouTube"] },
            { title: "Pricing Guides", icon: DollarSign, links: ["Website Cost", "PPC Cost", "Google Ads Cost", "Social Media Pricing"] },
            { title: "Content Library", icon: BookOpen, links: ["Our Blog", "SEO Analyzer", "Free Keyword Suggestion Tool", "Fix Your Funnel"] },
        ],
        ctaTitle: "#1 Best Place to Work in Hyderabad..!",
        ctaText: "Join our team",
        ctaButton: "View Careers",
        ctaLink: "/careers",
    },
];

const specialRoutes = {
    "Our Approach": "/our-approach",
    "About Us": "/about",
    Careers: "/careers",
    "Partner with Us": "/partner-with-us",
    Certifications: "/certifications",
    "Contact Info": "/contact",

    "Company Values": "/company-values",
    Facebook: "https://www.facebook.com/photo/?fbid=151040567671098&set=a.129287479846407&__tn__=%3C4",
    Instagram: "https://www.instagram.com/digitalness.co.in?igsi=ZGJnYWd6Zm93NDN1",
    LinkedIn: "https://www.linkedin.com/company/digitalnesscoin/",
    YouTube: "https://www.youtube.com/@digitalnesscoin",

    "Website Cost": "/website-cost",
    "PPC Cost": "/ppc-cost",
    "Google Ads Cost": "/google-ads-cost",
    "Social Media Pricing": "/social-media-pricing",

    "Our Blog": "/blogs",
    "SEO Analyzer": "/seo-analyzer",
    "Free Keyword Suggestion Tool": "/free-keyword-tool",
    "Fix Your Funnel": "/fix-your-funnel",
};

const getMenuPath = (link) => {
    if (specialRoutes[link]) {
        return specialRoutes[link];
    }
    return getServicePath(link);
};

const Navbar = () => {
    const [activeMenu, setActiveMenu] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const activeData = activeMenu !== null ? menuData[activeMenu] : null;

    return (
        <header className="fixed left-0 top-0 z-50 w-full px-2 pt-3 sm:px-4">
            <Container>
                <div onMouseLeave={() => setActiveMenu(null)} className="relative mx-auto w-full max-w-[1180px]">
                    <nav className="relative flex min-h-[72px] items-center justify-between rounded-[18px] border border-white/60 bg-white/90 px-4 shadow-[0_18px_60px_rgba(6,5,58,0.18)] backdrop-blur-2xl lg:px-5">
                        <Link to="/" className="relative z-10 flex shrink-0 items-center">
                            <img src={logo} alt="Digitalness" className="h-10 w-auto object-contain md:h-12" />
                        </Link>

                        <div className="relative z-10 hidden items-center gap-5 xl:flex">
                            {menuData.map((menu, index) => (
                                <button
                                    key={menu.label}
                                    onMouseEnter={() => setActiveMenu(index)}
                                    className="flex items-center gap-1.5 whitespace-nowrap text-[14px] font-medium text-[#111827] transition hover:text-[#06053a]"
                                >
                                    {menu.label}
                                    <ChevronDown size={16} className={`transition ${activeMenu === index ? "rotate-180" : ""}`} />
                                </button>
                            ))}
                        </div>

                        <Link
                            to="/contact"
                            className="relative z-10 hidden shrink-0 items-center gap-2 rounded-full bg-[#06053a] py-1.5 pl-4 pr-1.5 text-[14px] font-semibold text-white shadow-[0_10px_25px_rgba(6,5,58,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(6,5,58,0.30)] xl:flex"
                        >
                            Get Started
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#06053a]">
                                <ArrowUpRight size={16} />
                            </span>
                        </Link>

                        <button onClick={() => setMobileOpen(true)} className="relative z-10 rounded-full bg-[#06053a] p-3 text-white xl:hidden">
                            <Menu />
                        </button>
                    </nav>

                    <AnimatePresence>
                        {activeMenu !== null && activeData && (
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.22, ease: "easeOut" }}
                                className={`absolute left-1/2 top-[72px] hidden max-h-[82vh] -translate-x-1/2 overflow-y-auto xl:block ${activeData.large ? "w-[920px]" : "w-[720px]"}`}
                            >
                                <div className="overflow-hidden rounded-b-[14px] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.22)]">
                                    <div className="grid grid-cols-4 gap-x-7 gap-y-9 px-6 py-6">
                                        {activeData.columns.map((column) => {
                                            const Icon = column.icon;

                                            return (
                                                <div key={column.title} className="min-w-0">
                                                    <h3 className="mb-4 flex items-start gap-2 text-[15px] font-bold leading-tight text-[#06053a]">
                                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00a86b] text-[#06053a]">
                                                            <Icon size={14} strokeWidth={3} />
                                                        </span>
                                                        {column.title}
                                                    </h3>

                                                    <div className="space-y-1.5">
                                                        {column.links.map((link) => {
                                                            const path = getMenuPath(link);
                                                            const isExternal = path.startsWith("http");

                                                            if (isExternal) {
                                                                return (
                                                                    <a
                                                                        key={link}
                                                                        href={path}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={() => setActiveMenu(null)}
                                                                        className="group flex min-h-[40px] items-center justify-between gap-3 rounded-xl px-2 py-2 text-[14px] font-medium leading-snug text-[#1f2937] transition-all duration-200 hover:bg-[#edeafb] hover:pl-3 hover:text-[#06053a]"
                                                                    >
                                                                        <span className="flex-1">{link}</span>
                                                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#06053a] opacity-0 transition group-hover:opacity-100">
                                                                            <ArrowUpRight size={14} strokeWidth={2.5} />
                                                                        </span>
                                                                    </a>
                                                                );
                                                            }

                                                            return (
                                                                <Link
                                                                    key={link}
                                                                    to={path}
                                                                    onClick={() => setActiveMenu(null)}
                                                                    className="group flex min-h-[40px] items-center justify-between gap-3 rounded-xl px-2 py-2 text-[14px] font-medium leading-snug text-[#1f2937] transition-all duration-200 hover:bg-[#edeafb] hover:pl-3 hover:text-[#06053a]"
                                                                >
                                                                    <span className="flex-1">{link}</span>
                                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#06053a] opacity-0 transition group-hover:opacity-100">
                                                                        <ArrowUpRight size={14} strokeWidth={2.5} />
                                                                    </span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {activeData.ctaTitle && (
                                        <div className="px-6 pb-6">
                                            <div className="flex items-center justify-between rounded-lg bg-[#120b84] px-6 py-5 text-white">
                                                <div>
                                                    <h4 className="text-[17px] font-bold">{activeData.ctaTitle}</h4>
                                                    <p className="text-sm font-medium">{activeData.ctaText}</p>
                                                </div>
                                                <Link
                                                    to={activeData.ctaLink || "/contact"}
                                                    onClick={() => setActiveMenu(null)}
                                                    className="flex items-center gap-3 rounded-full border border-white/40 py-2 pl-5 pr-2 font-bold hover:bg-white/10 transition-colors"
                                                >
                                                    {activeData.ctaButton}
                                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#06053a]">
                                                        <ArrowUpRight size={18} />
                                                    </span>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Container>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="fixed inset-y-0 right-0 z-[999] w-[86%] max-w-[330px] overflow-y-auto bg-white px-7 py-6 shadow-[-20px_0_70px_rgba(6,5,58,0.22)] xl:hidden"
                    >
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute right-5 top-5 text-[#06053a]"
                        >
                            <X size={26} />
                        </button>

                        <Link to="/" onClick={() => setMobileOpen(false)} className="mb-7 mt-8 flex justify-center">
                            <img src={logo} alt="Digitalness" className="h-12 w-auto object-contain" />
                        </Link>

                        <div className="overflow-hidden rounded-xl bg-white shadow-[0_12px_35px_rgba(6,5,58,0.10)]">
                            {menuData.map((menu) => (
                                <details key={menu.label} className="group border-b border-[#06053a]/10 last:border-b-0">
                                    <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[16px] font-bold text-[#111827]">
                                        {menu.label}
                                        <ChevronDown size={19} className="transition group-open:rotate-180" />
                                    </summary>

                                    <div className="px-5 pb-4">
                                        {menu.columns.map((column) => (
                                             <div key={column.title} className="mb-4">
                                                <h4 className="mb-2 text-sm font-bold text-[#06053a]">{column.title}</h4>
                                                <div className="space-y-1">
                                                    {column.links.map((link) => {
                                                        const path = getMenuPath(link);
                                                        const isExternal = path.startsWith("http");

                                                        if (isExternal) {
                                                            return (
                                                                <a
                                                                    key={link}
                                                                    href={path}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={() => setMobileOpen(false)}
                                                                    className="block rounded-lg px-3 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#edeafb] hover:text-[#06053a]"
                                                                >
                                                                    {link}
                                                                </a>
                                                            );
                                                        }

                                                        return (
                                                            <Link
                                                                key={link}
                                                                to={path}
                                                                onClick={() => setMobileOpen(false)}
                                                                className="block rounded-lg px-3 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#edeafb] hover:text-[#06053a]"
                                                            >
                                                                {link}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-col gap-3">
                            <Link
                                to="/contact"
                                onClick={() => setMobileOpen(false)}
                                className="inline-flex items-center justify-between rounded-xl bg-[#06053a] px-6 py-3 text-base font-bold text-white shadow-md hover:bg-[#120b84] transition-colors"
                            >
                                Get Started
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#06053a]">
                                    <ArrowUpRight size={18} />
                                </span>
                            </Link>

                            <Link
                                to="/careers"
                                onClick={() => setMobileOpen(false)}
                                className="inline-flex items-center justify-between rounded-xl border-2 border-[#06053a] px-6 py-3 text-base font-bold text-[#06053a] hover:bg-[#06053a]/5 transition-colors"
                            >
                                View Careers
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#06053a] text-white">
                                    <ArrowUpRight size={18} />
                                </span>
                            </Link>
                        </div>

                        <div className="mt-8 space-y-6 text-[#06053a]">
                            <div>
                                <h3 className="mb-4 text-lg font-medium text-black">Contact Info</h3>

                                <div className="flex items-start gap-4">
                                    <PhoneCall size={20} className="mt-1 shrink-0" />
                                    <p className="text-[16px] leading-7 text-black">
                                        +91 99893 29642 <br />
                                        +91 404 5369584
                                    </p>
                                </div>

                                <div className="mt-5 flex items-center gap-4">
                                    <Mail size={20} className="shrink-0" />
                                    <p className="text-[16px] text-black">sales@digitalness.co.in</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-4 text-lg font-medium text-black">Our Location</h3>

                                <div className="flex items-start gap-4">
                                    <MapPin size={20} className="mt-1 shrink-0" />
                                    <p className="text-[16px] leading-7 text-black">
                                        11/1, Meenakshi Residency, Main Rd., Prashanthinagar,
                                        Prashanth Nagar, Uppal, Hyderabad, Telangana 500039
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Navbar;
