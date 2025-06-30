export interface Adres {
  id: number;
  straatnaam: string;
  stad: string;
  huisnummer: number
  huisnummers: number[];
  postcode: string;
  afgerond: boolean;
  // bomen:Boom[]
}
