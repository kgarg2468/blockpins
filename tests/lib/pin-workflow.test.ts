import { describe, expect, it, vi } from "vitest";
import type { CreatePinInput, Pin } from "@/types/pins";
import { createPinAndRefetch } from "@/lib/pins/workflow";

const sampleInput: CreatePinInput = {
  title: "Memorial Lawn",
  note: "Good study spot",
  latitude: 33.7933,
  longitude: -117.8513,
};

const samplePin: Pin = {
  id: "pin-1",
  user_id: "user-1",
  title: sampleInput.title,
  note: sampleInput.note ?? null,
  latitude: sampleInput.latitude,
  longitude: sampleInput.longitude,
  created_at: new Date().toISOString(),
};

describe("createPinAndRefetch", () => {
  it("creates a pin then refetches pins", async () => {
    const createPin = vi.fn(async () => samplePin);
    const fetchPins = vi.fn(async () => [samplePin]);

    const pins = await createPinAndRefetch({
      createPin,
      fetchPins,
    }, "user-1", sampleInput);

    expect(createPin).toHaveBeenCalledWith("user-1", sampleInput);
    expect(fetchPins).toHaveBeenCalledWith("user-1");
    expect(pins).toEqual([samplePin]);
  });

  it("propagates save errors and does not refetch", async () => {
    const createPin = vi.fn(async () => {
      throw new Error("Save failed");
    });
    const fetchPins = vi.fn(async () => [samplePin]);

    await expect(
      createPinAndRefetch(
        {
          createPin,
          fetchPins,
        },
        "user-1",
        sampleInput,
      ),
    ).rejects.toThrow(/save failed/i);

    expect(fetchPins).not.toHaveBeenCalled();
  });
});
