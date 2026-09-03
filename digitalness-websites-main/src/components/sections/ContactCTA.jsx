import Container from "../common/Container";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ContactCTA = () => {
    return (
        <section id="contact" className="bg-[#edeafb] py-24">
            <Container>
                <div className="rounded-[2rem] bg-[#06053a] p-8 text-center sm:p-14 lg:p-20">
                    <h2 className="mx-auto max-w-4xl text-3xl font-bold leading-tight text-white sm:text-5xl">
                        Ready to build a stronger digital presence for your business?
                    </h2>

                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/70">
                        Let Digitalness help you grow with SEO, ads, websites,
                        CRM, branding, and performance-focused digital strategy.
                    </p>

                    <Link
                        to="/contact"
                        className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-[#06053a] transition hover:scale-105"
                    >
                        Book Free Consultation
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </Container>
        </section>
    );
};

export default ContactCTA;