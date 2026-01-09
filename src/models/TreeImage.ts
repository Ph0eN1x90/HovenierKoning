// import type { Tree } from "./Tree";

export interface TreeImage {
  id: number | null; // Allow null for new images
  imageurl: string;
  tree: {
    id: number | null;
  };
}
