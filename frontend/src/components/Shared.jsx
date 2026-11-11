import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { applyUrl } from "../lib/links";

export function Reveal({ children, delay = 0, y = 28, className = "" }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Section({ id, className = "", children }) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 ${className}`}>
      {children}
    </section>
  );
}

export function PageHeader({ eyebrow, title, intro }) {
  return (
    <Reveal>
      <header className="mx-auto max-w-3xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{intro}</p>}
      </header>
    </Reveal>
  );
}

export function SectionTitle({ title, subtitle }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function BannerText({ eyebrow, title, intro, caption, onPhoto, center, small }) {
  return (
    <div className={center ? "text-center" : ""}>
      {eyebrow && <p className={`eyebrow ${onPhoto ? "!text-[#d8b95a]" : ""}`}>{eyebrow}</p>}
      <h1 className={`mt-3 font-bold leading-[1.05] tracking-tight ${small ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"} max-w-3xl ${onPhoto ? "text-[#edeae0]" : "text-cream"} ${center ? "mx-auto" : ""}`}>
        {title}
      </h1>
      {intro && (
        <p className={`mt-4 max-w-xl text-base leading-relaxed ${onPhoto ? "text-[#cdd5de]" : "text-muted-foreground"} ${center ? "mx-auto" : ""}`}>
          {intro}
        </p>
      )}
      {caption && (
        <p className={`mt-6 inline-flex items-center gap-2.5 rounded-[7px] border px-3.5 py-2 text-xs font-medium ${
          onPhoto
            ? "border-[rgba(255,255,255,0.25)] bg-[rgba(7,9,15,0.45)] text-[#edeae0] backdrop-blur-sm"
            : "border-border bg-surface-2 text-body"
        }`}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#c9a84c]" aria-hidden="true" />
          {caption}
        </p>
      )}
    </div>
  );
}

function BannerImg({ image, alt, reduce, className }) {
  return (
    <motion.img
      src={image}
      alt={alt || ""}
      loading="eager"
      className={className}
      initial={reduce ? false : { scale: 1.08, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

// Each variant is a different composition so every page opens with its own personality.
export function PageBanner({ image, alt, eyebrow, title, intro, caption, icon: Icon, testid, variant = "left", rail }) {
  const reduce = useReducedMotion();
  const text = { eyebrow, title, intro, caption };

  if (variant === "split") {
    return (
      <header className="relative overflow-hidden border-b border-border" data-testid={testid}>
        <div className="grid lg:grid-cols-2">
          <div className="relative flex flex-col justify-center bg-surface px-4 py-16 sm:px-10 lg:py-24">
            <span className="absolute inset-y-0 right-0 hidden w-1 bg-gold lg:block" aria-hidden="true" />
            <BannerText {...text} />
          </div>
          <div className="relative min-h-[280px] bg-[#07090f] lg:min-h-[420px]">
            <BannerImg image={image} alt={alt} reduce={reduce} className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      </header>
    );
  }

  if (variant === "arch") {
    return (
      <header className="relative overflow-hidden border-b border-border bg-surface" data-testid={testid}>
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-16 sm:px-6">
          <BannerText {...text} caption={undefined} center />
          <div className="relative mt-10 h-[280px] w-full max-w-2xl overflow-hidden rounded-t-[999px] border-2 border-gold/40 sm:h-[340px]">
            <BannerImg image={image} alt={alt} reduce={reduce} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,9,15,0.55), transparent 55%)" }} aria-hidden="true" />
            {caption && (
              <p className="absolute inset-x-4 bottom-5 text-center text-xs font-medium text-[#edeae0]">
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#c9a84c]" aria-hidden="true" />
                {caption}
              </p>
            )}
          </div>
        </div>
      </header>
    );
  }

  if (variant === "glass") {
    return (
      <header className="relative min-h-[480px] overflow-hidden border-b border-border bg-[#07090f]" data-testid={testid}>
        <BannerImg image={image} alt={alt} reduce={reduce} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(7,9,15,0.2), rgba(7,9,15,0.7))" }} aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[480px] max-w-6xl items-center justify-end px-4 py-16 sm:px-6">
          <div className="relative w-full max-w-lg rounded-[10px] border border-[rgba(255,255,255,0.18)] border-l-4 border-l-gold bg-[rgba(7,9,15,0.6)] p-8 backdrop-blur-md">
            {Icon && (
              <span className="absolute -top-5 right-6 rounded-[10px] border border-[rgba(255,255,255,0.2)] bg-[rgba(7,9,15,0.7)] p-3 text-[#d8b95a]" aria-hidden="true">
                <Icon className="h-6 w-6" />
              </span>
            )}
            <BannerText {...text} onPhoto small />
          </div>
        </div>
      </header>
    );
  }

  if (variant === "rail") {
    return (
      <header className="relative overflow-hidden border-b border-border" data-testid={testid}>
        <div className="grid lg:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col justify-center bg-surface px-4 py-16 sm:px-10 lg:py-24">
            <BannerText {...text} />
            {rail ? (
              <ol className="mt-10 flex items-center" aria-hidden="true">
                {Array.from({ length: rail }).map((_, i) => (
                  <li key={i} className="flex items-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/50 text-[11px] font-bold text-gold-text">{i + 1}</span>
                    {i < rail - 1 && <span className="h-px w-5 bg-gold/30 sm:w-7" />}
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
          <div className="relative min-h-[280px] bg-[#07090f] lg:min-h-[420px]" style={{ clipPath: "polygon(12% 0, 100% 0, 100% 100%, 0% 100%)" }}>
            <BannerImg image={image} alt={alt} reduce={reduce} className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      </header>
    );
  }

  if (variant === "ticket") {
    return (
      <header className="relative overflow-hidden border-b border-border bg-surface" data-testid={testid}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <BannerText {...text} />
          <div className="relative">
            <span className="absolute -left-5 bottom-4 top-4 hidden border-l-2 border-dashed border-gold/60 sm:block" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[10px] border border-border shadow-xl">
              <BannerImg image={image} alt={alt} reduce={reduce} className="h-64 w-full object-cover sm:h-72" />
              {Icon && (
                <span className="absolute bottom-4 right-4 rounded-[10px] border border-[rgba(255,255,255,0.2)] bg-[rgba(7,9,15,0.6)] p-3 text-[#d8b95a] backdrop-blur-sm" aria-hidden="true">
                  <Icon className="h-6 w-6" />
                </span>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (variant === "center") {
    return (
      <header className="relative min-h-[460px] overflow-hidden border-b border-border bg-[#07090f]" data-testid={testid}>
        <BannerImg image={image} alt={alt} reduce={reduce} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(7,9,15,0.55) 0%, rgba(7,9,15,0.88) 100%)" }} aria-hidden="true" />
        <svg aria-hidden="true" className="anim-pulse absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" width="640" height="640" viewBox="0 0 640 640" fill="none">
          {[300, 220, 140].map((r) => (
            <circle key={r} cx="320" cy="320" r={r} stroke="#c9a84c" strokeOpacity="0.22" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="relative flex min-h-[460px] flex-col items-center justify-center px-4 py-20">
          <BannerText {...text} onPhoto center />
        </div>
      </header>
    );
  }

  if (variant === "slim") {
    return (
      <header className="border-b border-border bg-surface" data-testid={testid}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-10 px-4 py-14 sm:px-6">
          <BannerText {...text} small />
          <div className="relative hidden h-44 w-72 rotate-2 overflow-hidden rounded-[10px] border border-border shadow-xl sm:block">
            <BannerImg image={image} alt={alt} reduce={reduce} className="h-full w-full object-cover" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="relative overflow-hidden border-b border-border bg-[#07090f]" data-testid={testid}>
      <BannerImg image={image} alt={alt} reduce={reduce} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgba(7,9,15,0.93) 10%, rgba(7,9,15,0.62) 50%, rgba(7,9,15,0.3) 100%)" }} aria-hidden="true" />
      {Icon && (
        <span className="anim-float absolute bottom-10 right-8 hidden rounded-[10px] border border-[rgba(255,255,255,0.2)] bg-[rgba(7,9,15,0.45)] p-4 text-[#d8b95a] backdrop-blur-sm md:block" aria-hidden="true">
          <Icon className="h-8 w-8" />
        </span>
      )}
      <div className="relative mx-auto flex min-h-[400px] w-full max-w-6xl flex-col justify-end px-4 pb-14 pt-36 sm:px-6">
        <BannerText {...text} onPhoto />
      </div>
    </header>
  );
}

export function TypeBanner({ eyebrow, title, intro, ghost, testid, ghostVariant = "corner" }) {
  return (
    <header className="relative overflow-hidden border-b border-border bg-surface" data-testid={testid}>
      {ghost && ghostVariant === "vertical" && (
        <span aria-hidden="true" style={{ writingMode: "vertical-rl" }} className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 select-none text-[3.4rem] font-bold uppercase tracking-[0.28em] text-gold/[0.12] lg:block">
          {ghost}
        </span>
      )}
      {ghost && ghostVariant === "outline" && (
        <span aria-hidden="true" style={{ WebkitTextStroke: "1.5px var(--c-gold)" }} className="pointer-events-none absolute -bottom-14 right-0 hidden select-none text-[9rem] font-bold uppercase leading-none tracking-tight text-transparent opacity-30 xl:block">
          {ghost}
        </span>
      )}
      {ghost && ghostVariant === "corner" && (
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-14 right-0 hidden select-none text-[9rem] font-bold uppercase leading-none tracking-tight text-gold/[0.08] xl:block">
          {ghost}
        </span>
      )}
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>}
      </div>
    </header>
  );
}

export function FeatureCard({ icon: Icon, title, text, testid }) {
  return (
    <article className="card p-6 transition-colors hover:border-gold/50" data-testid={testid}>
      {Icon && (
        <span className="inline-flex rounded-[7px] bg-surface-3 p-2.5 text-gold-text" aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </article>
  );
}

export function CheckList({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-body">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ApplyCta({ path, children, variant = "primary", testid }) {
  const { lang } = useI18n();
  const apply = applyUrl(lang, path);
  return (
    <a
      href={apply.href}
      data-testid={testid}
      className={variant === "primary" ? "btn-primary" : "btn-outline"}
      {...(apply.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

export function CtaBand({ title, text, buyLabel, bringLabel }) {
  return (
    <Section>
      <Reveal>
        <div className="card relative overflow-hidden bg-surface-2 px-6 py-14 text-center sm:px-12">
          <div className="anim-pulse pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border-[22px] border-gold/15" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rotate-45 border-[18px] border-gold/10" aria-hidden="true" />
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{text}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ApplyCta path="purchase" testid="cta-buy">{buyLabel}</ApplyCta>
            <ApplyCta path="refinance" variant="outline" testid="cta-bring">{bringLabel}</ApplyCta>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

export function HeroArt() {
  return (
    <svg viewBox="0 0 480 360" className="h-auto w-full" role="img" aria-hidden="true" data-testid="hero-art">
      <defs>
        <linearGradient id="heroBar" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="var(--c-gold)" stopOpacity="0.25" />
          <stop offset="1" stopColor="var(--c-gold)" />
        </linearGradient>
      </defs>
      {[60, 120, 180, 240, 300].map((y) => (
        <line key={y} x1="0" y1={y} x2="480" y2={y} stroke="var(--c-border)" strokeWidth="1" />
      ))}
      {[80, 160, 240, 320, 400].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="360" stroke="var(--c-border)" strokeWidth="1" />
      ))}
      <path d="M120 200 L240 96 L360 200" fill="none" stroke="var(--c-cream)" strokeWidth="3" strokeLinejoin="round" />
      <rect x="140" y="200" width="200" height="120" fill="none" stroke="var(--c-cream)" strokeWidth="3" />
      <rect x="168" y="292" width="22" height="28" fill="url(#heroBar)" rx="3" className="anim-bar" />
      <rect x="206" y="264" width="22" height="56" fill="url(#heroBar)" rx="3" className="anim-bar" style={{ animationDelay: "0.15s" }} />
      <rect x="244" y="232" width="22" height="88" fill="url(#heroBar)" rx="3" className="anim-bar" style={{ animationDelay: "0.3s" }} />
      <rect x="282" y="196" width="22" height="124" fill="url(#heroBar)" rx="3" className="anim-bar" style={{ animationDelay: "0.45s" }} />
      <path d="M160 268 L228 224 L296 176 L344 128" fill="none" stroke="var(--c-gold)" strokeWidth="2.5" strokeLinecap="round" className="anim-draw" />
      <circle cx="344" cy="128" r="5" fill="var(--c-gold)" />
      <rect x="56" y="40" width="92" height="52" rx="7" fill="none" stroke="var(--c-gold)" strokeWidth="2" className="anim-float" />
      <line x1="70" y1="58" x2="134" y2="58" stroke="var(--c-gold)" strokeWidth="3" strokeLinecap="round" />
      <line x1="70" y1="74" x2="112" y2="74" stroke="var(--c-border-strong)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="408" cy="296" r="34" fill="none" stroke="var(--c-gold)" strokeWidth="2" strokeOpacity="0.6" className="anim-pulse" />
      <circle cx="408" cy="296" r="18" fill="none" stroke="var(--c-border-strong)" strokeWidth="2" />
    </svg>
  );
}
