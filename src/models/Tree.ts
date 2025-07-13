export interface Tree {
  id?: number | null; // Optional ID, can be null
  treenumber: number;
  treetype: string;
  diameter: number;
  height: number;
  date_finished: string | null; // ISO date string
  finished: boolean;
  comment: string;
  address: {
    id: number;
  };
}
