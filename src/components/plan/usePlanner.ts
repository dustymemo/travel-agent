"use client";

import { useCallback, useState } from "react";
import type { Message, Itinerary, TripDates } from "@/types/trip";
import type { Climate } from "@/lib/weather/open-meteo";
import { withActivityPrice } from "@/lib/itinerary";

export type PlannerStatus = "idle" | "loading" | "error";

export interface UsePlanner {
  messages: Message[];
  itinerary: Itinerary | null;
  status: PlannerStatus;
  /** Typical weather for the destination/window, when resolvable. */
  weather: Climate | null;
  /** Optional trip dates; grounds planning + weather on the exact window. */
  dates: TripDates | null;
  setDates: (dates: TripDates | null) => void;
  /** Send a traveler message; the plan updates in place. No-op while loading. */
  send: (content: string) => Promise<void>;
  /**
   * Correct one stop's ticket price (TA-27). The matching budget line moves by
   * the same delta, so the trip total stays honest (TA-23). A re-plan replaces
   * these edits — the model owns the itinerary.
   */
  setActivityPrice: (
    dayNumber: number,
    activityIndex: number,
    priceCad: number,
  ) => void;
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
  const [weather, setWeather] = useState<Climate | null>(null);
  const [dates, setDates] = useState<TripDates | null>(null);

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
            dates: dates ?? undefined,
          }),
        });
        if (!res.ok) throw new Error(`Plan request failed: ${res.status}`);

        const data = (await res.json()) as {
          reply: string;
          itinerary: Itinerary;
          weather?: Climate;
        };
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
        setItinerary(data.itinerary);
        setWeather(data.weather ?? null);
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    },
    [messages, itinerary, status, dates],
  );

  const setActivityPrice = useCallback(
    (dayNumber: number, activityIndex: number, priceCad: number) => {
      // withActivityPrice returns the same reference for a no-op edit, so
      // setState bails out and nothing re-renders.
      setItinerary((current) =>
        current
          ? withActivityPrice(current, dayNumber, activityIndex, priceCad)
          : current,
      );
    },
    [],
  );

  return {
    messages,
    itinerary,
    status,
    weather,
    dates,
    setDates,
    send,
    setActivityPrice,
  };
}
