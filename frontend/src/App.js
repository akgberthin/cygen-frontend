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
              <Route index element={<Home />} />
              <Route path="how-it-works" element={<HowItWorks />} />
              <Route path="refinance" element={<Refinance />} />
              <Route path="limited-partners" element={<LimitedPartners />} />
              <Route path="brokers" element={<Brokers />} />
              <Route path="workshops" element={<Workshops />} />
              <Route path="faq" element={<Faq />} />
              <Route path="about" element={<About />} />
              <Route path="about/team" element={<Team />} />
              <Route path="about/philosophy" element={<Philosophy />} />
              <Route path="about/impact" element={<Impact />} />
              <Route path="about/resources" element={<Resources />} />
              <Route path="contact" element={<Contact />} />
              <Route path="apply" element={<Apply />} />
              <Route path="register" element={<Register />} />
              <Route path="account" element={<Account />} />
              <Route path="legal" element={<Legal />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="*" element={<LangRedirect />} />
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
}
