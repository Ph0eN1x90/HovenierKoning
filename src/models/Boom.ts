export interface Boom {
  id?: number | null; // Optional ID, can be null
  boomnummer: number;
  boomtype: string;
  diameter: number;
  hoogte: number;
  datum_afgerond: string; // ISO date string
  afgerond: boolean;
  comment: string;
  adres: {
    id: number;
  };
}
