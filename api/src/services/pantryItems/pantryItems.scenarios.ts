import type { Prisma, PantryItem } from '@prisma/client'

import type { ScenarioData } from '@redwoodjs/testing/api'

export const standard = defineScenario<Prisma.PantryItemCreateArgs>({
  pantryItem: {
    one: {
      data: {
        name: 'String',
        category: 'String',
        updatedAt: '2025-06-05T23:25:33.358Z',
      },
    },
    two: {
      data: {
        name: 'String',
        category: 'String',
        updatedAt: '2025-06-05T23:25:33.358Z',
      },
    },
  },
})

export type StandardScenario = ScenarioData<PantryItem, 'pantryItem'>
