import React, { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Lenis from "lenis";
import { I18nProvider } from "./i18n/I18nContext";
import { ThemeProvider } from "./theme/ThemeContext";
import { detectLocale } from "./i18n/registry";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Refinance from "./pages/Refinance";
import LimitedPartners from "./pages/LimitedPartners";
import Brokers from "./pages/Brokers";
import Workshops from "./pages/Workshops";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Resources from "./pages/Resources";
import Faq from "./pages/Faq";
import About from "./pages/About";
import Team from "./pages/Team";
import Philosophy from "./pages/Philosophy";
import Impact from "./pages/Impact";
import Contact from "./pages/Contact";
import Apply from "./pages/Apply";
import Legal from "./pages/Legal";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import CmsGate from "./cms/CmsGate";

function LangRedirect() {
  return <Navigate to={`/${detectLocale()}`} replace />;
}

function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis;
    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
          <SmoothScroll />
          <Routes>
            <Route path="/" element={<LangRedirect />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/:lang" element={<Layout />}>
              <Route index element={<CmsGate slug=""><Home /></CmsGate>} />
              <Route path="how-it-works" element={<CmsGate slug="how-it-works"><HowItWorks /></CmsGate>} />
              <Route path="refinance" element={<CmsGate slug="refinance"><Refinance /></CmsGate>} />
              <Route path="limited-partners" element={<CmsGate slug="limited-partners"><LimitedPartners /></CmsGate>} />
              <Route path="brokers" element={<CmsGate slug="brokers"><Brokers /></CmsGate>} />
              <Route path="workshops" element={<CmsGate slug="workshops"><Workshops /></CmsGate>} />
              <Route path="faq" element={<CmsGate slug="faq"><Faq /></CmsGate>} />
              <Route path="about" element={<CmsGate slug="about"><About /></CmsGate>} />
              <Route path="about/team" element={<CmsGate slug="about/team"><Team /></CmsGate>} />
              <Route path="about/philosophy" element={<CmsGate slug="about/philosophy"><Philosophy /></CmsGate>} />
              <Route path="about/impact" element={<CmsGate slug="about/impact"><Impact /></CmsGate>} />
              <Route path="about/resources" element={<CmsGate slug="about/resources"><Resources /></CmsGate>} />
              <Route path="contact" element={<CmsGate slug="contact"><Contact /></CmsGate>} />
              <Route path="apply" element={<CmsGate slug="apply"><Apply /></CmsGate>} />
              <Route path="register" element={<Register />} />
              <Route path="account" element={<Account />} />
              <Route path="legal" element={<CmsGate slug="legal"><Legal /></CmsGate>} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="*" element={<LangRedirect />} />
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
}
