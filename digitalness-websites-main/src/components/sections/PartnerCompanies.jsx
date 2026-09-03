import { motion } from "framer-motion";
import Container from "../common/Container";

const partnerLogos = [
    "https://digitalness.co.in/assets/img/elements/brand-img1.png",
    "https://digitalness.co.in/assets/img/elements/brand-img2.png",
    "https://digitalness.co.in/assets/img/elements/brand-img3.png",
    "https://digitalness.co.in/assets/img/elements/brand-img4.png",
    "https://digitalness.co.in/assets/img/elements/brand-img5.png",
    "https://digitalness.co.in/assets/img/elements/brand-img6.png",
    "https://digitalness.co.in/assets/img/elements/brand-img7.png",
    "https://digitalness.co.in/assets/img/elements/brand-img8.png",
    "https://digitalness.co.in/assets/img/elements/brand-img9.png",
];

const PartnerCompanies = () => {
    const logos = [...partnerLogos, ...partnerLogos];

    return (
        <section className="relative overflow-hidden bg-[#edeafb] py-10">
            <Container>
                <div className="grid items-center gap-8 lg:grid-cols-[260px_1fr]">
                    <motion.div
                        initial={{ opacity: 0, x: -24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center lg:text-left"
                    >
                        <h2 className="text-2xl font-bold leading-tight text-black">
                            Partnered with <br />
                            Top Companies
                        </h2>
                    </motion.div>

                    <div className="relative overflow-hidden">
                        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[#edeafb] to-transparent" />
                        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[#edeafb] to-transparent" />

                        <motion.div
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{
                                duration: 55,
                                ease: "linear",
                                repeat: Infinity,
                            }}
                            className="flex w-max items-center gap-16"
                        >
                            {logos.map((logo, index) => (
                                <div
                                    key={`${logo}-${index}`}
                                    className="flex h-20 w-[180px] shrink-0 items-center justify-center"
                                >
                                    <img
                                        src={logo}
                                        alt={`Partner company ${index + 1}`}
                                        className="max-h-12 w-auto object-contain transition duration-300 hover:scale-110"
                                    />
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default PartnerCompanies;