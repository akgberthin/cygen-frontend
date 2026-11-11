import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { BookOpen, CalendarDays, ChevronDown, Compass, GraduationCap, HeartHandshake, Landmark, Mail, Menu, Monitor, Moon, Sun, Users, X } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { LOCALES } from "../i18n/registry";
import { useTheme } from "../theme/ThemeContext";
import { FOOTER_COMPANY_LINKS, NAV_LINKS, applyUrl, localizedPath, switchLocalePath } from "../lib/links";

const ABOUT_MENU_SECTIONS = [
  {
    key: "company",
    items: [
      { key: "about", path: "about", Icon: Landmark },
      { key: "team", path: "about/team", Icon: Users },
      { key: "philosophy", path: "about/philosophy", Icon: Compass },
      { key: "impact", path: "about/impact", Icon: HeartHandshake },
    ],
  },
  {
    key: "learn",
    items: [
      { key: "resources", path: "about/resources", Icon: BookOpen },
      { key: "workshopsSeminars", path: "workshops", Icon: GraduationCap },
    ],
  },
  {
    key: "reach",
    items: [{ key: "contact", path: "contact", Icon: Mail }],
  },
];

function Logo({ compact = false }) {
  const { lang } = useI18n();
  return (
    <Link to={localizedPath(lang)} className="flex items-center" data-testid="logo-link" aria-label="CYGEN — home">
      {/* The artwork has a solid black background and white letter strokes, so it
          always sits on a black badge to read correctly in both themes. */}
      <span className={`inline-flex items-center rounded-[8px] bg-black ${compact ? "px-2 py-1" : "px-2.5 py-1.5"}`}>
        <img
          src="/images/cygen-logo.png"
          alt="CYGEN Equities"
          className={compact ? "h-6 w-auto" : "h-8 w-auto"}
          width="440"
          height="169"
        />
      </span>
    </Link>
  );
}

function LanguageSwitch() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const other = lang === "en" ? "es" : "en";
  return (
    <button
      type="button"
      data-testid="language-switch"
      aria-label={`${t("common.languageLabel")}: ${LOCALES[other].label}`}
      title={LOCALES[other].label}
      onClick={() => navigate(`${switchLocalePath(location.pathname, other)}${location.search}`)}
      className="rounded-[7px] border border-input px-2.5 py-1.5 text-xs font-bold tracking-wide text-cream transition-colors hover:border-gold hover:text-gold-text"
    >
      {LOCALES[other].shortLabel}
    </button>
  );
}

