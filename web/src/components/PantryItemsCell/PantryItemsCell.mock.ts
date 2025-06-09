// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  pantryItems: [
    {
      __typename: 'PantryItem' as const,
      id: 42,
    },
    {
      __typename: 'PantryItem' as const,
      id: 43,
    },
    {
      __typename: 'PantryItem' as const,
      id: 44,
    },
  ],
})
