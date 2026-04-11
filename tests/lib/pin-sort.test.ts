import { describe, expect, it } from "vitest";
import { sortPinsNewestFirst } from "@/lib/pins/sort";
import type { Pin } from "@/types/pins";

describe("sortPinsNewestFirst", () => {
  it("sorts pins by created_at descending", () => {
    const pins: Pin[] = [
      {
        id: "1",
        title: "Old",
        note: null,
        latitude: 33.79,
        longitude: -117.85,
        user_id: "u1",
        created_at: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        title: "New",
        note: null,
        latitude: 33.79,
        longitude: -117.85,
        user_id: "u1",
        created_at: "2024-01-02T00:00:00.000Z",
      },
    ];

    expect(sortPinsNewestFirst(pins).map((pin) => pin.id)).toEqual(["2", "1"]);
  });
});
