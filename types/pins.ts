export type Pin = {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type CreatePinInput = {
  title: string;
  note?: string;
  latitude: number;
  longitude: number;
};
