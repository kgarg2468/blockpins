import type { Pin } from "@/types/pins";

export function sortPinsNewestFirst(pins: Pin[]): Pin[] {
  return [...pins].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
