import { describe, expect, it } from "vitest";
import { CHAPMAN_CENTER, DEFAULT_MAP_STYLE, DEFAULT_ZOOM } from "@/lib/map/constants";

describe("map defaults", () => {
  it("uses Chapman University center coordinates", () => {
    expect(CHAPMAN_CENTER).toEqual({
      latitude: 33.7933,
      longitude: -117.8513,
    });
  });

  it("uses Mapbox streets style with campus-level zoom", () => {
    expect(DEFAULT_MAP_STYLE).toBe("mapbox://styles/mapbox/streets-v12");
    expect(DEFAULT_ZOOM).toBeGreaterThanOrEqual(14);
    expect(DEFAULT_ZOOM).toBeLessThanOrEqual(16);
  });
});
