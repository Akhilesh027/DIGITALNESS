import React from "react";
import { motion } from "framer-motion";
import { Quote, Star, ShieldCheck } from "lucide-react";

const testimonials = [
    {
        name: "Sri Utsavam Banquets",
        role: "Banquet Hall Marketing",
        review:
            "Digitalness helped us improve our online presence with Meta Ads, GMB SEO and social media handling. Their work brought consistent enquiries and better visibility for our venue.",
    },
    {
        name: "Srinivasa Furnitures",
        role: "Furniture Showroom Marketing",
        review:
            "The team understands creative marketing very well. From poster designs to campaign ideas, they helped us present our products in a more premium and customer-friendly way.",
    },
    {
        name: "Toni & Guy Essensuals",
        role: "Salon Lead Generation",
        review:
            "We received strong support for our ad campaigns and local promotions. Digitalness gave us clear planning, creative content and regular campaign improvements.",
    },
];

const Testimonials = () => {
    return (
        <section className="relative overflow-hidden bg-[#EDEAFB] py-24 text-[#06053A]">
            <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-white blur-3xl" />
            <div className="absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-white/80 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-base font-bold shadow-sm">
                        <ShieldCheck size={18} />
                        Client Testimonials
                    </div>

                    <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
                        What Our Clients Say About Digitalness
                    </h2>

                    <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
                        Real feedback from businesses that trusted us for digital marketing,
                        creative campaigns, websites and growth-focused online visibility.
                    </p>
                </div>

                <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((item, index) => (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group rounded-[34px] border border-white bg-white/80 p-7 shadow-[0_22px_65px_rgba(6,5,58,0.10)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:bg-[#06053A] hover:text-white hover:shadow-[0_32px_90px_rgba(6,5,58,0.25)]"
                        >
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex gap-1 text-[#FDCC0D] transition group-hover:text-white">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={18} fill="currentColor" />
                                    ))}
                                </div>

                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDEAFB] text-[#06053A] transition group-hover:bg-white">
                                    <Quote size={24} />
                                </div>
                            </div>

                            <p className="text-base leading-8 text-slate-700 transition group-hover:text-white/80">
                                “{item.review}”
                            </p>

                            <div className="mt-8 border-t border-[#06053A]/10 pt-5 transition group-hover:border-white/20">
                                <h3 className="text-xl font-bold">{item.name}</h3>
                                <p className="mt-1 text-sm font-semibold text-slate-600 transition group-hover:text-white/65">
                                    {item.role}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;