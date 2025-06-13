// export const CATEGORIES_WITH_IDS = [
//   { id: 1, name: 'Produce' },
//   { id: 2, name: 'Dairy' },
//   { id: 3, name: 'Meat & Seafood' },
//   { id: 4, name: 'Snacks' },
//   { id: 5, name: 'Frozen' },
//   { id: 6, name: 'Beverages' },
//   { id: 7, name: 'Condiments/Spices' },
//   { id: 8, name: 'Other' },
// ] as const;

export const CATEGORIES_WITH_IDS = [
  { id: 5, name: 'Produce' },
  { id: 10, name: 'Dairy' },
  { id: 2, name: 'Meat & Seafood' },
  { id: 6, name: 'Snacks' },
  { id: 11, name: 'Frozen' },
  { id: 12, name: 'Beverages' },
  { id: 13, name: 'Condiments/Spices' },
  { id: 3, name: 'Other' },
  { id: 9, name: 'Special Items' },
] as const

export const CATEGORY_NAMES = CATEGORIES_WITH_IDS.map((c) => c.name)

export type CategoryName = (typeof CATEGORIES_WITH_IDS)[number]['name']

export const CATEGORY_NAME_TO_ID_MAP: Record<CategoryName, number> =
  Object.fromEntries(
    CATEGORIES_WITH_IDS.map((category) => [category.name, category.id])
  ) as Record<CategoryName, number>

// For compatibility with existing code that might use the old Category type
export type Category = CategoryName
