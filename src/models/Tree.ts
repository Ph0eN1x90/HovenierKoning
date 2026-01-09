import type { TreeImage } from "./TreeImage";
export interface Tree {
  id: number | null;
  treenumber: number;
  treetype: string;
  diameter: number;
  height: number;
  date_finished: string | null;
  finished: boolean;
  comment: string;
  address: {
    id: number;
  };
  treeimage: TreeImage[]; // Array of TreeImage objects
  };
