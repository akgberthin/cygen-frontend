import React from "react";
import { ArrowRight, BookOpenText, Compass, DoorOpen, FileCheck2, FileSearch, Flag, GraduationCap, HandCoins, Handshake, HeartHandshake, Home as HomeIcon, KeyRound, Landmark, Mail, MessagesSquare, Scale, ShieldCheck, TrendingUp, UserCheck, Users, Vault } from "lucide-react";
import CmsLink from "./CmsLink";

/* Pieces the section renderers share (kept apart from the registries so they can import them without a cycle). */

/** Icon names an editor can pick (feature cards, page banners). An unknown name draws no icon. */
export const ICONS = {
  "trending-up": TrendingUp,
  vault: Vault,
  handshake: Handshake,
  "hand-coins": HandCoins,
  "shield-check": ShieldCheck,
  landmark: Landmark,
  "user-check": UserCheck,
  home: HomeIcon,
  users: Users,
  "messages-square": MessagesSquare,
  scale: Scale,
  "key-round": KeyRound,
  "book-open-text": BookOpenText,
  "file-check-2": FileCheck2,
  "heart-handshake": HeartHandshake,
  "door-open": DoorOpen,
  flag: Flag,
  "file-search": FileSearch,
  "graduation-cap": GraduationCap,
  compass: Compass,
  mail: Mail,
};

export const Arrow = () => <ArrowRight className="h-4 w-4" aria-hidden="true" />;

/** The server cleans rich text with an allow-list before it is stored. */
export const rich = (html) => ({ __html: html || "" });

/** A row of call-to-action buttons; the first is the filled one. `className` replaces the default row classes. */
export function Buttons({ list, ctx, center, className }) {
  const items = (list || []).filter((b) => b && b.url);
  if (!items.length) return null;
  return (
    <div className={className || `mt-8 flex flex-col gap-3 sm:flex-row ${center ? "items-center justify-center" : ""}`}>
      {items.map((b, i) => (
        <CmsLink key={i} url={b.url} className={i === 0 ? "btn-primary" : "btn-outline"}>
          {ctx.tx(b.label)}
          <Arrow />
        </CmsLink>
      ))}
    </div>
  );
}

/** Rows of a list prop that carry a localized `text`, as plain strings (empty ones dropped). */
export const texts = (list, ctx) => (list || []).map((x) => ctx.tx(x && x.text)).filter(Boolean);

export function toRoman(n) {
  const map = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  let rest = n;
  map.forEach(([v, s]) => {
    while (rest >= v) {
      out += s;
      rest -= v;
    }
  });
  return out;
}
