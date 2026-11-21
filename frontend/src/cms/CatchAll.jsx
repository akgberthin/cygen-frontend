import React from "react";
import { useParams } from "react-router-dom";
import NotFound from "../pages/NotFound";
import CmsGate from "./CmsGate";

/** Any address the built-in pages do not own: a page created in the CMS is drawn here once it is published (or in a preview); otherwise the usual "not found" page. */
export default function CmsCatchAll() {
  const slug = String(useParams()["*"] || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  return (
    <CmsGate slug={slug}>
      <NotFound />
    </CmsGate>
  );
}
