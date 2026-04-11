import type { CreatePinInput, Pin } from "@/types/pins";

export type PinGateway = {
  createPin: (userId: string, input: CreatePinInput) => Promise<Pin>;
  fetchPins: (userId: string) => Promise<Pin[]>;
};

export async function createPinAndRefetch(
  gateway: PinGateway,
  userId: string,
  input: CreatePinInput,
): Promise<Pin[]> {
  await gateway.createPin(userId, input);
  return gateway.fetchPins(userId);
}
