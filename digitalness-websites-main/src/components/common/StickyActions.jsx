import { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { ArrowUp } from "lucide-react";

const StickyActions = () => {
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 250) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <>
            {/* Scroll to Top Floating Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    aria-label="Scroll to Top"
                    className="
                        fixed bottom-24 right-6 z-[60]
                        flex h-12 w-12 items-center justify-center
                        rounded-full bg-[#06053A] text-white
                        border border-white/20
                        shadow-[0_10px_25px_rgba(6,5,58,0.4)]
                        transition-all duration-300 hover:scale-110 hover:bg-[#15126d]
                        cursor-pointer animate-fade-in
                    "
                >
                    <ArrowUp className="w-5 h-5" />
                </button>
            )}

            {/* Download Portfolio */}
            <a
                href="/Digitalness-Portfolio.pdf"
                download
                aria-label="Download Digitalness Portfolio"
                className="
                fixed right-0 top-1/2 z-[60] hidden
                -translate-y-1/2 md:flex
                h-[150px] w-[58px]
                flex-col items-center justify-center
                rounded-l-[8px]
                bg-[#06053A]
                text-white
                shadow-[0_18px_45px_rgba(6,5,58,0.35)]
                transition-all duration-300
                hover:w-[64px]
                hover:bg-[#0b0870]
            "
            >
                <span className="[writing-mode:vertical-rl] rotate-180 text-[13px] font-bold tracking-[0.12em]">
                    Download
                    <br />
                    Portfolio
                </span>

                <span className="mt-3 text-[15px] leading-none">
                    ↵
                </span>
            </a>

            {/* WhatsApp Button */}
            <a
                href="https://wa.me/919989329642"
                target="_blank"
                rel="noopener noreferrer"
                className="
                    fixed bottom-6 right-6 z-[60]
                    flex h-14 w-14 items-center justify-center
                    rounded-full bg-[#25D366] text-white
                    shadow-[0_15px_35px_rgba(37,211,102,0.35)]
                    transition hover:scale-110
                "
                aria-label="Chat on WhatsApp"
            >
                <FaWhatsapp size={30} />
            </a>
        </>
    );
};

export default StickyActions;