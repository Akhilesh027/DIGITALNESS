import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { servicesData } from "../../data/servicesPageData";

const defaultService = {
    title: "Digitalness Service",
    category: "Services",
    subtitle: "Premium digital solutions designed to improve your visibility, leads and business growth.",
    sections: [
        {
            title: "Growth-Focused Digital Strategy",
            text: "At Digitalness, we create practical digital solutions that help your business attract the right audience, build trust and convert visitors into enquiries. Every strategy is planned around your goals, competition and customer journey.",
            image:
                "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
        },
        {
            title: "Execution That Delivers Results",
            text: "From planning to launch, our team focuses on clean execution, better user experience and measurable performance. We make your digital presence simple, professional and ready for long-term growth.",
            image:
                "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80",
        },
    ],
};

const ServiceDetailPage = () => {
    const { slug } = useParams();
    const data = servicesData[slug] || defaultService;

    const firstSection = data.sections?.[0] || defaultService.sections[0];
    const secondSection = data.sections?.[1] || defaultService.sections[1];

    return (
        <main className="bg-[#b9c9ff] text-[#06053a]">
            {/* 1. Plain Banner */}
            <section
                className="relative flex min-h-[250px] items-center justify-center overflow-hidden bg-cover bg-center px-4 pt-24"
                style={{ backgroundImage: `url(${bannerBg})` }}
            >
                <div className="absolute inset-0 bg-[#edeafb]/35" />

                <div className="relative z-10 mx-auto max-w-7xl text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="text-4xl font-black tracking-tight text-[#111827] md:text-5xl"
                    >
                        {data.title}
                    </motion.h1>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-[#111827]">
                        <Link to="/" className="transition hover:text-[#06053a]">
                            Home
                        </Link>
                        <ChevronRight size={15} />
                        <span>Services</span>
                        <ChevronRight size={15} />
                        <span>{data.title}</span>
                    </div>
                </div>
            </section>

            {/* 2. Left Content + Right Image */}
            <section className="bg-[#b9c9ff] px-4 py-20">
                <div className="mx-auto grid max-w-[1800px] items-center gap-10 lg:grid-cols-[1.25fr_0.75fr]">
                    <motion.div
                        initial={{ opacity: 0, x: -24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45 }}
                    >
                        <span className="mb-4 block text-base font-semibold text-[#111827]">
                            {firstSection.title}
                        </span>

                        <p className="max-w-[1380px] text-[19px] font-medium leading-[1.7] tracking-wide text-[#4b4b5f]">
                            {firstSection.text}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45 }}
                        className="flex justify-center lg:justify-end"
                    >
                        <img
                            src={firstSection.image}
                            alt={firstSection.title}
                            className="h-[260px] w-full max-w-[430px] rounded-[12px] object-cover"
                        />
                    </motion.div>
                </div>
            </section>

            {/* 3. Left Image + Right Content */}
            <section className="bg-[#b9c9ff] px-4 py-20">
                <div className="mx-auto grid max-w-[1800px] items-center gap-10 lg:grid-cols-[0.75fr_1.25fr]">
                    <motion.div
                        initial={{ opacity: 0, x: -24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45 }}
                        className="flex justify-center lg:justify-start"
                    >
                        <img
                            src={secondSection.image}
                            alt={secondSection.title}
                            className="h-[360px] w-full max-w-[450px] rounded-[12px] object-cover"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 24 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45 }}
                    >
                        <span className="mb-4 block text-base font-semibold text-[#111827]">
                            {secondSection.title}
                        </span>

                        <p className="max-w-[1380px] text-[19px] font-medium leading-[1.7] tracking-wide text-[#4b4b5f]">
                            {secondSection.text}
                        </p>
                    </motion.div>
                </div>
            </section>
        </main>
    );
};

export default ServiceDetailPage;