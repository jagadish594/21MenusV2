export const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Pantry',
  'Frozen',
  'Beverages',
  'Condiments/Spices',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]
