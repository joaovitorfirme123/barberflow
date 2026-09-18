"use client";

import { useEffect } from "react";

export function ProductEventTracker({
  slug,
  event,
}: {
  slug: string;
  event: "PUBLIC_PAGE_VIEWED" | "BOOKING_STARTED";
}) {
  useEffect(() => {
    void fetch(`/api/public/barbershops/${slug}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
    });
  }, [event, slug]);
  return null;
}
