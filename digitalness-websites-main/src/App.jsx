import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import "./index.css";

import ScrollToTop from "./components/common/ScrollToTop";
import StickyActions from "./components/common/StickyActions";

import ApplicationForm from "./components/sections/ApplicationForm";
import SubCategoryPage from "./components/pages/SubCategoryPage";
import BlogDetailPage from "./components/pages/BlogDetailPage";
import ContactUsForm from "./components/sections/ContactUsForm";
import OurApproach from "./components/pages/more/OurApproach";
import AboutPage from "./components/pages/more/AboutPage";
import CareersPage from "./components/pages/more/CareersPage";
import PartnerWithUs from "./components/pages/more/PartnerWithUs";
import CertificationsPage from "./components/pages/more/CertificationsPage";
import ContactInfoForm from "./components/pages/more/ContactInfoForm";
import CompanyValues from "./components/pages/more/CompanyValues";

import WebsiteCost from "./components/pages/more/WebsiteCost";
import PpcCost from "./components/pages/more/PpcCost";
import GoogleAdsCost from "./components/pages/more/GoogleAdsCost";
import SocialMediaPricing from "./components/pages/more/SocialMediaPricing";

import BlogPage from "./components/pages/more/BlogPage";
import SeoAnalyzer from "./components/pages/more/SeoAnalyzer";
import FreeKeywordTool from "./components/pages/more/FreeKeywordTool";
import FixYourFunnel from "./components/pages/more/FixYourFunnel";

import PrivacyPolicyPage from "./components/pages/more/PrivacyPolicyPage";
import TermsConditionsPage from "./components/pages/more/TermsConditionsPage";
import SitemapPage from "./components/pages/more/SitemapPage";
import FreeSeoToolsPage from "./components/pages/more/FreeSeoToolsPage";

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/contact" element={<ContactInfoForm />} />
        <Route path="/apply-now" element={<ApplicationForm />} />

        <Route path="/services/:slug" element={<SubCategoryPage />} />
        <Route path="/blogs/:slug" element={<BlogDetailPage />} />

        <Route path="/our-approach" element={<OurApproach />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/partner-with-us" element={<PartnerWithUs />} />
        <Route path="/certifications" element={<CertificationsPage />} />

        <Route path="/company-values" element={<CompanyValues />} />

        <Route path="/website-cost" element={<WebsiteCost />} />
        <Route path="/ppc-cost" element={<PpcCost />} />
        <Route path="/google-ads-cost" element={<GoogleAdsCost />} />
        <Route path="/social-media-pricing" element={<SocialMediaPricing />} />

        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blogs" element={<BlogPage />} />
        <Route path="/seo-analyzer" element={<SeoAnalyzer />} />
        <Route path="/free-keyword-tool" element={<FreeKeywordTool />} />
        <Route path="/fix-your-funnel" element={<FixYourFunnel />} />

        <Route path="/free-seo-tools" element={<FreeSeoToolsPage />} />
        <Route path="/sitemap" element={<SitemapPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsConditionsPage />} />
        <Route path="/terms-and-conditions" element={<TermsConditionsPage />} />
      </Routes>
      <StickyActions />
    </BrowserRouter>
  );
};

export default App;