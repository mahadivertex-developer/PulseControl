export const OPERATION_SECTIONS = [
  'Dashboard',
  'Merchandising',
  'Planning',
  'Store',
  'Cutting',
  'Sewing',
  'Washing',
  'Finishing',
  'Packing',
  'Shipment',
  'Commercial',
  'GRN',
  'Quality Assurance',
  'Admin',
] as const;

export type OperationSection = (typeof OPERATION_SECTIONS)[number];
