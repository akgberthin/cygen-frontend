import React, { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Link2, Plus, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SectionTitle } from "./Shared";
import { useI18n } from "../i18n/I18nContext";
import { apiFetch, apiPath } from "../lib/api";
import { applyUrl } from "../lib/links";

/* COP = cost of capital ONLY: a simple, non-compounding charge on the General
   Partner's remaining capital (remaining x annual COP rate / 12, to the cent).
   The only required monthly payment is the COP; Equity is optional but strongly
   advised. The COP in force is fixed for an adjustment window and re-sized from
   the remaining GP capital at the start of month cadence+1, 2*cadence+1, ...
   Mirror of backend/compare.py — the pytest check numbers are the contract. */
const HORIZON = 1200;

const cents = (x) => Math.round((x + 1e-9) * 100) / 100;

function project(homeValue, equityPct, ratePct, cadence, extraMonthly, extraStart, extraEnd, oneTimes) {
  const one = {};
  (oneTimes || []).forEach(({ month, amount }) => {
    const m = Math.max(1, Math.round(month));
    one[m] = (one[m] || 0) + amount;
  });
  const gp0 = homeValue * (1 - equityPct / 100);
  let balance = gp0;
  let cop = cents((balance * ratePct) / 1200);
  const firstCop = cop;
  const adjustments = [];
  let month = 0;
  let equityWindow = 0;
  let windowStart = balance;
  let totalCop = 0;
  let equityPaid = 0;
  while (balance > 0.004 && month < HORIZON) {
    month += 1;
    if (month > 1 && (month - 1) % cadence === 0) {
      const newCop = cents((balance * ratePct) / 1200);
      adjustments.push({
        month, gpBefore: cents(windowStart), gpAfter: cents(balance),
        copBefore: cop, copAfter: newCop, change: cents(newCop - cop), equityInWindow: cents(equityWindow),
      });
      cop = newCop;
      equityWindow = 0;
      windowStart = balance;
    }
    totalCop += cop;
    let equity = 0;
    if (extraMonthly > 0 && month >= extraStart && (!extraEnd || month <= extraEnd)) equity += extraMonthly;
    equity += one[month] || 0;
    equity = Math.min(equity, balance);
    balance -= equity;
    equityWindow += equity;
    equityPaid += equity;
  }
  const completedMonth = balance <= 0.004 ? month : null;
  return {
    gpCapital: cents(gp0),
    firstCop,
    adjustments,
    completedMonth,
    months: month,
    ownershipPct: homeValue ? Math.round(((homeValue - balance) / homeValue) * 10000) / 100 : 0,
    totalCop: completedMonth ? cents(totalCop) : null,
    totalPaid: completedMonth ? cents(gp0 + totalCop) : null,
    buildsEquity: extraMonthly > 0 || (oneTimes || []).length > 0,
  };
}

function useAnimatedNumber(value, reduce) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (!Number.isFinite(value) || reduce) {
      prev.current = value;
      setDisplay(value);
      return undefined;
    }
    const start = Number.isFinite(prev.current) ? prev.current : value;
    const controls = animate(start, value, { duration: 0.45, ease: "easeOut", onUpdate: setDisplay });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce]);
  return display;
}

function SliderRow({ label, value, min, max, step, onChange, prefix, suffix, testid }) {
  const clamp = (v) => Math.min(max, Math.max(min, Number.isNaN(v) ? min : v));
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium text-cream">{label}</span>
        <span className="flex items-center gap-1 font-bold tabular-nums text-gold-text">
          {prefix}
          <input
            type="number" inputMode="numeric" min={min} max={max} step={step} value={value}
            onChange={(e) => onChange(clamp(Number(e.target.value)))}
            className="w-24 rounded-[5px] border border-transparent bg-transparent px-1 py-0.5 text-right font-bold text-gold-text transition-colors hover:border-input focus:border-gold focus:outline-none"
            data-testid={`${testid}-input`}
          />
          {suffix}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(clamp(Number(e.target.value)))} className="mt-2 w-full accent-[#c9a84c]" data-testid={testid} />
    </label>
  );
}

