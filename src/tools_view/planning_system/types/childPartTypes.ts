export interface ChildPartData {
  partName: string;
  customerName: string;
  stock: number | null;
  inMaterial?: (number | null)[][];
  aktualInMaterial?: (number | null)[][];
} 