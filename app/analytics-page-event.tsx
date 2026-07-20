"use client";

import { useEffect } from "react";
import type { SiteEventName } from "./analytics-contract";
import { trackSiteEvent } from "./analytics";

export function AnalyticsPageEvent({
  eventName,
  productId,
  verificationId,
  properties,
}: {
  eventName: SiteEventName;
  productId?: string;
  verificationId?: string;
  properties?: Record<string, string | number | boolean | null>;
}) {
  useEffect(() => {
    trackSiteEvent(eventName, { productId, verificationId, properties });
  }, [eventName, productId, properties, verificationId]);

  return null;
}
