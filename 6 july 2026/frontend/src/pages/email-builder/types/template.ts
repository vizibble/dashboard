export interface Template {
  id: string;

  name: string;
  description: string;

  type: "email";

  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;

  version: number;

  blocks: any[];
}