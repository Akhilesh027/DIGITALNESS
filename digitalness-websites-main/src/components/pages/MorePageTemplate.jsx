import { Link, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";
import { morePagesData } from "../../data/morePagesData";

const defaultImages = {
  first:
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  second:
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80",
};

const MorePageTemplate = ({ pageKey }) => {
  const params = useParams();
  const key = pageKey || params.slug;
  const page = morePagesData[key] || morePagesData.about;
  const Icon = page.icon;

  const content = page.content || [
    `${page.title} helps businesses move with better clarity, stronger planning and a professional digital direction.`,
    `At Digitalness, we focus on practical execution, clean communication and measurable business growth. Every strategy is planned to improve trust, visibility and customer response.`,
  ];

  const images = page.images || defaultImages;

  return (
    <>
      <Navbar />

      <main className="overflow-hidden bg-[#edeafb] text-[#06053a]">
        {/* STEP 1: Banner */}
        <section className="relative flex min-h-[320px] items-center justify-center px-4 pt-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#edeafb_45%,#d8d1ff_100%)]" />

          <div className="relative z-10 mx-auto max-w-7xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold shadow-sm">
              <Icon size={16} />
              {page.badge}
            </span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-6 text-4xl font-bold leading-tight md:text-6xl"
            >
              {page.title}
            </motion.h1>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-[#111827]">
              <Link to="/" className="hover:text-[#06053a]">
                Home
              </Link>
              <ChevronRight size={15} />
              <span>More</span>
              <ChevronRight size={15} />
              <span>{page.title}</span>
            </div>
          </div>
        </section>

        {/* STEP 2: Light Section */}
        <section className="px-4 py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold shadow-sm">
                <CheckCircle2 size={16} />
                Strategy First
              </span>

              <h2 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">
                {page.title} Designed for Modern Business Growth
              </h2>

              <div className="mt-7 space-y-5">
                {content.slice(0, 2).map((para, index) => (
                  <p
                    key={index}
                    className="text-[18px] font-medium leading-9 text-[#3f3b68]"
                  >
                    {para}
                  </p>
                ))}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {(page.points || []).slice(0, 4).map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-white p-4 font-bold shadow-sm"
                  >
                    <CheckCircle2 size={18} />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="rounded-[34px] bg-white p-4 shadow-[0_30px_90px_rgba(6,5,58,0.16)]"
            >
              <img
                src={images.first}
                alt={page.title}
                className="h-[390px] w-full rounded-[26px] object-cover"
              />
            </motion.div>
          </div>
        </section>

        {/* STEP 3: Dark Section */}
        <section className="bg-[#06053a] px-4 py-24 text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="rounded-[34px] border border-white/15 bg-white/10 p-4 backdrop-blur"
            >
              <img
                src={images.second}
                alt={`${page.title} Digitalness`}
                className="h-[390px] w-full rounded-[26px] object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-bold">
                <TrendingUp size={16} />
                Performance Focused
              </span>

              <h2 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">
                Why Your Business Needs {page.title}
              </h2>

              <p className="mt-7 text-[18px] font-medium leading-9 text-white/80">
                Customers compare brands online before making a decision. A
                well-planned {page.title} page helps your business communicate
                clearly, build confidence and generate stronger enquiries.
              </p>

              <div className="mt-8 rounded-[26px] border border-white/15 bg-white/10 p-6">
                <div className="flex gap-4">
                  <ShieldCheck className="mt-1 shrink-0" size={28} />
                  <div>
                    <h3 className="text-xl font-bold">
                      Built with Digitalness Quality
                    </h3>
                    <p className="mt-2 leading-8 text-white/70">
                      Every page is planned with clean design, useful content,
                      better readability and a clear path for customer
                      enquiries.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/contact"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-bold text-[#06053a]"
              >
                {page.cta}
                <ArrowUpRight size={20} />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default MorePageTemplate;