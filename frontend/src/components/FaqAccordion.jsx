import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

export default function FaqAccordion({ items, testidPrefix = "faq", numbered = false }) {
  return (
    <Accordion type="single" collapsible className="w-full" data-testid={`${testidPrefix}-accordion`}>
      {items.map((item, i) => (
        <AccordionItem key={i} value={`item-${i}`} className="border-border">
          <AccordionTrigger
            data-testid={`${testidPrefix}-question-${i}`}
            className="text-base font-medium text-cream hover:text-gold-text hover:no-underline"
          >
            <span className="flex items-baseline gap-4">
              {numbered && (
                <span className="shrink-0 text-sm font-bold text-gold/70" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
              <span>{item.q}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent
            data-testid={`${testidPrefix}-answer-${i}`}
            className={`text-sm leading-relaxed text-muted-foreground ${numbered ? "sm:pl-9" : ""}`}
          >
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
