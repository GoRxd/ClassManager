export interface Collection {
  id?: number;
  title: string;
  description: string;
  targetAmount: number; // in grosze
  deadline: number | null; // timestamp
  isArchived: boolean;
  createdAt?: number;
}
