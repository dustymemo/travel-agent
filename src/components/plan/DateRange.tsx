"use client";

import { useState } from "react";
import type { TripDates } from "@/types/trip";
import { Input } from "@/components/ui/Input";

/**
 * Optional trip date-range input for the Plan screen (TA-57). Holds its own raw
 * start/end strings and emits a validated {@link TripDates} (or null while
 * incomplete/invalid) so the planner can ground on the exact window. Native
 * date inputs keep it accessible and dependency-free.
 */
export function DateRange({
  onChange,
}: {
  onChange: (dates: TripDates | null) => void;
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  function commit(s: string, e: string) {
    onChange(s && e && s <= e ? { start: s, end: e } : null);
  }

  const invalid = Boolean(start && end && start > end);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-ink-soft">
        Trip start
        <Input
          type="date"
          value={start}
          onChange={(e) => {
            setStart(e.target.value);
            commit(e.target.value, end);
          }}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-soft">
        Trip end
        <Input
          type="date"
          value={end}
          min={start || undefined}
          onChange={(e) => {
            setEnd(e.target.value);
            commit(start, e.target.value);
          }}
        />
      </label>
      {invalid && (
        <p role="alert" className="text-xs text-terracotta-deep">
          End date must be on or after the start date.
        </p>
      )}
    </div>
  );
}
