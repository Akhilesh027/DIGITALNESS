import { Target, Search, PenTool, Rocket, BarChart3 } from "lucide-react";
import MorePageLayout from "./MorePageLayout";

const steps = [
    {
        icon: Search,
        title: "Discover",
        text: "We understand your business, audience, competitors and current digital presence before planning anything.",
    },
    {
        icon: Target,
        title: "Plan",
        text: "We create a practical growth roadmap covering website, SEO, ads, content, creatives and conversion flow.",
    },
    {
        icon: PenTool,
        title: "Create",
        text: "Our team designs professional assets, builds clean pages and prepares campaigns with clear messaging.",
    },
    {
        icon: Rocket,
        title: "Launch",
        text: "We launch campaigns and digital systems with proper tracking, testing and performance monitoring.",
    },
    {
        icon: BarChart3,
        title: "Optimize",
        text: "We improve results continuously through data, customer behaviour and business feedback.",
    },
];

const OurApproach = () => {
    return (
        <MorePageLayout
            badge="Digital Growth Framework"
            title="Our Approach"
            subtitle="A practical growth process that combines strategy, creativity, technology and performance marketing."
            ctaText="Start Your Growth Journey"
        >
            <section className="px-4 py-20">
                <div className="mx-auto max-w-7xl">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                        {steps.map((item) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.title}
                                    className="group relative overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(6,5,58,0.10)] transition-all duration-500 hover:-translate-y-3 hover:bg-[#06053a] hover:shadow-[0_30px_90px_rgba(6,5,58,0.25)]"
                                >
                                    <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#edeafb] opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-25" />

                                    <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06053a] text-white transition-all duration-500 group-hover:scale-110 group-hover:bg-white group-hover:text-[#06053a]">
                                        <Icon size={24} />
                                    </div>

                                    <h3 className="relative text-xl font-black transition-colors duration-500 group-hover:text-white">
                                        {item.title}
                                    </h3>

                                    <p className="relative mt-4 leading-7 text-[#4b4b68] transition-colors duration-500 group-hover:text-white/75">
                                        {item.text}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </MorePageLayout>
    );
};

export default OurApproach;