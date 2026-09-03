import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowUpRight,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Mail,
    MessageSquareText,
    Phone,
    UploadCloud,
    User,
    X,
} from "lucide-react";

const ApplicationForm = () => {
    const [submitted, setSubmitted] = useState(false);
    const [fileName, setFileName] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        e.target.reset();
        setFileName("");
    };

    const SelectField = ({ children }) => (
        <div className="relative">
            <select className="input-style appearance-none pr-16" required>
                {children}
            </select>

            <div className="pointer-events-none absolute right-[1px] top-[1px] flex h-[56px] w-14 items-center justify-center rounded-r-[17px] border-l border-[#06053A]/10 bg-white">
                <ChevronDown size={17} className="text-[#06053A]" />
            </div>
        </div>
    );

    return (
        <section className="relative overflow-hidden bg-[#edeafb] py-24 text-[#06053A]">
            <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-white blur-3xl" />
            <div className="absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-[#06053A]/10 blur-3xl" />

            <div className="relative mx-auto max-w-6xl px-4">
                <div className="mx-auto mb-12 max-w-3xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-6 flex justify-center"
                    >
                        <div className="inline-flex items-center gap-2.5 rounded-full border border-[#06053A]/10 bg-white px-5 py-2.5 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#06053A]/40 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#06053A]" />
                            </span>

                            <span className="text-base font-bold uppercase tracking-[0.18em] text-[#06053A]">
                                Candidate Application Form
                            </span>
                        </div>
                    </motion.div>

                    <h2 className="text-3xl font-bold leading-tight md:text-5xl">
                        Apply For Your Career at Digitalness
                    </h2>

                    <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-black/70">
                        Submit your profile with complete details. Our team will review your
                        application and contact shortlisted candidates.
                    </p>
                </div>

                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 35 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="rounded-[34px] bg-white p-6 shadow-[0_30px_90px_rgba(6,5,58,0.12)] md:p-10"
                >
                    <div className="mb-8 rounded-[28px] bg-[#06053A] p-6 text-white">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="text-2xl font-bold">Candidate Profile Form</h3>
                                <p className="mt-2 text-sm leading-7 text-white/70">
                                    Please fill all required fields carefully before submitting.
                                </p>
                            </div>

                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#06053A]">
                                <BriefcaseBusiness size={26} />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-8">
                        <div>
                            <h4 className="mb-4 flex items-center gap-2 text-lg font-bold">
                                <User size={20} />
                                Personal Information
                            </h4>

                            <div className="grid gap-5 md:grid-cols-2">
                                <input className="input-style" placeholder="Full Name *" required />

                                <div className="relative">
                                    <input type="date" className="input-style pr-12" required />
                                    <CalendarDays
                                        size={18}
                                        className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#06053A]/55"
                                    />
                                </div>

                                <SelectField>
                                    <option value="">Select Gender *</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                    <option>Prefer not to say</option>
                                </SelectField>

                                <input className="input-style" placeholder="Current Location *" required />
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-4 flex items-center gap-2 text-lg font-bold">
                                <Phone size={20} />
                                Contact Details
                            </h4>

                            <div className="grid gap-5 md:grid-cols-2">
                                <input type="tel" className="input-style" placeholder="Mobile Number *" required />
                                <input type="tel" className="input-style" placeholder="WhatsApp Number" />
                                <input type="email" className="input-style" placeholder="Email Address *" required />
                                <input className="input-style" placeholder="LinkedIn / Portfolio URL" />
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-4 flex items-center gap-2 text-lg font-bold">
                                <BriefcaseBusiness size={20} />
                                Job Details
                            </h4>

                            <div className="grid gap-5 md:grid-cols-2">
                                <SelectField>
                                    <option value="">Position Applying For *</option>
                                    <option>Digital Marketing Intern</option>
                                    <option>Digital Marketing Executive</option>
                                    <option>SEO Executive</option>
                                    <option>Meta Ads Specialist</option>
                                    <option>Google Ads Specialist</option>
                                    <option>Graphic Designer</option>
                                    <option>Content Writer</option>
                                    <option>Frontend Developer</option>
                                    <option>MERN Stack Developer</option>
                                    <option>Office Admin</option>
                                </SelectField>

                                <SelectField>
                                    <option value="">Experience Level *</option>
                                    <option>Fresher</option>
                                    <option>0 - 1 Year</option>
                                    <option>1 - 3 Years</option>
                                    <option>3+ Years</option>
                                </SelectField>

                                <input className="input-style" placeholder="Current Company" />
                                <input className="input-style" placeholder="Current CTC / Expected CTC" />
                                <input className="input-style" placeholder="Notice Period" />
                                <input className="input-style" placeholder="Preferred Work Mode" />
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-4 flex items-center gap-2 text-lg font-bold">
                                <Mail size={20} />
                                Education & Skills
                            </h4>

                            <div className="grid gap-5 md:grid-cols-2">
                                <input className="input-style" placeholder="Highest Qualification *" required />
                                <input className="input-style" placeholder="College / University" />
                                <input className="input-style" placeholder="Year of Passing" />
                                <input className="input-style" placeholder="Key Skills *" required />
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-4 flex items-center gap-2 text-lg font-bold">
                                <UploadCloud size={20} />
                                Resume & Profile Summary
                            </h4>

                            <div className="grid gap-5 md:grid-cols-2">
                                <label className="flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-[#06053A]/25 bg-[#edeafb]/60 px-5 py-8 text-center transition hover:border-[#06053A] hover:bg-[#edeafb]">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#06053A] shadow-sm">
                                        <UploadCloud size={28} />
                                    </div>

                                    <span className="text-sm font-bold">Upload Resume *</span>
                                    <span className="mt-1 text-xs text-black/60">
                                        PDF, DOC or DOCX accepted
                                    </span>

                                    {fileName && (
                                        <span className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#06053A]">
                                            {fileName}
                                        </span>
                                    )}

                                    <input
                                        type="file"
                                        className="hidden"
                                        required
                                        onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                                    />
                                </label>

                                <div className="rounded-[24px] border border-[#06053A]/10 bg-[#faf9ff] p-5">
                                    <div className="mb-3 flex items-center gap-2 font-bold text-[#06053A]">
                                        <MessageSquareText size={18} />
                                        Why should we hire you?
                                    </div>

                                    <textarea
                                        rows="6"
                                        className="min-h-[120px] w-full resize-none rounded-2xl border border-[#06053A]/10 bg-white px-5 py-4 text-sm font-medium leading-7 text-[#06053A] outline-none transition focus:border-[#06053A] focus:shadow-[0_0_0_4px_rgba(6,5,58,0.06)]"
                                        placeholder="Tell us about your strengths, experience, achievements, and why you are a good fit for Digitalness."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-[#06053A]/10 bg-[#faf9ff] p-5">
                            <div className="mb-3 flex items-center gap-2 font-bold text-[#06053A]">
                                <MessageSquareText size={18} />
                                Additional Message
                            </div>

                            <textarea
                                rows="5"
                                className="min-h-[130px] w-full resize-none rounded-2xl border border-[#06053A]/10 bg-white px-5 py-4 text-sm font-medium leading-7 text-[#06053A] outline-none transition focus:border-[#06053A] focus:shadow-[0_0_0_4px_rgba(6,5,58,0.06)]"
                                placeholder="Share anything else you want our HR team to know."
                            />
                        </div>

                        <label className="flex items-start gap-3 rounded-2xl bg-[#edeafb]/60 p-4 text-sm font-medium text-[#06053A]">
                            <input required type="checkbox" className="mt-1 h-4 w-4 accent-[#06053A]" />
                            I agree that Digitalness can contact me regarding this application.
                        </label>

                        <button
                            type="submit"
                            className="inline-flex w-fit items-center gap-3 rounded-full bg-[#06053A] px-7 py-3.5 text-sm font-bold text-white shadow-[0_18px_45px_rgba(6,5,58,0.25)] transition hover:-translate-y-1"
                        >
                            Submit Application
                            <ArrowUpRight size={18} />
                        </button>
                    </div>
                </motion.form>
            </div>

            <AnimatePresence>
                {submitted && (
                    <motion.div
                        className="fixed inset-0 z-[999] flex items-center justify-center bg-[#06053A]/70 px-4 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 25 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 25 }}
                            className="relative w-full max-w-md rounded-[30px] bg-white p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.25)]"
                        >
                            <button
                                onClick={() => setSubmitted(false)}
                                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#edeafb] text-[#06053A]"
                            >
                                <X size={18} />
                            </button>

                            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#edeafb] text-[#06053A]">
                                <CheckCircle2 size={42} />
                            </div>

                            <h3 className="text-2xl font-bold text-[#06053A]">
                                Application Submitted!
                            </h3>

                            <p className="mt-3 text-sm leading-7 text-black/65">
                                Thank you for applying to Digitalness. Our team will review your
                                profile and contact you if your application is shortlisted.
                            </p>

                            <button
                                onClick={() => setSubmitted(false)}
                                className="mt-6 rounded-full bg-[#06053A] px-6 py-3 text-sm font-bold text-white transition hover:scale-105"
                            >
                                Okay, Got It
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default ApplicationForm;