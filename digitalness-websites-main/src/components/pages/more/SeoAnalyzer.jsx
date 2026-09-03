import { useState } from "react";
import { SearchCheck, Globe2, Gauge, FileText, Link2, ShieldCheck } from "lucide-react";
import MorePageLayout from "./MorePageLayout";

const SeoAnalyzer = () => {
    const [url, setUrl] = useState("");

    const checks = [
        { icon: Gauge, title: "Performance Score", text: "Check speed, loading experience and page performance." },
        { icon: FileText, title: "On-page SEO", text: "Review title, meta description, headings and content structure." },
        { icon: Link2, title: "Link Health", text: "Identify internal linking, broken links and crawl issues." },
        { icon: ShieldCheck, title: "Technical SEO", text: "Analyze mobile readiness, indexing signals and basic SEO health." },
    ];

    return (
        <MorePageLayout
            badge="Free SEO Tool"
            title="SEO Analyzer"
            subtitle="Analyze your website SEO performance and discover practical improvements for rankings, speed, content and visibility."
            ctaText="Improve My SEO"
        >
            <section className="px-4 py-20">
                <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr]">
                    <div className="rounded-[36px] bg-white p-8 shadow-[0_25px_80px_rgba(6,5,58,0.12)] md:p-10">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#06053a] text-white">
                            <SearchCheck size={32} />
                        </div>

                        <h2 className="text-3xl font-bold md:text-5xl">
                            Check your website SEO health
                        </h2>

                        <p className="mt-5 text-lg leading-8 text-[#4b4b68]">
                            Enter your website URL to review important SEO factors. This UI is
                            backend-ready, so you can later connect it with your SEO analyzer
                            API and show real-time reports.
                        </p>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                console.log("Connect SEO Analyzer API:", url);
                            }}
                            className="mt-8 rounded-[28px] bg-[#f8f7ff] p-4 md:flex md:items-center md:gap-4"
                        >
                            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-5 py-4">
                                <Globe2 size={20} className="text-[#06053a]" />
                                <input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Enter website URL"
                                    className="w-full bg-transparent font-semibold text-[#06053a] outline-none placeholder:text-[#6b6888]"
                                />
                            </div>

                            <button className="mt-4 w-full rounded-2xl bg-[#06053a] px-7 py-4 font-bold text-white md:mt-0 md:w-auto">
                                Analyze SEO
                            </button>
                        </form>
                    </div>

                    <div className="grid gap-5">
                        {checks.map((item) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.title}
                                    className="rounded-[28px] border border-[#06053a]/10 bg-white p-6 shadow-[0_15px_45px_rgba(6,5,58,0.08)]"
                                >
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edeafb] text-[#06053a]">
                                        <Icon size={23} />
                                    </div>

                                    <h3 className="text-xl font-bold">{item.title}</h3>
                                    <p className="mt-2 leading-7 text-[#4b4b68]">{item.text}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </MorePageLayout>
    );
};

export default SeoAnalyzer;