function Money({ value, className = "", testid }) {
  const { lang } = useI18n();
  const reduce = useReducedMotion();
  const n = useAnimatedNumber(value, reduce);
  const fmt = new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  return (
    <span className={`tabular-nums ${className}`} data-testid={testid}>
      {Number.isFinite(n) ? fmt.format(Math.round(n * 100) / 100) : "—"}
    </span>
  );
}

function ResultCard({ title, rows, bar, highlight, testid, children }) {
  return (
    <article className={`card flex h-full flex-col p-6 ${highlight ? "border-gold/60 bg-surface-2" : ""}`} data-testid={testid}>
      <h3 className={`text-sm font-semibold uppercase tracking-[0.14em] ${highlight ? "text-gold-text" : "text-muted-foreground"}`}>{title}</h3>
      <dl className="mt-5 flex-1 space-y-4">
        {rows.map(({ label, value, text, strong, tone }) => (
          <div key={label} className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className={`text-right ${strong ? "text-xl font-bold" : "text-base font-semibold"} ${tone || "text-cream"}`}>
              {text !== undefined ? <span className="tabular-nums">{text}</span> : <Money value={value} />}
            </dd>
          </div>
        ))}
      </dl>
      {children}
      {bar && (
        <div className="mt-6">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
            <div className="h-full bg-[#edeae0] opacity-70 transition-[width] duration-500" style={{ width: `${bar.principalPct}%` }} />
            <div className={`h-full transition-[width] duration-500 ${highlight ? "bg-gold" : "bg-[#d05050]"}`} style={{ width: `${bar.costPct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-dim">
            <span>{bar.principalLabel}</span>
            <span>{bar.costLabel}</span>
          </div>
        </div>
      )}
    </article>
  );
}

export default function ComparisonCalculator() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const numParam = (k, d) => {
    const raw = params.get(k);
    if (raw === null) return d;
    const v = Number(raw);
    return Number.isFinite(v) && v >= 0 ? v : d;
  };

  const [price, setPrice] = useState(() => numParam("price", 300000));
  const [share, setShare] = useState(() => numParam("share", 10));
  const [years, setYears] = useState(() => numParam("years", 30));
  const [rate, setRate] = useState(() => numParam("rate", 7));
  const [cadence, setCadence] = useState(() => (params.get("cadence") === "12" ? 12 : 6));
  const [extraMonthly, setExtraMonthly] = useState(() => numParam("ex", 0));
  const [extraStart, setExtraStart] = useState(() => Math.max(1, numParam("es", 1)));
  const [extraEnd, setExtraEnd] = useState(() => numParam("ee", 0)); // 0 = no end month
  const [oneTimes, setOneTimes] = useState(() =>
    (params.get("ot") || "").split(",").filter(Boolean).map((p) => {
      const [m, a] = p.split(":").map(Number);
      return Number.isFinite(m) && Number.isFinite(a) ? { month: m, amount: a } : null;
    }).filter(Boolean).slice(0, 12)
  );
  const [oneMonth, setOneMonth] = useState(12);
  const [oneAmount, setOneAmount] = useState(5000);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  const down = price * (share / 100);
  const funded = price - down;
  const r = rate / 100 / 12;

  const proj = project(price, share, rate, cadence, extraMonthly, extraStart, extraEnd || null, oneTimes);

  // Traditional mortgage: level monthly payment on price minus down payment.
  const months = years * 12;
  const mMonthly = months > 0 && r > 0 ? (funded * r * (1 + r) ** months) / ((1 + r) ** months - 1) : funded / Math.max(months, 1);
  const mTotal = mMonthly * months;
  const mCost = mTotal - funded;

  const completed = proj.completedMonth !== null;
  const difference = completed ? Math.max(mTotal - proj.totalPaid, 0) : 0;
  const maxTotal = Math.max(mTotal, completed ? proj.totalPaid : 0, 1);

  const fmtMoney = new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
  const money = (v) => fmtMoney.format(v);
  const monthWord = t("home.compare.monthUnit");

  const figures = {
    path: "purchase",
    home_value: price,
    equity_in_pct: share,
    amount: proj.gpCapital,
    cop: proj.firstCop,
    cop_rate_pct: rate,
    cadence_months: cadence,
    equity_payment: extraMonthly,
    extra_start: extraStart,
    extra_end: extraEnd || 0,
    one_time_count: oneTimes.length,
    one_time_total: cents(oneTimes.reduce((s, o) => s + o.amount, 0)),
    ownership_pct: proj.ownershipPct,
    completion_months: proj.completedMonth || 0,
    total_cop: proj.totalCop || 0,
    mortgage_years: years,
    mortgage_monthly: cents(mMonthly),
    mortgage_interest: cents(mCost),
    difference: cents(difference),
  };

  function sessionId() {
    let s = sessionStorage.getItem("cygen_session");
    if (!s) {
      s = window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : `s${Date.now()}${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem("cygen_session", s);
    }
    return s;
  }

  async function startWithNumbers() {
    if (starting) return;
    setStarting(true);
    const apply = applyUrl(lang, "purchase");
    try {
      const res = await apiFetch(apiPath.scenarios, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          path: "purchase",
          page: window.location.pathname,
          referrer: document.referrer || "",
          campaign: new URLSearchParams(window.location.search).get("utm_campaign") || "",
          session: sessionId(),
          figures,
        }),
      });
      const body = res.ok ? await res.json() : {};
      sessionStorage.setItem("cygen_scenario", JSON.stringify({ id: body.id || null, session: sessionId(), language: lang, path: "purchase", figures }));
    } catch (e) {
      sessionStorage.setItem("cygen_scenario", JSON.stringify({ id: null, session: sessionId(), language: lang, path: "purchase", figures }));
    }
    const target = apply.external
      ? (() => { const u = new URL(apply.href); u.searchParams.set("price", String(price)); u.searchParams.set("share", String(share)); return u.toString(); })()
      : `${apply.href}&price=${price}&share=${share}`;
    if (apply.external) window.location.href = target;
    else navigate(target);
  }

  const copyLink = async () => {
    const ot = oneTimes.map((o) => `${o.month}:${o.amount}`).join(",");
    const url = `${window.location.origin}/${lang}?price=${price}&share=${share}&years=${years}&rate=${rate}&cadence=${cadence}&ex=${extraMonthly}&es=${extraStart}&ee=${extraEnd}${ot ? `&ot=${ot}` : ""}#compare`;
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      window.prompt(url, url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const quickChoice = (pct) => {
    setExtraMonthly(cents(proj.firstCop * pct));
    setExtraStart(1);
    setExtraEnd(0);
  };

  return (
    <div data-testid="compare-calculator">
      <SectionTitle title={t("home.compare.title")} subtitle={t("home.compare.subtitle")} />

      <div className="card mt-10 bg-surface-2 p-6 sm:p-10">
        <div className="grid gap-x-8 gap-y-7 lg:grid-cols-3">
          <SliderRow label={t("home.compare.price")} value={price} min={120000} max={900000} step={5000} onChange={setPrice} prefix="$" testid="compare-price" />
          <SliderRow label={t("home.compare.share")} value={share} min={0} max={90} step={5} onChange={setShare} suffix="%" testid="compare-share" />
          <SliderRow label={t("home.compare.rate")} value={rate} min={2} max={12} step={0.25} onChange={setRate} suffix="%" testid="compare-rate" />
          <SliderRow label={t("home.compare.years")} value={years} min={5} max={30} step={1} onChange={setYears} suffix={t("home.compare.yearsUnit")} testid="compare-years" />
          <label className="block">
            <span className="block text-sm font-medium text-cream">{t("home.compare.cadence")}</span>
            <select
              value={cadence}
              onChange={(e) => setCadence(Number(e.target.value))}
              className="input mt-2 w-full"
              data-testid="compare-cadence"
            >
              <option value={6}>{t("home.compare.cadence6")}</option>
              <option value={12}>{t("home.compare.cadence12")}</option>
            </select>
          </label>
        </div>

        {/* Additional payments simulator */}
        <div className="mt-10 rounded-[10px] border border-gold/30 bg-surface p-5 sm:p-7" data-testid="compare-simulator">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-gold-text">{t("home.compare.simTitle")}</h3>
          <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-cream">{t("home.compare.extraMonthly")}</span>
              <span className="mt-1 flex items-center gap-1">
                <span className="text-gold-text font-bold">$</span>
                <input type="number" min={0} max={100000} step={25} value={extraMonthly} onChange={(e) => setExtraMonthly(Math.max(0, Number(e.target.value) || 0))} className="input w-full" data-testid="compare-extra" />
                <span className="text-sm text-dim">{t("home.compare.perMo")}</span>
              </span>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-cream">{t("home.compare.fromMonth")}</span>
              <input type="number" min={1} max={HORIZON} value={extraStart} onChange={(e) => setExtraStart(Math.max(1, Number(e.target.value) || 1))} className="input mt-1 w-full" data-testid="compare-extra-start" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-cream">
                {t("home.compare.untilMonth")} <span className="text-dim">({t("home.compare.optionalTag")})</span>
              </span>
              <input type="number" min={0} max={HORIZON} value={extraEnd} onChange={(e) => setExtraEnd(Math.max(0, Number(e.target.value) || 0))} className="input mt-1 w-full" data-testid="compare-extra-end" placeholder="0" />
            </label>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-dim" data-testid="compare-quick">
            {t("home.compare.quickLabel")}
            {[0.1, 0.25, 0.5, 1].map((p) => (
              <button key={p} type="button" onClick={() => quickChoice(p)} className="rounded-full border border-gold/40 px-3 py-1 text-xs font-semibold text-gold-text transition-colors hover:bg-gold hover:text-ink" data-testid={`compare-quick-${p * 100}`}>
                +{p * 100}% {t("home.compare.quickSuffix")}
              </button>
            ))}
          </p>

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <span className="block text-sm font-medium text-cream">{t("home.compare.oneTimeTitle")}</span>
                <span className="text-[11px] text-dim">{t("home.compare.maxRowsNote")}</span>
              </div>
              <label className="flex items-center gap-1 text-sm">
                <span className="text-muted-foreground">{t("home.compare.colMonthOne")}</span>
                <input type="number" min={1} max={HORIZON} value={oneMonth} onChange={(e) => setOneMonth(Math.max(1, Number(e.target.value) || 1))} className="input w-20" data-testid="compare-onetime-month" />
              </label>
              <label className="flex items-center gap-1 text-sm">
                <span className="text-muted-foreground">{t("home.compare.colAmount")}</span>
                <input type="number" min={1} step={100} value={oneAmount} onChange={(e) => setOneAmount(Math.max(1, Number(e.target.value) || 0))} className="input w-28" data-testid="compare-onetime-amount" />
              </label>
              <button
                type="button"
                className="btn-outline !px-3 !py-2"
                disabled={oneTimes.length >= 12}
                onClick={() => setOneTimes((rows) => (rows.length >= 12 ? rows : [...rows, { month: oneMonth, amount: oneAmount }]))}
                data-testid="compare-onetime-add"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t("home.compare.addOneTime")}
              </button>
            </div>
            {oneTimes.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" data-testid="compare-onetime-list">
                {oneTimes.map((o, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-body">
                    {monthWord} {o.month} · {money(o.amount)}
                    <button type="button" aria-label={t("home.compare.removeAria")} className="text-dim transition-colors hover:text-[#e06666]" onClick={() => setOneTimes((rows) => rows.filter((_, j) => j !== i))} data-testid={`compare-onetime-remove-${i}`}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <ResultCard
            title={t("home.compare.mortgageTitle")}
            testid="compare-mortgage"
            rows={[
              { label: t("home.compare.downPayment"), value: down },
              { label: t("home.compare.financed"), value: funded },
              { label: t("home.compare.monthlyFixed"), value: mMonthly, strong: true },
              { label: `${t("home.compare.totalPaid")} · ${years} ${t("home.compare.yearsUnit")}`, value: mTotal },
              { label: t("home.compare.bankKeeps"), value: mCost, tone: "text-[#e06666]" },
            ]}
            bar={{
              principalPct: (funded / maxTotal) * 100,
              costPct: (mCost / maxTotal) * 100,
              principalLabel: t("home.compare.legendHome"),
              costLabel: t("home.compare.bankKeeps"),
            }}
          />
          <ResultCard
            title={t("home.compare.cygenTitle")}
            testid="compare-cygen"
            highlight
            rows={[
              { label: t("home.compare.requiredCop"), value: proj.firstCop, strong: true },
              { label: t("home.compare.ownershipNow"), text: `${proj.ownershipPct}%`, tone: "text-gold-text" },
              { label: t("home.compare.monthsToFull"), text: completed ? `${proj.completedMonth}` : t("home.compare.notWithin"), strong: true, tone: "text-gold-text" },
              { label: t("home.compare.totalPaid"), value: proj.totalPaid ?? NaN },
              { label: t("home.compare.copTotal"), value: proj.totalCop ?? NaN, tone: "text-gold-text" },
            ]}
            bar={completed ? {
              principalPct: (proj.gpCapital / maxTotal) * 100,
              costPct: (proj.totalCop / maxTotal) * 100,
              principalLabel: t("home.compare.legendHome"),
              costLabel: t("home.compare.copTotal"),
            } : null}
          >
            {proj.buildsEquity ? (
              <p className="mt-5 rounded-[8px] border border-green/40 bg-surface px-4 py-3 text-xs leading-relaxed text-muted-foreground" data-testid="compare-fixed-sentence">
                {t("home.compare.fixedSentence")}
              </p>
            ) : (
              <p className="mt-5 rounded-[8px] border border-[#d05050]/50 bg-surface px-4 py-3 text-xs leading-relaxed text-muted-foreground" data-testid="compare-no-equity">
                {t("home.compare.noEquity1")} <strong className="text-cream">{money(proj.firstCop)}</strong> {t("home.compare.noEquity2")} <strong className="text-cream">{proj.ownershipPct}%</strong> {t("home.compare.noEquity3")}
              </p>
            )}
          </ResultCard>
        </div>

        {/* COP at each adjustment month */}
        {proj.adjustments.length > 0 && (
          <div className="mt-10" data-testid="compare-adjustments">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("home.compare.tableTitle")}</h3>
            <div className="mt-3 overflow-x-auto rounded-[10px] border border-border">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-surface-3 text-cream">
                  <tr>
                    {[t("home.compare.colMonth"), t("home.compare.colGpBefore"), t("home.compare.colGpAfter"), t("home.compare.colCopBefore"), t("home.compare.colCopAfter"), t("home.compare.colChange"), t("home.compare.colEquityWindow")].map((h) => (
                      <th key={h} scope="col" className="px-3 py-2.5 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {proj.adjustments.slice(0, 8).map((a) => (
                    <tr key={a.month} className="tabular-nums">
                      <td className="px-3 py-2.5 text-cream font-semibold">{a.month}</td>
                      <td className="px-3 py-2.5 text-body">{money(a.gpBefore)}</td>
                      <td className="px-3 py-2.5 text-body">{money(a.gpAfter)}</td>
                      <td className="px-3 py-2.5 text-body">{money(a.copBefore)}</td>
                      <td className="px-3 py-2.5 font-semibold text-gold-text">{money(a.copAfter)}</td>
                      <td className="px-3 py-2.5 text-body">{money(a.change)}</td>
                      <td className="px-3 py-2.5 text-body">{money(a.equityInWindow)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {proj.adjustments.length > 8 && (
              <p className="mt-2 text-xs text-dim" data-testid="compare-more-adjustments">
                {t("home.compare.moreAdjustments1")} {proj.adjustments.length - 8} {t("home.compare.moreAdjustments2")}
              </p>
            )}
          </div>
        )}

        {completed && difference > 0 && (
          <p className="mt-6 rounded-[10px] border border-gold/40 bg-surface px-5 py-4 text-center text-sm sm:text-base" data-testid="compare-difference">
            <span className="text-muted-foreground">{t("home.compare.difference")} </span>
            <Money value={difference} className="font-bold text-gold-text" testid="compare-difference-amount" />
            <span className="text-muted-foreground"> {t("home.compare.differenceSuffix")}</span>
          </p>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button type="button" onClick={startWithNumbers} disabled={starting} data-testid="compare-start" className="btn-primary">
            {t("home.compare.start")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={copyLink} data-testid="compare-copy" className="btn-outline">
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
            {copied ? t("home.compare.copied") : t("home.compare.copy")}
          </button>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-dim" data-testid="compare-note">{t("home.compare.note")}</p>
      </div>
    </div>
  );
}
