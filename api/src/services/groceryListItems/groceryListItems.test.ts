import type { GroceryListItem } from '@prisma/client'

import {
  groceryListItems,
  groceryListItem,
  createGroceryListItem,
  updateGroceryListItem,
  deleteGroceryListItem,
} from './groceryListItems'
import type { StandardScenario } from './groceryListItems.scenarios'

// Generated boilerplate tests do not account for all circumstances
// and can fail without adjustments, e.g. Float.
//           Please refer to the RedwoodJS Testing Docs:
//       https://redwoodjs.com/docs/testing#testing-services
// https://redwoodjs.com/docs/testing#jest-expect-type-considerations

describe('groceryListItems', () => {
  scenario(
    'returns all groceryListItems',
    async (scenario: StandardScenario) => {
      const result = await groceryListItems()

      expect(result.length).toEqual(
        Object.keys(scenario.groceryListItem).length
      )
    }
  )

  scenario(
    'returns a single groceryListItem',
    async (scenario: StandardScenario) => {
      const result = await groceryListItem({
        id: scenario.groceryListItem.one.id,
      })

      expect(result).toEqual(scenario.groceryListItem.one)
    }
  )

  scenario('creates a groceryListItem', async () => {
    const result = await createGroceryListItem({
      input: { name: 'String', updatedAt: '2025-06-06T02:19:54.974Z' },
    })

    expect(result.name).toEqual('String')
    expect(result.updatedAt).toEqual(new Date('2025-06-06T02:19:54.974Z'))
  })

  scenario('updates a groceryListItem', async (scenario: StandardScenario) => {
    const original = (await groceryListItem({
      id: scenario.groceryListItem.one.id,
    })) as GroceryListItem
    const result = await updateGroceryListItem({
      id: original.id,
      input: { name: 'String2' },
    })

    expect(result.name).toEqual('String2')
  })

  scenario('deletes a groceryListItem', async (scenario: StandardScenario) => {
    const original = (await deleteGroceryListItem({
      id: scenario.groceryListItem.one.id,
    })) as GroceryListItem
    const result = await groceryListItem({ id: original.id })

    expect(result).toEqual(null)
  })
})
