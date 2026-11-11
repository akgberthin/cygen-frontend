import React from "react";
import { useI18n } from "../i18n/I18nContext";

const BARS = [26, 34, 43, 52, 62, 72, 84, 96, 109, 122, 136, 150];

export default function EquityEngine() {
  const { t } = useI18n();

  return (
    <div className="card h-full bg-surface-2 p-6 sm:p-8" data-testid="equity-engine">
      <p className="text-sm font-semibold text-cream">{t("home.engine.splitTitle")}</p>
      <div className="mt-3 flex h-11 w-full overflow-hidden rounded-[7px] border border-border" role="img" aria-label={t("home.engine.splitTitle")}>
        <div className="h-full" style={{ width: "38%", background: "var(--c-blue)", opacity: 0.85 }} />
        <div className="h-full" style={{ width: "62%", background: "var(--c-gold)" }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <span className="flex items-center gap-2 text-body">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--c-blue)" }} aria-hidden="true" />
          {t("home.engine.copPart")}
        </span>
        <span className="flex items-center gap-2 text-body">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--c-gold)" }} aria-hidden="true" />
          {t("home.engine.equityPart")}
        </span>
      </div>

      <p className="mt-9 text-sm font-semibold text-cream">{t("home.engine.chartTitle")}</p>
      <svg viewBox="0 0 520 210" className="mt-3 w-full" role="img" aria-label={t("home.engine.chartTitle")}>
        <line x1="16" y1="172" x2="508" y2="172" stroke="var(--c-border-strong)" strokeWidth="1.5" />
        {BARS.map((h, i) => (
          <rect
            key={i}
            x={30 + i * 40}
            y={172 - h}
            width="24"
            height={h}
            rx="4"
            fill="var(--c-gold)"
            fillOpacity={0.35 + (i / BARS.length) * 0.65}
            className="anim-bar"
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}
        <line x1="252" y1="18" x2="252" y2="172" stroke="var(--c-blue)" strokeWidth="1.5" strokeDasharray="5 5" />
        <text x="260" y="30" fill="var(--c-blue)" fontSize="12" fontWeight="600">
          {t("home.engine.revisionMark")}
        </text>
        <text x="456" y="196" fill="var(--c-dim)" fontSize="11">
          {t("home.engine.monthsLabel")}
        </text>
      </svg>
      <p className="mt-3 text-xs text-dim">{t("home.engine.note")}</p>
    </div>
  );
}
