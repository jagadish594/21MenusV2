import type { Prisma, GroceryListItem } from '@prisma/client'

import type { ScenarioData } from '@redwoodjs/testing/api'

export const standard = defineScenario<Prisma.GroceryListItemCreateArgs>({
  groceryListItem: {
    one: { data: { name: 'String', updatedAt: '2025-06-06T02:19:55.080Z' } },
    two: { data: { name: 'String', updatedAt: '2025-06-06T02:19:55.080Z' } },
  },
})

export type StandardScenario = ScenarioData<GroceryListItem, 'groceryListItem'>