function ThemeSwitch() {
  const { choice, setChoice } = useTheme();
  const { t } = useI18n();
  const options = [
    { id: "system", Icon: Monitor, label: t("common.themeSystem") },
    { id: "dark", Icon: Moon, label: t("common.themeDark") },
    { id: "light", Icon: Sun, label: t("common.themeLight") },
  ];
  return (
    <div role="group" aria-label={t("common.themeLabel")} data-testid="theme-switch" className="flex rounded-[7px] border border-input p-0.5">
      {options.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          data-testid={`theme-${id}`}
          aria-pressed={choice === id}
          title={label}
          aria-label={label}
          onClick={() => setChoice(id)}
          className={`rounded-[5px] p-1.5 transition-colors ${choice === id ? "bg-gold text-ink" : "text-muted-foreground hover:text-cream"}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function AboutMenu({ itemClass }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const ref = useRef(null);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const active = location.pathname.split("/")[2] === "about";

  return (
    <div className="relative" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        data-testid="about-menu-button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={(e) => {
          if (e.detail === 0) setOpen((v) => !v); // keyboard only; hover/touch already opened it
        }}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className={`${itemClass({ isActive: active })} flex items-center gap-1`}
      >
        {t("nav.about")}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" data-testid="about-menu" className="absolute right-0 top-full z-50 mt-1.5 w-[720px] rounded-[10px] border border-border bg-surface-2 p-5 shadow-2xl">
          <div className="grid grid-cols-3 gap-5">
            {ABOUT_MENU_SECTIONS.map((section) => (
              <div key={section.key} data-testid={`about-menu-section-${section.key}`}>
                <p className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-text">{t(`nav.sections.${section.key}`)}</p>
                <p className="mt-1 px-2 text-[11px] leading-relaxed text-dim">{t(`nav.sectionDesc.${section.key}`)}</p>
                <div className="mt-2 space-y-0.5">
                  {section.items.map(({ key, path, Icon }) => (
                    <Link
                      key={key}
                      role="menuitem"
                      to={localizedPath(lang, path)}
                      data-testid={`about-menu-${key}`}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 rounded-[7px] p-2.5 transition-colors hover:bg-surface-3"
                    >
                      <span className="mt-0.5 inline-flex shrink-0 rounded-[7px] bg-surface-3 p-2 text-gold-text" aria-hidden="true">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-cream">{t(`nav.${key}`)}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{t(`navDesc.${key}`)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const apply = applyUrl(lang);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const itemClass = ({ isActive }) =>
    `rounded-[7px] px-3 py-2 text-sm font-medium transition-colors ${isActive ? "text-gold-text" : "text-body hover:text-gold-text"}`;

  const navItem = ({ key, path }) => (
    <NavLink key={key} to={localizedPath(lang, path)} data-testid={`nav-${key}`} className={itemClass}>
      {t(`nav.${key}`)}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map(navItem)}
          <AboutMenu itemClass={itemClass} />
        </nav>
        <div className="flex items-center gap-2.5">
          <LanguageSwitch />
          <ThemeSwitch />
          <a
            href={apply.href}
            data-testid="apply-button"
            className="btn-primary hidden !px-4 !py-2 sm:inline-flex"
            {...(apply.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {t("common.apply")}
          </a>
          <button
            type="button"
            data-testid="mobile-menu-button"
            aria-expanded={open}
            aria-label={open ? t("common.menuClose") : t("common.menuOpen")}
            onClick={() => setOpen((v) => !v)}
            className="rounded-[7px] border border-input p-2 text-cream lg:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" data-testid="mobile-menu" className="border-t border-border bg-surface px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map(navItem)}
            {FOOTER_COMPANY_LINKS.map(navItem)}
            <a
              href={apply.href}
              data-testid="apply-button-mobile"
              className="btn-primary mt-2"
              {...(apply.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {t("common.apply")}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { t, lang } = useI18n();
  return (
    <footer className="border-t border-border bg-surface" data-testid="site-footer">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">{t("footer.tagline")}</p>
          </div>
          <nav aria-label={t("footer.explore")}>
            <h2 className="text-sm font-semibold text-cream">{t("footer.explore")}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {NAV_LINKS.map(({ key, path }) => (
                <li key={key}>
                  <Link className="text-muted-foreground transition-colors hover:text-gold-text" to={localizedPath(lang, path)}>
                    {t(`nav.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t("footer.company")}>
            <h2 className="text-sm font-semibold text-cream">{t("footer.company")}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {FOOTER_COMPANY_LINKS.map(({ key, path }) => (
                <li key={key}>
                  <Link className="text-muted-foreground transition-colors hover:text-gold-text" to={localizedPath(lang, path)}>
                    {t(`nav.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="text-sm font-semibold text-cream">{t("footer.legalHeading")}</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              <Link className="transition-colors hover:text-gold-text" to={localizedPath(lang, "legal")}>
                {t("nav.legal")}
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-10 space-y-3 border-t border-border pt-6">
          <p className="text-sm font-medium text-body" data-testid="footer-disclosure">
            {t("common.footerDisclosure")}
          </p>
          {lang === "es" && (
            <p className="text-sm text-gold-text" data-testid="spanish-review-note">
              {t("common.spanishReviewNote")}
            </p>
          )}
          <p className="text-xs text-dim">{t("common.sampleNote")}</p>
          <p className="text-xs text-dim">{t("common.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { lang } = useParams();
  const location = useLocation();
  const { setLang, t } = useI18n();

  useEffect(() => {
    if (LOCALES[lang]) setLang(lang);
  }, [lang, setLang]);

  useEffect(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!LOCALES[lang]) {
    return <Navigate to={`/en${location.pathname.replace(/^\/[a-z]{2}/, "")}`} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a href="#main-content" className="skip-link" data-testid="skip-to-content">
        {t("common.skipToContent")}
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
