import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
    Mail,
    MapPin,
    Phone,
    ArrowUp,
} from "lucide-react";

import {
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
    FaWhatsapp,
    FaYoutube,
} from "react-icons/fa";

import logo from "../../assets/logo/logo.png";

const Footer = () => {
    const [tooltip, setTooltip] = useState("");

    const socialLinks = [
        {
            name: "Facebook",
            icon: FaFacebookF,
            url: "https://www.facebook.com/photo/?fbid=151040567671098&set=a.129287479846407&__tn__=%3C4",
        },
        {
            name: "Instagram",
            icon: FaInstagram,
            url: "https://www.instagram.com/digitalness.co.in?igsi=ZGJnYWd6Zm93NDN1",
        },
        {
            name: "LinkedIn",
            icon: FaLinkedinIn,
            url: "https://www.linkedin.com/company/digitalnesscoin/",
        },
        {
            name: "YouTube",
            icon: FaYoutube,
            url: "#",
            isComingSoon: true,
        },
    ];

    const handleSocialClick = (e, item) => {
        if (item.isComingSoon) {
            e.preventDefault();
            setTooltip("Digitalness YouTube channel launching soon! Stay tuned.");
            setTimeout(() => setTooltip(""), 3500);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <footer className="relative overflow-hidden bg-[#edeafb] text-[#06053A]">
            {/* Background Glow */}
            <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#EDEAFB]/5 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                <div className="py-20">

                    <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">

                        {/* Company */}
                        <div>
                            <Link to="/">
                                <img
                                    src={logo}
                                    alt="Digitalness"
                                    className="h-14 w-auto"
                                />
                            </Link>

                            <p className="mt-6 max-w-sm text-sm leading-8 text-[#06053A]/70">
                                Helping businesses grow with creative marketing, powerful websites, and smart digital solutions.
                            </p>

                            <div className="relative mt-8">
                                <div className="flex gap-3">
                                    {socialLinks.map((item, index) => {
                                        const Icon = item.icon;
                                        return (
                                            <a
                                                key={index}
                                                href={item.url}
                                                target={item.isComingSoon ? "_self" : "_blank"}
                                                rel={item.isComingSoon ? undefined : "noopener noreferrer"}
                                                onClick={(e) => handleSocialClick(e, item)}
                                                aria-label={`Follow us on ${item.name}`}
                                                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#06053A] shadow-[0_10px_30px_rgba(6,5,58,0.10)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#06053A] hover:text-white"
                                            >
                                                <Icon size={16} />
                                            </a>
                                        );
                                    })}
                                </div>
                                {tooltip && (
                                    <div className="absolute left-0 top-14 z-20 rounded-lg bg-[#06053A] px-3.5 py-1.5 text-xs text-white shadow-lg animate-fade-in whitespace-nowrap">
                                        {tooltip}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-2xl font-bold">
                                Quick Links
                            </h3>

                            <ul className="mt-8 space-y-4 text-[#06053A]/70 font-medium text-sm">
                                <li><Link to="/" className="hover:text-[#06053A] transition-colors">Home</Link></li>
                                <li><Link to="/about" className="hover:text-[#06053A] transition-colors">About Us</Link></li>
                                <li><Link to="/services" className="hover:text-[#06053A] transition-colors">Services</Link></li>
                                <li><Link to="/portfolio" className="hover:text-[#06053A] transition-colors">Portfolio</Link></li>
                                <li><Link to="/blogs" className="hover:text-[#06053A] transition-colors">Blogs</Link></li>
                                <li><Link to="/contact" className="hover:text-[#06053A] transition-colors">Contact</Link></li>
                            </ul>
                        </div>

                        {/* Opportunities */}
                        <div>
                            <h3 className="text-2xl font-bold">
                                Opportunities
                            </h3>

                            <ul className="mt-8 space-y-4 text-[#06053A]/70 font-medium text-sm">
                                <li><Link to="/careers" className="hover:text-[#06053A] transition-colors">Careers</Link></li>
                                <li><Link to="/certifications" className="hover:text-[#06053A] transition-colors">Certifications</Link></li>
                                <li><Link to="/partner-with-us" className="hover:text-[#06053A] transition-colors">Partner With Us</Link></li>
                                <li><Link to="/sitemap" className="hover:text-[#06053A] transition-colors">Sitemap</Link></li>
                                <li><Link to="/free-seo-tools" className="hover:text-[#06053A] transition-colors">Free SEO Tools</Link></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="text-2xl font-bold">
                                Get In Touch
                            </h3>

                            <div className="mt-8 space-y-6">

                                <div className="flex gap-4">
                                    <Mail size={20} className="shrink-0" />
                                    <a href="mailto:sales@digitalness.co.in" className="text-[#06053A]/70 hover:text-[#06053A] transition-colors">
                                        sales@digitalness.co.in
                                    </a>
                                </div>

                                <div className="flex gap-4">
                                    <FaWhatsapp size={20} className="shrink-0" />
                                    <a
                                        href="https://wa.me/919989329642"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#06053A]/70 hover:text-[#06053A] transition-colors"
                                    >
                                        +91 99893 29642
                                    </a>
                                </div>

                                <div className="flex gap-4">
                                    <Phone size={20} className="shrink-0" />
                                    <a href="tel:+914045369584" className="text-[#06053A]/70 hover:text-[#06053A] transition-colors">
                                        +91 404 5369584
                                    </a>
                                </div>

                                <div className="flex items-start gap-4">
                                    <MapPin
                                        size={22}
                                        className="mt-1 shrink-0 text-[#06053A]"
                                    />

                                    <span className="leading-7 text-sm text-[#06053A]/70">
                                        11/1 Main Road,
                                        <br />
                                        Near Indira Gandhi Statue,
                                        <br />
                                        Prashanth Nagar,
                                        Uppal,
                                        Hyderabad,
                                        Telangana 500039
                                    </span>
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* Bottom */}
                    <div className="mt-16 border-t border-[#06053A]/10 pt-8">
                        <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row">

                            <p className="text-[#06053A]/60 text-sm">
                                © 2026 Digitalness Industries LLP. All Rights Reserved.
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#06053A]/70">
                                <Link to="/privacy-policy" className="hover:text-[#06053A] transition-colors">
                                    Privacy Policy
                                </Link>

                                <Link to="/terms" className="hover:text-[#06053A] transition-colors">
                                    Terms & Conditions
                                </Link>

                                <button
                                    onClick={scrollToTop}
                                    className="flex items-center gap-1.5 rounded-full border border-[#06053A]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#06053A] hover:bg-[#06053A] hover:text-white transition-all cursor-pointer"
                                >
                                    <span>Back to top</span>
                                    <ArrowUp size={12} />
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </footer>
    );
};

export default Footer;