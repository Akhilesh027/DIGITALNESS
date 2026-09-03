import { motion } from "framer-motion";
import { Award, Layers, ThumbsUp, Calendar } from "lucide-react";
import Container from "../common/Container";

const statsData = [
    { number: "150+", label: "Digital Marketing Clients", icon: Award },
    { number: "100+", label: "Websites, CRMs & Apps", icon: Layers },
    { number: "100%", label: "Client Satisfaction Focus", icon: ThumbsUp },
    { number: "2021", label: "Founded in Hyderabad", icon: Calendar },
];

const Stats = () => {
    // Animation configuration for the container staggering effect
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.12 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <section className="relative bg-gradient-to-b from-zinc-100 to-slate-50 py-20 overflow-hidden">
            {/* Subtle background abstract highlights to draw eyes downwards */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-[80%] rounded-full bg-[#06035a]/5 blur-[120px] pointer-events-none" />

            <Container>
                <motion.div
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                >
                    {statsData.map((stat, idx) => {
                        const Icon = stat.icon;

                        return (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                whileHover={{
                                    y: -8,
                                    boxShadow: "0 20px 40px -15px rgba(6, 3, 90, 0.08)",
                                }}
                                className="group relative rounded-3xl border border-slate-200/80 bg-white p-8 text-center transition-all duration-300 overflow-hidden"
                            >
                                {/* Top colored accent bar visible on hover */}
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#06035a] scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100" />

                                {/* Dynamic Icon Module */}
                                <div className="mx-auto mb-5 inline-flex p-3.5 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 transition-all duration-300 group-hover:bg-[#06035a]/5 group-hover:text-[#06035a] group-hover:border-[#06035a]/10 group-hover:rotate-3">
                                    <Icon size={24} strokeWidth={2} />
                                </div>

                                {/* Numbers Display */}
                                <h3 className="text-4xl font-extrabold tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-[#06035a] lg:text-5xl">
                                    {stat.number}
                                </h3>

                                {/* Descriptive Label */}
                                <p className="mt-3 text-sm font-semibold text-slate-500 leading-relaxed max-w-[200px] mx-auto transition-colors duration-300 group-hover:text-slate-700">
                                    {stat.label}
                                </p>

                                {/* Decorative Background Micro-Pattern */}
                                <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10" />
                            </motion.div>
                        );
                    })}
                </motion.div>
            </Container>
        </section>
    );
};

export default Stats;