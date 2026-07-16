import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePlanner } from "./usePlanner";
import type { Itinerary } from "@/types/trip";

const sampleItinerary: Itinerary = {
  summary: "3 days in Vancouver",
  days: [{ day: 1, title: "Arrival", activities: [] }],
  packing: [],
  apps: [],
  tips: [],
  budget: [],
};

const pricedItinerary: Itinerary = {
  ...sampleItinerary,
  days: [
    {
      day: 1,
      title: "Arrival",
      activities: [
        { startTime: "19:00", title: "Dinner", type: "food", priceCad: 45 },
      ],
    },
  ],
  budget: [{ category: "food", amountCad: 210 }],
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mockFetchOnce(reply: string, itinerary = sampleItinerary) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ reply, itinerary }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("usePlanner", () => {
  it("appends the traveler message, then Roam's reply + itinerary", async () => {
    mockFetchOnce("Here's your Vancouver plan!");
    const { result } = renderHook(() => usePlanner());

    await act(async () => {
      await result.current.send("3 days in Vancouver");
    });

    expect(result.current.messages.map((m) => m.role)).toEqual([
      "user",
      "assistant",
    ]);
    expect(result.current.messages[1].content).toMatch(/vancouver plan/i);
    expect(result.current.itinerary?.summary).toBe("3 days in Vancouver");
    expect(result.current.status).toBe("idle");
  });

  it("ignores empty input", async () => {
    const fetchMock = mockFetchOnce("x");
    const { result } = renderHook(() => usePlanner());
    await act(async () => {
      await result.current.send("   ");
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
  });

  it("sets error status when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    const { result } = renderHook(() => usePlanner());

    await act(async () => {
      await result.current.send("plan something");
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    // the traveler's message is still shown
    expect(result.current.messages[0].content).toBe("plan something");
  });

  describe("setActivityPrice", () => {
    it("edits the price and moves the trip total with it", async () => {
      mockFetchOnce("Here's your plan!", pricedItinerary);
      const { result } = renderHook(() => usePlanner());
      await act(async () => {
        await result.current.send("3 days in Vancouver");
      });

      act(() => result.current.setActivityPrice(1, 0, 60));

      expect(result.current.itinerary?.days[0].activities[0].priceCad).toBe(60);
      // food line 210 + the 15 the traveller added
      expect(result.current.itinerary?.budget[0].amountCad).toBe(225);
    });

    it("is a no-op before a plan exists", () => {
      const { result } = renderHook(() => usePlanner());
      act(() => result.current.setActivityPrice(1, 0, 60));
      expect(result.current.itinerary).toBeNull();
    });

    it("lets a re-plan replace edited prices", async () => {
      // The model owns the itinerary; a new plan supersedes local edits rather
      // than silently merging into it.
      mockFetchOnce("Here's your plan!", pricedItinerary);
      const { result } = renderHook(() => usePlanner());
      await act(async () => {
        await result.current.send("3 days in Vancouver");
      });
      act(() => result.current.setActivityPrice(1, 0, 60));

      await act(async () => {
        await result.current.send("make it cheaper");
      });

      expect(result.current.itinerary?.days[0].activities[0].priceCad).toBe(45);
    });
  });
});
