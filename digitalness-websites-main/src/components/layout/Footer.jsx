import React from "react";
import {
    Mail,
    MapPin,
    Phone,
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
                            <img
                                src={logo}
                                alt="Digitalness"
                                className="h-14 w-auto"
                            />

                            <p className="mt-6 max-w-sm text-sm leading-8 text-[#06053A]/70">
                                Helping businesses grow with creative marketing, powerful websites, and smart digital solutions.
                            </p>

                            <div className="mt-8 flex gap-3">
                                {[
                                    FaFacebookF,
                                    FaInstagram,
                                    FaLinkedinIn,
                                    FaYoutube,
                                ].map((Icon, index) => (
                                    <a
                                        key={index}
                                        href="#"
                                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#06053A] shadow-[0_10px_30px_rgba(6,5,58,0.10)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#06053A] hover:text-white"
                                    >
                                        <Icon size={16} />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-2xl font-bold">
                                Quick Links
                            </h3>

                            <ul className="mt-8 space-y-4 text-[#06053A]/70">
                                <li><a href="/">Home</a></li>
                                <li><a href="/about">About Us</a></li>
                                <li><a href="/services">Services</a></li>
                                <li><a href="/portfolio">Portfolio</a></li>
                                <li><a href="/blogs">Blogs</a></li>
                                <li><a href="/contact">Contact</a></li>
                            </ul>
                        </div>

                        {/* Opportunities */}
                        <div>
                            <h3 className="text-2xl font-bold">
                                Opportunities
                            </h3>

                            <ul className="mt-8 space-y-4 text-[#06053A]/70">
                                <li>Careers</li>
                                <li>Certifications</li>
                                <li>Partner With Us</li>
                                <li>Sitemap</li>
                                <li>Free SEO Tools</li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="text-2xl font-bold">
                                Get In Touch
                            </h3>

                            <div className="mt-8 space-y-6">

                                <div className="flex gap-4">
                                    <Mail size={20} />
                                    <span className="text-[#06053A]/70">
                                        sales@digitalness.co.in
                                    </span>
                                </div>

                                <div className="flex gap-4">
                                    <FaWhatsapp size={20} />
                                    <span className="text-[#06053A]/70">
                                        +91 99893 29642
                                    </span>
                                </div>

                                <div className="flex gap-4">
                                    <Phone size={20} />
                                    <span className="text-[#06053A]/70">
                                        +91 404 5369584
                                    </span>
                                </div>

                                <div className="flex items-start gap-4">
                                    <MapPin
                                        size={22}
                                        className="mt-1 shrink-0 text-[#06053A]"
                                    />

                                    <span className="leading-8 text-[#06053A]/70">
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

                            <p className="text-[#06053A]/60">
                                © 2026 Digitalness Industries LLP.
                                All Rights Reserved.
                            </p>

                            <div className="flex gap-6 text-[#06053A]/60">
                                <a href="/privacy-policy">
                                    Privacy Policy
                                </a>

                                <a href="/terms">
                                    Terms & Conditions
                                </a>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </footer>
    );
};

export default Footer;