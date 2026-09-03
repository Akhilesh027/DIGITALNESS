import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../layout/Navbar";
import Footer from "../../layout/Footer";

const MorePageLayout = ({
    badge,
    title,
    subtitle,
    children,
    ctaText = "Talk to Digitalness",
}) => {
    return (
        <>
            <Navbar />

            <main className="overflow-hidden bg-[#edeafb] text-[#06053a]">
                <section className="relative px-4 pb-20 pt-36">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#edeafb_40%,#d8d1ff_100%)]" />
                    <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-[#06053a]/20 blur-[110px]" />
                    <div className="absolute -right-20 bottom-8 h-80 w-80 rounded-full bg-[#7c5cff]/25 blur-[120px]" />

                    <div className="relative z-10 mx-auto max-w-7xl text-center">
                        <span className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-bold shadow">
                            {badge}
                        </span>

                        <motion.h1
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45 }}
                            className="mx-auto mt-6 max-w-5xl text-4xl font-bold leading-tight md:text-6xl"
                        >
                            {title}
                        </motion.h1>

                        <p className="mx-auto mt-6 max-w-3xl text-lg font-medium leading-8 text-[#3f3b68]">
                            {subtitle}
                        </p>

                        <div className="mt-6 flex justify-center gap-2 text-sm font-bold">
                            <Link to="/">Home</Link>
                            <ChevronRight size={15} />
                            <span>More</span>
                            <ChevronRight size={15} />
                            <span>{title}</span>
                        </div>
                    </div>
                </section>

                {children}

                <section className="px-4 py-20">
                    <div className="mx-auto max-w-7xl rounded-[36px] bg-[#06053a] p-10 text-white md:p-14">
                        <h2 className="text-3xl font-bold md:text-5xl">
                            Ready to grow with Digitalness?
                        </h2>
                        <p className="mt-5 max-w-3xl text-lg leading-8 text-white/75">
                            We help businesses grow with websites, SEO, paid ads, branding,
                            CRM solutions and performance-focused digital strategies.
                        </p>

                        <Link
                            to="/contact"
                            className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-bold text-[#06053a]"
                        >
                            {ctaText}
                            <ArrowUpRight size={19} />
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
};

export default MorePageLayout;