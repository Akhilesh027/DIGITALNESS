import { useState } from "react";
import { Award, SearchCheck } from "lucide-react";
import MorePageLayout from "./MorePageLayout";

const CertificationsPage = () => {
    const [employeeId, setEmployeeId] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Connect this to CRM later:", employeeId);
    };

    return (
        <MorePageLayout
            badge="Digitalness Verification"
            title="Experience Certification"
            subtitle="Employees and interns can verify their Digitalness experience certificate using their employee or intern ID."
            ctaText="Contact HR Team"
        >
            <section className="px-4 py-20">
                <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
                    <div className="rounded-[34px] bg-white p-8 shadow-[0_25px_80px_rgba(6,5,58,0.12)]">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#06053a] text-white">
                            <Award size={30} />
                        </div>

                        <h2 className="text-3xl font-bold">Verify Certificate</h2>
                        <p className="mt-4 leading-8 text-[#4b4b68]">
                            Enter your employee ID or intern ID to access your experience
                            certificate. This page can later connect directly with your CRM or
                            backend certificate database.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                            <input
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                placeholder="Enter Employee / Intern ID"
                                className="w-full rounded-2xl border border-[#06053a]/15 bg-[#f8f7ff] px-5 py-4 font-semibold outline-none focus:border-[#06053a]"
                            />

                            <button className="inline-flex items-center gap-3 rounded-full bg-[#06053a] px-8 py-4 font-bold text-white">
                                <SearchCheck size={20} />
                                Verify Certificate
                            </button>
                        </form>
                    </div>

                    <div className="rounded-[34px] bg-[#06053a] p-8 text-white">
                        <h2 className="text-3xl font-bold">For Digitalness Team Members</h2>
                        <p className="mt-5 leading-8 text-white/75">
                            This verification system is planned for employees, interns and
                            trainees who completed their work period with Digitalness. Once
                            connected to CRM, users can download or view their certificate
                            securely.
                        </p>

                        <div className="mt-8 grid gap-4">
                            {["Employee ID Verification", "Internship Certificate Access", "CRM Integration Ready", "Secure Certificate Records"].map(
                                (item) => (
                                    <div key={item} className="rounded-2xl bg-white/10 p-4 font-bold">
                                        {item}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </MorePageLayout>
    );
};

export default CertificationsPage;