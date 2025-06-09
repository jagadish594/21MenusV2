export const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Snacks', // Formerly 'Pantry'
  'Frozen',
  'Beverages',
  'Condiments/Spices',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];
