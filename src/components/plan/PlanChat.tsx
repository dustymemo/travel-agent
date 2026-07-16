"use client";

import { useState, type FormEvent } from "react";
import { usePlanner } from "./usePlanner";
import { ItineraryPanel } from "./ItineraryPanel";
import { SaveTripButton } from "./SaveTripButton";
import { DateRange } from "./DateRange";
import { WeatherBadge } from "./WeatherBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/cn";

/** One-tap refinements — the fake planner (and a real model) understand these. */
const QUICK_REPLIES = ["Make it cheaper", "Trains instead", "Add a food tour"];

/**
 * The Plan screen (TA-17): chat with Roam on the left, the live itinerary on the
 * right. The stateful client leaf — logic lives in {@link usePlanner}; the panel
 * and messages are presentational.
 */
export function PlanChat() {
  const {
    messages,
    itinerary,
    status,
    weather,
    setDates,
    send,
    setActivityPrice,
  } = usePlanner();
  const [draft, setDraft] = useState("");
  const started = messages.length > 0;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft;
    setDraft("");
    void send(text);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 lg:flex-row">
      <section
        aria-label="Chat with Roam"
        className="flex w-full flex-col lg:max-w-md"
      >
        {!started ? (
          <div className="flex flex-1 flex-col justify-center py-8">
            <Eyebrow as="p">Roam · Plan</Eyebrow>
            <h1 className="mt-3 font-display text-4xl leading-tight text-ink">
              Tell Roam your dates and vibe.
            </h1>
            <p className="mt-3 text-lg text-ink-soft">
              Describe a trip in your own words — “3 relaxed days in Vancouver,
              love food” — and watch the plan build itself.
            </p>
          </div>
        ) : (
          <ol className="flex flex-1 flex-col gap-3 overflow-y-auto py-2">
            {messages.map((m, i) => (
              <li
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                  m.role === "user"
                    ? "self-end bg-bubble text-ink"
                    : "self-start border border-line bg-surface text-ink",
                )}
              >
                {m.content}
              </li>
            ))}
            {status === "loading" && (
              <li
                aria-live="polite"
                className="self-start px-1 text-sm text-ink-soft"
              >
                Roam is planning…
              </li>
            )}
          </ol>
        )}

        {status === "error" && (
          <p role="alert" className="py-2 text-sm text-terracotta-deep">
            Something went wrong — please try again.
          </p>
        )}

        {started && (
          <div className="flex flex-wrap gap-2 py-2">
            {QUICK_REPLIES.map((q) => (
              <Button
                key={q}
                variant="secondary"
                size="xs"
                onClick={() => void send(q)}
                disabled={status === "loading"}
              >
                {q}
              </Button>
            ))}
          </div>
        )}

        <div className="pt-2">
          <DateRange onChange={setDates} />
        </div>

        <form onSubmit={onSubmit} className="flex items-center gap-2 pt-2">
          <label htmlFor="roam-input" className="sr-only">
            Message Roam
          </label>
          <Input
            id="roam-input"
            variant="pill"
            className="flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message Roam…"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            disabled={status === "loading" || draft.trim().length === 0}
          >
            <span aria-hidden>↑</span>
          </Button>
        </form>
      </section>

      <section aria-label="Itinerary" className="flex flex-1 flex-col gap-3">
        {itinerary ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {weather ? <WeatherBadge weather={weather} /> : <span />}
              <SaveTripButton itinerary={itinerary} />
            </div>
            <ItineraryPanel
              itinerary={itinerary}
              onPriceChange={setActivityPrice}
            />
          </>
        ) : (
          <Card
            variant="empty"
            className="flex flex-1 items-center justify-center p-10"
          >
            Your day-by-day plan will appear here.
          </Card>
        )}
      </section>
    </div>
  );
}
