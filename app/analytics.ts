"use client";

import type { SiteEventName } from "./analytics-contract";

type EventProperty = string | number | boolean | null;

type SiteEventInput = {
  productId?: string | null;
  verificationId?: string | null;
  properties?: Record<string, EventProperty>;
};

const SESSION_KEY = "figsignal_analytics_session_v1";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

function currentPageContext() {
  const pageContext = document.querySelector<HTMLElement>("[data-feedback-context]")?.dataset.feedbackContext;
  if (pageContext === "search" || pageContext === "photos" || pageContext === "result") return pageContext;
  if (window.location.pathname.startsWith("/community")) return "community";
  if (window.location.pathname.startsWith("/reports")) return "report";
  if (window.location.pathname.startsWith("/feedback-admin")) return "feedback_admin";
  return "other";
}

function createSessionId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function analyticsSessionId() {
  const now = Date.now();
  try {
    const stored = JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? "null") as { id?: unknown; expiresAt?: unknown } | null;
    if (typeof stored?.id === "string" && typeof stored.expiresAt === "number" && stored.expiresAt > now) {
      return stored.id;
    }
  } catch {
    // A blocked or malformed localStorage value should never affect the product flow.
  }

  const id = createSessionId();
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id, expiresAt: now + SESSION_DURATION_MS }));
  } catch {
    // The in-memory id still lets this single event be counted anonymously.
  }
  return id;
}

export function trackSiteEvent(eventName: SiteEventName, input: SiteEventInput = {}) {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") return;

  const payload = JSON.stringify({
    eventName,
    sessionId: analyticsSessionId(),
    pagePath: `${window.location.pathname}${window.location.search}`,
    pageContext: currentPageContext(),
    productId: input.productId ?? null,
    verificationId: input.verificationId ?? null,
    properties: input.properties ?? {},
  });

  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
