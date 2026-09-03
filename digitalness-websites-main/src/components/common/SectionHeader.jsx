import { motion } from "framer-motion";

const SectionHeader = ({ badge, title, description, dark = true }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mx-auto mb-14 max-w-3xl text-center"
        >
            {badge && (
                <p className={`mb-4 text-xl font-semibold uppercase tracking-[0.25em] ${dark ? "text-[#edeafb]" : "text-[#06053a]"
                    }`}>
                    {badge}
                </p>
            )}

            <h2 className={`text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl ${dark ? "text-white" : "text-[#06053a]"
                }`}>
                {title}
            </h2>

            {description && (
                <p className={`mt-5 text-base leading-8 sm:text-lg ${dark ? "text-white/70" : "text-[#06053a]/70"
                    }`}>
                    {description}
                </p>
            )}
        </motion.div>
    );
};

export default SectionHeader;