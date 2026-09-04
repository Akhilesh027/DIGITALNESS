import { motion } from "framer-motion";
import { FileCheck, ShieldAlert, Scale, CreditCard, Sparkles, AlertCircle, Mail, Phone, MapPin } from "lucide-react";
import Container from "../../common/Container";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";

export default function TermsConditionsPage() {
    const sections = [
        {
            icon: FileCheck,
            title: "1. Acceptance of Terms",
            content: (
                <div className="space-y-3 text-slate-600 leading-relaxed text-sm md:text-base">
                    <p>
                        Welcome to <strong>Digitalness Industries LLP</strong> ("Digitalness", "we", "us", or "our"). By accessing or browsing our website (<a href="https://digitalness.co.in" className="text-[#06053A] underline font-medium">digitalness.co.in</a>), using our free online diagnostic tools, or entering into a master services agreement with us, you agree to comply with and be bound by these Terms and Conditions.
                    </p>
                    <p>
                        If you do not agree with any portion of these terms, you must discontinue the use of our services and web properties immediately.
                    </p>
                </div>
            ),
        },
        {
            icon: Sparkles,
            title: "2. Scope of Services",
            content: (
                <div className="space-y-3 text-slate-600 leading-relaxed text-sm md:text-base">
                    <p>
                        Digitalness provides full-funnel digital marketing and technology solutions, including Search Engine Optimization (SEO), Pay-Per-Click Advertising (PPC/Google Ads/Meta Ads), Web Development & UI/UX Design, Social Media Management, Content Marketing, and Growth Consulting.
                    </p>
                    <p>
                        Each tailored engagement is executed according to a designated Statement of Work (SOW) or digital proposal outlining deliverables, timelines, milestones, and fees.
                    </p>
                </div>
            ),
        },
        {
            icon: CreditCard,
            title: "3. Payments, Invoicing & Retainers",
            content: (
                <div className="space-y-3 text-slate-600 leading-relaxed text-sm md:text-base">
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Milestone Payments:</strong> Web development and design projects require an initial deposit prior to kickoff, with subsequent milestones due upon milestone approvals.</li>
                        <li><strong>Monthly Retainers:</strong> Ongoing services such as SEO, social media management, and ad management are billed in advance on a recurring monthly billing cycle.</li>
                        <li><strong>Ad Spend Budgets:</strong> Advertising budgets (payable to Google, Meta, LinkedIn, etc.) are paid directly by the client to the respective ad networks unless explicitly agreed in writing.</li>
                        <li><strong>Taxes:</strong> All quoted rates are subject to applicable GST and local statutory taxes as per the Government of India regulations.</li>
                    </ul>
                </div>
            ),
        },
        {
            icon: Scale,
            title: "4. Intellectual Property & Ownership",
            content: (
                <div className="space-y-3 text-slate-600 leading-relaxed text-sm md:text-base">
                    <p>
                        Upon receipt of full payment for completed milestones, all custom client deliverables, brand assets, and website code created explicitly for the client transfer to the client's ownership.
                    </p>
                    <p>
                        Digitalness retains proprietary rights to our proprietary frameworks, reusable libraries, internal diagnostic scripts, templates, and general methodologies. We reserve the right to display non-confidential project highlights in our portfolio and marketing case studies unless a formal Non-Disclosure Agreement (NDA) states otherwise.
                    </p>
                </div>
            ),
        },
        {
            icon: ShieldAlert,
            title: "5. Search Engine & Platform Disclaimers",
            content: (
                <div className="space-y-3 text-slate-600 leading-relaxed text-sm md:text-base">
                    <p>
                        Search engine algorithms (such as Google, Bing) and third-party advertising platforms (Meta, LinkedIn, Google Ads) operate autonomously and update their policies frequently. While Digitalness applies industry-leading white-hat techniques and performance best practices, we cannot guarantee specific permanent rank positions or specific ad CPC rates, as third-party platform algorithms and competitor activities fluctuate.
                    </p>
                </div>
            ),
        },
        {
            icon: AlertCircle,
            title: "6. Limitation of Liability & Governing Law",
            content: (
                <div className="space-y-3 text-slate-600 leading-relaxed text-sm md:text-base">
                    <p>
                        To the maximum extent permitted by applicable law, Digitalness Industries LLP shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from downtime, algorithm shifts, or lost revenues.
                    </p>
                    <p>
                        These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any legal disputes arising out of or connected with these terms shall fall under the exclusive jurisdiction of the competent courts in <strong>Hyderabad, Telangana, India</strong>.
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
                            <span>Location: Digitalness Industries LLP, Uppal, Hyderabad, Telangana, India</span>
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
                            <Scale className="w-4 h-4 text-purple-300" />
                            Terms of Service
                        </span>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                            Terms & Conditions
                        </h1>
                        <p className="text-slate-300 text-sm sm:text-base md:text-lg">
                            Effective Date: January 1, 2026 • Last updated: September 2026
                        </p>
                        <p className="text-slate-300 text-sm max-w-2xl mx-auto">
                            Please review these terms and conditions governing the use of Digitalness services, websites, and technical deliverables.
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
