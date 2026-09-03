import WhyChoose from "./components/sections/WhyChoose";
import Navbar from "./components/layout/Navbar";
import Hero from "./components/sections/Hero";
import Services from "./components/sections/Services";
import About from "./components/sections/About";
import Process from "./components/sections/Process";
import ContactCTA from "./components/sections/ContactCTA";
import Footer from "./components/layout/Footer";
import PartnerCompanies from "./components/sections/PartnerCompanies";
import BlogPosts from "./components/sections/BlogPosts";

import ClientsShowcase from "./components/sections/ClientsShowcase";
import Testimonials from "./components/sections/Testimonials";
import ContactUsForm from "./components/sections/ContactUsForm";
import StickyActions from "./components/common/StickyActions";


const Home = () => {
    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <About />
                <PartnerCompanies />
                <Services />
                <WhyChoose />
                <ClientsShowcase />
                <BlogPosts />

                <Process />
                <Testimonials />
                <ContactCTA />
            </main>
            <Footer />
            <StickyActions />
        </>
    );
};

export default Home;