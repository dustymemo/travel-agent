"use client";

import { useCallback, useState } from "react";
import type { Message, Itinerary } from "@/types/trip";

export type PlannerStatus = "idle" | "loading" | "error";

export interface UsePlanner {
  messages: Message[];
  itinerary: Itinerary | null;
  status: PlannerStatus;
  /** Send a traveler message; the plan updates in place. No-op while loading. */
  send: (content: string) => Promise<void>;
}

/**
 * Owns the Plan conversation: appends the traveler's message, posts the running
 * transcript + current itinerary to `/api/plan`, then appends Roam's reply and
 * swaps in the updated itinerary. Keeps the UI component thin (senior-frontend).
 */
export function usePlanner(): UsePlanner {
  const [messages, setMessages] = useState<Message[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [status, setStatus] = useState<PlannerStatus>("idle");

  const send = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || status === "loading") return;

      const outgoing: Message[] = [
        ...messages,
        { role: "user", content: text },
      ];
      setMessages(outgoing);
      setStatus("loading");

      try {
        const res = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: outgoing,
            currentItinerary: itinerary ?? undefined,
          }),
        });
        if (!res.ok) throw new Error(`Plan request failed: ${res.status}`);

        const data = (await res.json()) as {
          reply: string;
          itinerary: Itinerary;
        };
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
        setItinerary(data.itinerary);
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    },
    [messages, itinerary, status],
  );

  return { messages, itinerary, status, send };
}
