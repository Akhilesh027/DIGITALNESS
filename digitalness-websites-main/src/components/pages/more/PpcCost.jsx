import MorePageLayout from "./MorePageLayout";

const pricing = [
    ["Landing Page", "₹8,000 - ₹18,000", "Single page, lead form, mobile responsive"],
    ["Business Website", "₹18,000 - ₹45,000", "5-10 pages, SEO structure, contact form"],
    ["E-commerce Website", "₹45,000 - ₹1,50,000+", "Products, cart, payments, admin panel"],
    ["Custom CRM Website", "Custom Quote", "Dashboard, roles, reports, automation"],
];

const PpcCost = () => {
    return (
        <MorePageLayout
            badge="Website Pricing Guide"
            title="Website Cost"
            subtitle="Understand how website pricing depends on pages, design quality, features, technology and business goals."
            ctaText="Get Website Estimate"
        >
            <section className="px-4 py-20">
                <div className="mx-auto max-w-7xl rounded-[34px] bg-white p-8 shadow-[0_25px_80px_rgba(6,5,58,0.12)]">
                    <h2 className="text-3xl font-bold md:text-5xl">
                        How much does a website cost?
                    </h2>

                    <p className="mt-6 text-lg leading-8 text-[#4b4b68]">
                        Website cost depends on your business requirement. A simple landing
                        page costs less, while e-commerce websites and CRM-based platforms
                        need more planning, development time and backend functionality.
                    </p>

                    <div className="mt-10 overflow-hidden rounded-3xl border border-[#06053a]/10">
                        <table className="w-full border-collapse bg-white text-left">
                            <thead className="bg-[#06053a] text-white">
                                <tr>
                                    <th className="p-5">Website Type</th>
                                    <th className="p-5">Estimated Cost</th>
                                    <th className="p-5">Includes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pricing.map((row) => (
                                    <tr key={row[0]} className="border-b border-[#06053a]/10">
                                        <td className="p-5 font-bold">{row[0]}</td>
                                        <td className="p-5 font-bold">{row[1]}</td>
                                        <td className="p-5 text-[#4b4b68]">{row[2]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </MorePageLayout>
    );
};

export default PpcCost;