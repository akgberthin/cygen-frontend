import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera } from "lucide-react";
import Seo from "../components/Seo";
import { CtaBand, Reveal, Section, TypeBanner } from "../components/Shared";
import { useI18n } from "../i18n/I18nContext";

const CATEGORY_ORDER = ["executive", "marketing", "admin", "advisors", "investors"];
const TINTS = ["var(--c-gold)", "var(--c-blue)", "var(--c-green)"];

function initials(role) {
  return role.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function AvatarPlaceholder({ role, tint, large }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full border-2 border-dashed ${large ? "h-20 w-20" : "h-14 w-14"}`}
      style={{ borderColor: tint, background: "var(--c-surface3)", color: tint }}
      aria-hidden="true"
    >
      <span className="text-lg font-bold">{initials(role)}</span>
      <span className="absolute -bottom-1 -right-1 rounded-full border border-border bg-surface p-1 text-dim">
        <Camera className="h-3 w-3" />
      </span>
    </span>
  );
}

function MemberCard({ member, tint, i, testid }) {
  const { t } = useI18n();
  return (
    <article className="card w-44 p-4 text-center shadow-xl" data-testid={testid}>
      <div className="anim-float mx-auto w-fit" style={{ animationDelay: `${i * 0.5}s` }}>
        <AvatarPlaceholder role={member.role} tint={tint} />
      </div>
      <h3 className="mt-3 text-sm font-semibold leading-snug">{member.role}</h3>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-dim">{t("team.nameTbd")}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{member.focus}</p>
    </article>
  );
}

function BrandMark({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="9" fill="var(--c-surface3)" stroke="var(--c-gold)" strokeOpacity="0.45" />
      <path d="M28.5 13.5a9.5 9.5 0 1 0 0 13" stroke="var(--c-gold)" strokeWidth="4.4" fill="none" strokeLinecap="round" />
      <circle cx="28.5" cy="20" r="2.2" fill="var(--c-gold)" />
    </svg>
  );
}

function PileCard({ top }) {
  const { t } = useI18n();
  return (
    <div className={`card flex h-60 w-44 flex-col items-center justify-center gap-3 border-gold/25 bg-surface-2 shadow-2xl ${top ? "" : "opacity-90"}`}>
      <BrandMark className={top ? "h-11 w-11" : "h-9 w-9 opacity-50"} />
      {top && (
        <p className="px-5 text-center text-xs font-medium leading-relaxed text-muted-foreground">{t("team.pickCategory")}</p>
      )}
    </div>
  );
}

/* Idle state (no category chosen): one stacked deck of cards. */
function CardPile() {
  const reduce = useReducedMotion();
  const offsets = [-12, -7, -2, 3, 8, 13];
  return (
    <div className="relative mx-auto h-[400px] w-full max-w-md" data-testid="team-pile">
      {offsets.map((deg, i) => {
        const top = i === offsets.length - 1;
        return (
          <motion.div
            key={deg}
            className="absolute left-1/2 top-20"
            style={{ x: "-50%", zIndex: i }}
            initial={reduce ? false : { opacity: 0, y: 160, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: deg }}
            transition={{ type: "spring", stiffness: 110, damping: 15, delay: reduce ? 0 : i * 0.06 }}
          >
            <div className={top && !reduce ? "anim-float" : undefined}>
              <PileCard top={top} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* The deck stays at the center of the circle while a category is open. */
function MiniPile() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="relative h-40 w-32"
      data-testid="team-center-pile"
      initial={reduce ? false : { opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 15 }}
    >
      {[-8, 0, 8].map((deg, i) => (
        <div key={deg} className="absolute inset-0" style={{ transform: `rotate(${deg}deg)`, zIndex: i }}>
          <div className={`card flex h-40 w-32 items-center justify-center border-gold/25 bg-surface-2 shadow-2xl ${i === 2 && !reduce ? "anim-float" : ""}`}>
            <BrandMark className={i === 2 ? "h-9 w-9" : "h-8 w-8 opacity-50"} />
          </div>
        </div>
      ))}
    </motion.div>
  );
}

/* Category open: dashed concentric circles; member cards fly out of the center
   pile onto the rings (extra rings appear when one fills up); switching category
   recalls the old set into the pile before the new set flies out. */
function CircleStage({ category }) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const stageRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const members = t(`team.categories.${category}.members`);
  const n = members.length;
  const narrow = width > 0 && width < 680;

  const R1 = Math.max(180, Math.min(250, width * 0.23));
  const RING_GAP = 200;
  const CARD_ARC = 215; // px of circumference reserved per card

  // Deal members onto rings: fill ring 1, then create another circle, etc.
  const rings = [];
  let dealt = 0;
  while (dealt < n) {
    const radius = R1 + rings.length * RING_GAP;
    const cap = Math.max(3, Math.floor((2 * Math.PI * radius) / CARD_ARC));
    const take = Math.min(cap, n - dealt);
    rings.push({ radius, count: take, start: dealt });
    dealt += take;
  }
  const stageH = Math.round(2 * (rings[rings.length - 1].radius + 122) + 40);

  if (narrow) {
    return (
      <div ref={stageRef} data-testid="team-circle">
        <div key={category} className="grid grid-cols-2 gap-4">
          {members.map((m, i) => (
            <motion.div
              key={m.role}
              initial={reduce ? false : { opacity: 0, y: 70, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 130, damping: 15, delay: reduce ? 0 : i * 0.08 }}
            >
              <MemberCard member={m} tint={TINTS[i % 3]} i={i} testid={`team-member-card-${i}`} />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={stageRef} className="relative" style={{ height: stageH }} data-testid="team-circle">
      {width > 0 && (
        <>
          {/* dashed circle guides, one per ring, slowly turning */}
          <motion.svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 mx-auto"
            width={width}
            height={stageH}
            initial={reduce ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <g className="anim-spin-slow" style={{ transformOrigin: `${width / 2}px ${stageH / 2}px` }}>
              {rings.map((ring, k) => (
                <circle
                  key={k}
                  cx={width / 2}
                  cy={stageH / 2}
                  r={ring.radius}
                  fill="none"
                  stroke={TINTS[k % 3]}
                  strokeOpacity="0.3"
                  strokeWidth="1.5"
                  strokeDasharray="4 8"
                />
              ))}
            </g>
          </motion.svg>

          {/* the deck remains in the middle */}
          <div className="absolute left-1/2 top-1/2" style={{ transform: "translate(-50%, -50%)" }}>
            <MiniPile />
          </div>

          {/* cards fly out of the pile onto their ring; the previous set flies back first */}
          <AnimatePresence mode="sync">
            {rings.flatMap((ring, k) =>
              Array.from({ length: ring.count }, (_, j) => {
                const g = ring.start + j;
                const m = members[g];
                const angle = -Math.PI / 2 + (2 * Math.PI * j) / ring.count + (k % 2 ? Math.PI / ring.count : 0);
                const dx = ring.radius * Math.cos(angle);
                const dy = ring.radius * Math.sin(angle);
                return (
                  <div
                    key={`${category}-${m.role}`}
                    className="absolute left-1/2 top-1/2"
                    style={{ transform: "translate(-50%, -50%)", zIndex: 10 + g }}
                  >
                    <motion.div
                      initial={reduce ? false : { x: 0, y: 0, scale: 0.35, opacity: 0 }}
                      animate={{ x: dx, y: dy, scale: 1, opacity: 1 }}
                      exit={reduce ? undefined : { x: 0, y: 0, scale: 0.35, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 110, damping: 15, delay: reduce ? 0 : 0.15 + g * 0.08 }}
                    >
                      <MemberCard member={m} tint={TINTS[g % 3]} i={g} testid={`team-member-card-${g}`} />
                    </motion.div>
                  </div>
                );
              })
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default function Team() {
  const { t } = useI18n();
  const [category, setCategory] = useState(null);

  return (
    <>
      <Seo pageKey="team" />
      <TypeBanner eyebrow="CYGEN" title={t("team.title")} intro={t("team.intro")} ghost={t("nav.team")} testid="banner-team" />

      <Section>
        <Reveal>
          <p className="mx-auto max-w-2xl rounded-[10px] border border-gold/30 bg-surface-2 px-5 py-4 text-center text-sm text-muted-foreground" data-testid="team-note">
            {t("team.note")}
          </p>
        </Reveal>

        <p className="mt-12 text-center text-sm text-muted-foreground">{t("team.pickCategory")}</p>
        <div role="tablist" aria-label={t("team.title")} className="mt-4 flex flex-wrap justify-center gap-2">
          {CATEGORY_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={category === key}
              data-testid={`team-tab-${key}`}
              onClick={() => setCategory(category === key ? null : key)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                category === key
                  ? "border-gold bg-gold text-ink"
                  : "border-input text-body hover:border-gold hover:text-gold-text"
              }`}
            >
              {t(`team.categories.${key}.label`)}
            </button>
          ))}
        </div>

        {category && <h2 className="sr-only">{t(`team.categories.${category}.label`)}</h2>}
        <div className="mt-10">
          {category ? <CircleStage category={category} /> : <CardPile />}
        </div>
      </Section>

      <CtaBand title={t("home.cta.title")} text={t("home.cta.text")} buyLabel={t("home.cta.buy")} bringLabel={t("home.cta.bring")} />
    </>
  );
}
