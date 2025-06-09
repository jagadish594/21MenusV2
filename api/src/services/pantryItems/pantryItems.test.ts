import type { PantryItem } from '@prisma/client'

import {
  pantryItems,
  pantryItem,
  createPantryItem,
  updatePantryItem,
  deletePantryItem,
} from './pantryItems'
import type { StandardScenario } from './pantryItems.scenarios'

// Generated boilerplate tests do not account for all circumstances
// and can fail without adjustments, e.g. Float.
//           Please refer to the RedwoodJS Testing Docs:
//       https://redwoodjs.com/docs/testing#testing-services
// https://redwoodjs.com/docs/testing#jest-expect-type-considerations

describe('pantryItems', () => {
  scenario('returns all pantryItems', async (scenario: StandardScenario) => {
    const result = await pantryItems()

    expect(result.length).toEqual(Object.keys(scenario.pantryItem).length)
  })

  scenario(
    'returns a single pantryItem',
    async (scenario: StandardScenario) => {
      const result = await pantryItem({ id: scenario.pantryItem.one.id })

      expect(result).toEqual(scenario.pantryItem.one)
    }
  )

  scenario('creates a pantryItem', async () => {
    const result = await createPantryItem({
      input: {
        name: 'String',
        category: 'String',
        updatedAt: '2025-06-05T23:25:33.264Z',
      },
    })

    expect(result.name).toEqual('String')
    expect(result.category).toEqual('String')
    expect(result.updatedAt).toEqual(new Date('2025-06-05T23:25:33.264Z'))
  })

  scenario('updates a pantryItem', async (scenario: StandardScenario) => {
    const original = (await pantryItem({
      id: scenario.pantryItem.one.id,
    })) as PantryItem
    const result = await updatePantryItem({
      id: original.id,
      input: { name: 'String2' },
    })

    expect(result.name).toEqual('String2')
  })

  scenario('deletes a pantryItem', async (scenario: StandardScenario) => {
    const original = (await deletePantryItem({
      id: scenario.pantryItem.one.id,
    })) as PantryItem
    const result = await pantryItem({ id: original.id })

    expect(result).toEqual(null)
  })
})
