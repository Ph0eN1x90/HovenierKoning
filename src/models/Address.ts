import type { Tree } from "./Tree";

export interface Address {
  id: number;
  streetname: string;
  city: string;
  housenumber: number;
  housenumbers: number[];
  zipcode: string;
  finished: boolean;
  date_finished: string | null;
  trees: Tree[];
  allFinished?: boolean; // Calculated field for grouped addresses
}
