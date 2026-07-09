import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePlanner } from "./usePlanner";

const sampleItinerary = {
  summary: "3 days in Vancouver",
  days: [{ day: 1, title: "Arrival", activities: [] }],
  packing: [],
  apps: [],
  tips: [],
  budget: [],
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mockFetchOnce(reply: string) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ reply, itinerary: sampleItinerary }),
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
});
