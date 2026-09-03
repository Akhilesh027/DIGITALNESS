import { useState } from "react";
import { KeyRound, Search, Lightbulb, Target, FileText, TrendingUp } from "lucide-react";
import MorePageLayout from "./MorePageLayout";

const FreeKeywordTool = () => {
    const [website, setWebsite] = useState("");
    const [industry, setIndustry] = useState("");

    const keywordTypes = [
        { icon: Search, title: "Service Keywords", text: "Find keywords related to your services and business category." },
        { icon: Target, title: "Buyer Intent Keywords", text: "Discover search terms used by customers ready to enquire." },
        { icon: FileText, title: "Blog Topic Ideas", text: "Get content ideas for SEO blogs and website pages." },
        { icon: TrendingUp, title: "Growth Keywords", text: "Identify keyword opportunities for long-term organic traffic." },
    ];

    return (
        <MorePageLayout
            badge="Keyword Research Tool"
            title="Free Keyword Suggestion Tool"
            subtitle="Find keyword ideas that help your business improve search visibility, create better content and plan SEO campaigns."
            ctaText="Plan My Keywords"
        >
            <section className="px-4 py-20">
                <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[36px] bg-[#06053a] p-8 text-white shadow-[0_25px_80px_rgba(6,5,58,0.22)] md:p-10">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#06053a]">
                            <KeyRound size={32} />
                        </div>

                        <h2 className="text-3xl font-bold md:text-5xl">
                            Get keyword ideas for your business
                        </h2>

                        <p className="mt-5 text-lg leading-8 text-white/75">
                            Keyword research helps you understand what your customers are
                            searching for. This tool UI is ready for backend integration, so
                            you can later generate suggestions based on website, industry and
                            location.
                        </p>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                console.log("Connect Keyword API:", { website, industry });
                            }}
                            className="mt-8 space-y-4"
                        >
                            <input
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="Website URL"
                                className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 font-semibold text-white outline-none placeholder:text-white/55"
                            />

                            <input
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                placeholder="Business industry / service"
                                className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 font-semibold text-white outline-none placeholder:text-white/55"
                            />

                            <button className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-7 py-4 font-bold text-[#06053a]">
                                <Lightbulb size={20} />
                                Generate Keyword Ideas
                            </button>
                        </form>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold md:text-5xl">
                            What this tool can suggest
                        </h2>

                        <p className="mt-5 text-lg leading-8 text-[#4b4b68]">
                            Use this toolkit to plan SEO pages, blog topics, Google Ads
                            keywords and local business content. The right keywords help your
                            website attract better visitors and improve enquiry quality.
                        </p>

                        <div className="mt-8 grid gap-5 md:grid-cols-2">
                            {keywordTypes.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <div
                                        key={item.title}
                                        className="rounded-[28px] bg-white p-6 shadow-[0_18px_55px_rgba(6,5,58,0.10)]"
                                    >
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edeafb] text-[#06053a]">
                                            <Icon size={23} />
                                        </div>

                                        <h3 className="text-xl font-bold">{item.title}</h3>
                                        <p className="mt-2 leading-7 text-[#4b4b68]">
                                            {item.text}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>
        </MorePageLayout>
    );
};

export default FreeKeywordTool;