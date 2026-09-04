import { motion } from "framer-motion";
import { ShieldCheck, Lock, Eye, FileText, Mail, Phone, MapPin, Calendar } from "lucide-react";
import Container from "../../common/Container";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";

export default function PrivacyPolicyPage() {
    const sections = [
        {
            icon: Eye,
            title: "1. Information We Collect",
            content: (
                <div className="space-y-3 text-slate-600 leading-relaxed text-sm md:text-base">
                    <p>
                        At <strong>Digitalness Industries LLP</strong> ("Digitalness", "we", "our", or "us"), we value your privacy and trust. We collect personal and business information when you interact with our website, request quotes, use our free SEO analyzers, or engage our digital marketing and web solutions services.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Personal Identification Information:</strong> Name, email address, phone number, company name, and job title.</li>
                        <li><strong>Business & Project Details:</strong> Website URLs, domain names, marketing requirements, ad spend budgets, and target demographics.</li>
                        <li><strong>Technical & Analytical Data:</strong> IP address, browser type, device identifiers, pages viewed, time spent on pages, and referrer headers collected via cookies and analytics scripts.</li>
                    </ul>
                </div>
            ),
        },
        {
            icon: FileText,
            title: "2. How We Use Your Information",
            content: (
                <div className="space-y-3 text-slate-600 leading-relaxed text-sm md:text-base">
                    <p>We process your data for legitimate commercial interests and service delivery, including:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Providing and executing custom SEO, web development, PPC, and digital strategy proposals.</li>
                        <li>Delivering automated SEO audit reports and marketing recommendations requested by you.</li>
                        <li>Responding promptly to inquiries, consultation requests, and customer support tickets.</li>
                        <li>Improving website performance, user experience, and testing new digital tools.</li>
                        <li>Transmitting occasional industry newsletters, case studies, and promotional offers (from which you can opt-out at any time).</li>
                    </ul>
                </div>
            ),
        },
        {
            icon: Lock,
            title: "3. Data Protection & Security",
            content: (
                <div className="space-y-3 text-slate-600 leading-relaxed text-sm md:text-base">
                    <p>
                        We enforce strict administrative, technical, and physical safeguards designed to secure the personal data we maintain against accidental, unlawful, or unauthorized destruction, loss, alteration, access, disclosure, or misuse.
                    </p>
                    <p>
                        All sensitive form submissions and website interactions are transmitted through encrypted <strong>SSL/TLS protocols</strong>. Access to client project files and analytics dashboards is restricted strictly to authorized team members bound by confidentiality agreements.
                    </p>
                </div>
            ),
        },
        {
            icon: ShieldCheck,
            title: "4. Third-Party Sharing & Disclosure",
            content: (
                <div className="space-y-3 text-slate-600 leading-relaxed text-sm md:text-base">
                    <p>
                        <strong>We never sell, rent, or trade your personal or business data to third-party brokers.</strong> Information is only shared with trusted service providers who assist us in operating our platform, delivering email notifications, or processing analytics (such as Google Analytics, Meta Pixel, or cloud hosting infrastructure), and who agree to maintain strict confidentiality.
                    </p>
                    <p>
                        We may also disclose information where required by law, subpoena, or competent regulatory authorities in India.
                    </p>
                </div>
            ),
        },
        {
            icon: Calendar,
            title: "5. Cookies & Tracking Technologies",
            content: (
                <div className="space-y-3 text-slate-600 leading-relaxed text-sm md:text-base">
                    <p>
                        We employ cookies, pixels, and related tracking technologies to recognize returning visitors, assess the performance of marketing campaigns, and tailor content. You may configure your browser settings to refuse cookies; however, certain interactive features of our tools and forms may function with limitations.
                    </p>
                </div>
            ),
        },
        {
            icon: Mail,
            title: "6. Your Rights & Privacy Inquiries",
            content: (
                <div className="space-y-3 text-slate-600 leading-relaxed text-sm md:text-base">
                    <p>
                        You retain the right to request access to, correction of, or deletion of your personal data stored in our systems. To exercise any of these rights, or if you have questions regarding our privacy practices, please contact our data compliance team:
                    </p>
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm space-y-2">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-[#06053A]" />
                            <span>Email: <a href="mailto:contact@digitalness.co.in" className="text-[#06053A] font-semibold underline">contact@digitalness.co.in</a></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-[#06053A]" />
                            <span>Phone: <a href="tel:+918074944988" className="text-[#06053A] font-semibold">+91 80749 44988</a></span>
                        </div>
                        <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-[#06053A] shrink-0 mt-0.5" />
                            <span>Address: Digitalness Industries LLP, Uppal, Hyderabad, Telangana, India</span>
                        </div>
                    </div>
                </div>
            ),
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
                            <ShieldCheck className="w-4 h-4 text-purple-300" />
                            Legal & Transparency
                        </span>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                            Privacy Policy
                        </h1>
                        <p className="text-slate-300 text-sm sm:text-base md:text-lg">
                            Effective Date: January 1, 2026 • Last updated: September 2026
                        </p>
                        <p className="text-slate-300 text-sm max-w-2xl mx-auto">
                            Learn how Digitalness Industries LLP collects, safeguards, and respects your business and personal data.
                        </p>
                    </motion.div>
                </Container>
            </section>

            {/* Content Section */}
            <section className="py-12 md:py-20">
                <Container>
                    <div className="max-w-4xl mx-auto space-y-8">
                        {sections.map((section, idx) => {
                            const Icon = section.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                                    className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2.5 rounded-xl bg-purple-50 text-[#06053A]">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                                            {section.title}
                                        </h2>
                                    </div>
                                    {section.content}
                                </motion.div>
                            );
                        })}
                    </div>
                </Container>
            </section>

            <Footer />
        </div>
    );
}
