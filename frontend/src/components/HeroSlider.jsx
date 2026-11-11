import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { IMAGES } from "../lib/images";
import { applyUrl } from "../lib/links";

const SLIDE_PATHS = [null, "purchase", "refinance"];
const HERO_MEDIA = [
  { type: "image", src: IMAGES.hero1 },
  { type: "image", src: IMAGES.hero2 },
  { type: "image", src: IMAGES.hero3 },
];

const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-[7px] border border-[rgba(255,255,255,0.65)] bg-transparent px-5 py-2.5 text-sm font-semibold text-[#edeae0] transition-colors hover:border-[#c9a84c] hover:text-[#d8b95a]";

function HeroLink({ path, label, variant, testid }) {
  const { lang } = useI18n();
  const apply = applyUrl(lang, path);
  return (
    <a
      href={apply.href}
      data-testid={testid}
      className={variant === "primary" ? "btn-primary" : ghostBtn}
      {...(apply.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

/* Kinetic on-load moment: each word rises out of an overflow mask, staggered. */
function MaskedWords({ text, reduce }) {
  const words = String(text).split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block will-change-transform"
            initial={reduce ? false : { y: "112%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 0.75, delay: 0.18 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </>
  );
}

export default function HeroSlider() {
  const { t } = useI18n();
  const slides = t("home.slides");
  const alts = t("home.slideAlts");
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const mediaY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "26%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  useEffect(() => {
    if (reduce || paused) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(id);
  }, [reduce, paused, slides.length]);

  const go = useCallback((i) => setIndex(((i % slides.length) + slides.length) % slides.length), [slides.length]);
  const slide = slides[index];
  const media = HERO_MEDIA[index];
  const path = SLIDE_PATHS[index];

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="CYGEN"
      data-testid="hero-slider"
      className="relative overflow-hidden border-b border-border bg-[#07090f]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <motion.div className="absolute inset-0" style={reduce ? undefined : { y: mediaY }}>
        <AnimatePresence mode="sync">
          <motion.div
            key={index}
            className="absolute -top-[12%] left-0 h-[124%] w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 1.1, ease: "easeInOut" }}
          >
            <motion.img
              src={media.src}
              alt={alts[index] || ""}
              loading="eager"
              className="h-full w-full object-cover"
              initial={false}
              animate={reduce ? { scale: 1 } : { scale: [1.02, 1.09] }}
              transition={{ duration: 8, ease: "linear" }}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(7,9,15,0.94) 0%, rgba(7,9,15,0.6) 45%, rgba(7,9,15,0.35) 100%)" }}
        aria-hidden="true"
      />

      <motion.div
        className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl flex-col justify-end px-4 pb-16 pt-32 sm:px-6"
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} / ${slides.length}`}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.p
              className="eyebrow !text-[#d8b95a]"
              data-testid="hero-eyebrow"
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              {slide.eyebrow}
            </motion.p>
            <p className="mt-5 max-w-4xl text-4xl font-bold leading-[1.04] tracking-tight text-[#edeae0] sm:text-6xl lg:text-7xl" data-testid="hero-title">
              <MaskedWords text={slide.title} reduce={reduce} />
            </p>
            <motion.p
              className="mt-7 max-w-xl text-lg leading-relaxed text-[#cdd5de]"
              initial={reduce ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              {slide.text}
            </motion.p>
            <motion.div
              className="mt-10 flex flex-col gap-3 sm:flex-row"
              initial={reduce ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {index === 0 ? (
                <>
                  <HeroLink path="purchase" label={t("home.hero.ctaBuy")} variant="primary" testid="hero-cta-buy" />
                  <HeroLink path="refinance" label={t("home.hero.ctaBring")} variant="ghost" testid="hero-cta-bring" />
                </>
              ) : (
                <HeroLink path={path} label={slide.cta} variant="primary" testid={`hero-cta-${path}`} />
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
        <p className="mt-9 max-w-xl text-xs text-[#a0b1c4]">{t("home.hero.note")}</p>

        <div className="mt-10 flex items-center gap-4">
          <div className="flex gap-2">
            <button type="button" data-testid="hero-prev" aria-label={t("home.slider.prev")} onClick={() => go(index - 1)} className="rounded-full border border-[rgba(255,255,255,0.5)] p-2 text-[#edeae0] transition-colors hover:border-[#c9a84c] hover:text-[#d8b95a]">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" data-testid="hero-next" aria-label={t("home.slider.next")} onClick={() => go(index + 1)} className="rounded-full border border-[rgba(255,255,255,0.5)] p-2 text-[#edeae0] transition-colors hover:border-[#c9a84c] hover:text-[#d8b95a]">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <button
                key={i}
                type="button"
                data-testid={`hero-dot-${i}`}
                aria-label={`${t("home.slider.goTo")} ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${i === index ? "w-7 bg-[#c9a84c]" : "w-2 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
