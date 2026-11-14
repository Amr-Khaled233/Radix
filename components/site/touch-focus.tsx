"use client";

import { useEffect } from "react";

/**
 * Phones have no hover, so cards respond to the (native) scroll instead:
 * - each card rises into place the first time it enters the screen (`data-seen`);
 * - the card crossing the middle of the screen takes the hover look (`data-in-focus`): it lifts, its
 *   image zooms and the other cards in its group step back.
 * Runs only on devices without hover; with reduced motion, cards are simply shown (no entrance).
 * Cards added later (client navigation) are picked up by a MutationObserver.
 */
export function TouchFocus() {
  useEffect(() => {
    if (!window.matchMedia("(hover: none)").matches || !("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) root.setAttribute("data-touch-cards", "");

    const seen = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-seen", "");
          seen.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    // A thin band across the middle of the screen: the card inside it is "in focus".
    const focus = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) entry.target.toggleAttribute("data-in-focus", entry.isIntersecting);
      },
      { rootMargin: "-46% 0px -46% 0px" },
    );

    const tracked = new WeakSet<Element>();
    const scan = () => {
      for (const card of document.querySelectorAll(".frame-card")) {
        if (tracked.has(card)) continue;
        tracked.add(card);
        if (reduced) card.setAttribute("data-seen", "");
        else seen.observe(card);
        focus.observe(card);
      }
    };
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      seen.disconnect();
      focus.disconnect();
      root.removeAttribute("data-touch-cards");
    };
  }, []);

  return null;
}
