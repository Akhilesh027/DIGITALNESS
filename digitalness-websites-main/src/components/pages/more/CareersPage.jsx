import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    BriefcaseBusiness,
    GraduationCap,
    Megaphone,
    Building2,
    MapPin,
    Clock3,
    ArrowUpRight,
    CheckCircle2,
} from "lucide-react";
import Container from "../../common/Container";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";

const openings = [
    {
        title: "Digital Marketing Intern",
        icon: GraduationCap,
        type: "Internship",
        experience: "",
        description:
            "Perfect for students and fresh graduates looking to gain hands-on experience in SEO, social media marketing, Google Ads, Meta Ads, content creation, and campaign management.",
        skills: [
            "Social Media Marketing",
            "Basic SEO Knowledge",
            "Content Creation",
            "Communication Skills",
        ],
    },
    {
        title: "Digital Marketing Executive",
        icon: Megaphone,
        type: "Full Time",
        experience: "1-3 Years",
        description:
            "Work on real client projects including SEO, Google Ads, Meta Ads, lead generation campaigns, reporting, and digital growth strategies.",
        skills: [
            "SEO & SEM",
            "Meta Ads",
            "Google Ads",
            "Campaign Reporting",
        ],
    },
    {
        title: "Office Admin",
        icon: Building2,
        type: "Full Time",
        experience: "0-2 Years",
        description:
            "Support daily office operations, client coordination, documentation, scheduling, and administrative activities while ensuring smooth workflow management.",
        skills: [
            "Administration",
            "MS Office",
            "Communication",
            "Organization Skills",
        ],
    },
];

const Careers = () => {
    return (
        <>
            <Navbar />
            <section className="relative overflow-hidden bg-[#edeafb] py-24">
                <div className="absolute left-[-150px] top-20 h-80 w-80 rounded-full bg-[#06053a]/10 blur-3xl" />
                <div className="absolute bottom-[-150px] right-[-150px] h-96 w-96 rounded-full bg-purple-400/10 blur-3xl" />

                <Container>
                    {/* Header */}

                    <div className="mx-auto max-w-4xl text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-6 flex justify-center"
                        >
                            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#06053A]/10 bg-white px-5 py-2.5 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#06053A]/40 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#06053A]"></span>
                                </span>

                                <span className="text-base font-bold uppercase tracking-[0.18em] text-[#06053A]">
                                    Careers At Digitalness
                                </span>
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 22 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-2xl font-bold leading-tight text-[#06053A] md:text-4xl"
                        >
                            We're Hiring Passionate People
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 22 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-700"
                        >
                            Join Digitalness and work with a growing team that helps businesses
                            succeed through digital marketing, branding, websites, CRM systems,
                            automation, and creative solutions.
                        </motion.p>
                    </div>

                    {/* Hero Image */}

                    <motion.div
                        initial={{ opacity: 0, y: 35 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mx-auto mt-14 max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-[0_25px_70px_rgba(6,5,58,0.12)]"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80"
                            alt="Digitalness Careers"
                            className="h-[260px] w-full object-cover md:h-[480px]"
                        />
                    </motion.div>

                    {/* About Career */}

                    <div className="mx-auto mt-16 max-w-5xl">
                        <h2 className="mb-5 text-3xl font-bold text-[#06053A]">
                            Build Your Career With Digitalness
                        </h2>

                        <p className="text-lg leading-9 text-slate-700">
                            At Digitalness, we believe great work happens when talented people
                            collaborate, learn, and grow together. Whether you're starting your
                            career or looking for your next opportunity, you'll work on
                            meaningful projects, gain practical industry experience, and become
                            part of a supportive team focused on innovation and results.
                        </p>
                    </div>

                    {/* Open Positions */}

                    <div className="mt-20">
                        <h2 className="mb-10 text-center text-4xl font-bold text-[#06053A]">
                            Current Open Positions
                        </h2>

                        <div className="grid gap-8 lg:grid-cols-3">
                            {openings.map((job, index) => {
                                const Icon = job.icon;

                                return (
                                    <motion.div
                                        key={job.title}
                                        initial={{ opacity: 0, y: 35 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.08 }}
                                        className="group rounded-[28px] bg-white p-7 shadow-[0_18px_55px_rgba(6,5,58,0.08)] transition-all duration-500 hover:-translate-y-3 hover:bg-[#06053A]"
                                    >
                                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#06053A] text-white transition group-hover:bg-white group-hover:text-[#06053A]">
                                            <Icon size={28} />
                                        </div>

                                        <h3 className="text-2xl font-bold text-[#06053A] transition group-hover:text-white">
                                            {job.title}
                                        </h3>

                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <span className="rounded-full bg-[#edeafb] px-4 py-2 text-sm font-bold text-[#06053A]">
                                                {job.type}
                                            </span>

                                            {job.experience && (
                                                <span className="rounded-full bg-[#edeafb] px-4 py-2 text-sm font-bold text-[#06053A]">
                                                    {job.experience}
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-5 leading-8 text-slate-700 transition group-hover:text-white/80">
                                            {job.description}
                                        </p>

                                        <div className="mt-6 space-y-3">
                                            {job.skills.map((skill) => (
                                                <div
                                                    key={skill}
                                                    className="flex items-center gap-2 text-sm font-semibold text-slate-700 transition group-hover:text-white"
                                                >
                                                    <CheckCircle2 size={16} />
                                                    {skill}
                                                </div>
                                            ))}
                                        </div>

                                        <Link
                                            to="/apply-now"
                                            className="
                                        mt-6 inline-flex items-center gap-2
                                        rounded-full
                                        bg-[#06053A]
                                        px-5    
                                        py-2.5
                                        text-sm
                                        font-bold
                                        text-white
                                        transition-all
                                        duration-300
                                        hover:scale-105
                                        hover:shadow-[0_12px_30px_rgba(6,5,58,0.22)]
                                        group-hover:bg-white
                                        group-hover:text-[#06053A]
                                    "
                                        >
                                            Apply Now

                                            <span
                                                className="
                                            flex h-7 w-7 items-center justify-center
                                            rounded-full
                                            bg-white
                                            text-[#06053A]
                                            transition-all duration-300
                                            group-hover:bg-[#06053A]
                                            group-hover:text-white
                                        "
                                            >
                                                <ArrowUpRight size={14} />
                                            </span>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer CTA */}

                    <motion.div
                        initial={{ opacity: 0, y: 35 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-20 rounded-[32px] bg-[#06053A] p-10 text-center text-white"
                    >
                        <BriefcaseBusiness
                            size={50}
                            className="mx-auto mb-5 text-white"
                        />

                        <h3 className="text-3xl font-bold">
                            Ready To Join Digitalness?
                        </h3>

                        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/75">
                            Send your resume and portfolio to our HR team and take the next step
                            in your career journey.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
                            <div className="flex items-center gap-2">
                                <MapPin size={18} />
                                Hyderabad, Telangana
                            </div>

                            <div className="flex items-center gap-2">
                                <Clock3 size={18} />
                                Full-Time & Internship Opportunities
                            </div>
                        </div>

                        <Link
                            to="/apply-now"
                            className="
                        mt-6 inline-flex rounded-full
                        bg-white
                        px-6
                        py-3
                        text-sm 
                        font-bold
                        text-[#06053A]
                        shadow-sm
                        transition-all
                        duration-300
                        hover:scale-105
                        hover:shadow-[0_12px_30px_rgba(6,5,58,0.15)]
                     "
                        >
                            Apply Today
                        </Link>
                    </motion.div>
                </Container>
            </section>
            <Footer />
        </>
    );
};

export default Careers;
