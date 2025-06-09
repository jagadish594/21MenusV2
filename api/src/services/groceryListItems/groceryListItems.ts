import type { GroceryListItem as PrismaGroceryListItem } from '@prisma/client'
import type {
  QueryResolvers,
  MutationResolvers,
  AddPantryItemToGroceryInput,
  AddPantryItemsToGroceryResult,
  // GroceryListItem from types/graphql might be causing issues with Date types
} from 'types/graphql'

import { db } from 'src/lib/db'

export const groceryListItems: QueryResolvers['groceryListItems'] = () => {
  return db.groceryListItem.findMany()
}

export const groceryListItem: QueryResolvers['groceryListItem'] = ({ id }) => {
  return db.groceryListItem.findUnique({
    where: { id },
  })
}

export const createGroceryListItem: MutationResolvers['createGroceryListItem'] =
  ({ input }) => {
    return db.groceryListItem.create({
      data: input,
    })
  }

export const updateGroceryListItem: MutationResolvers['updateGroceryListItem'] =
  ({ id, input }) => {
    return db.groceryListItem.update({
      data: input,
      where: { id },
    })
  }

export const deleteGroceryListItem: MutationResolvers['deleteGroceryListItem'] =
  ({ id }) => {
    return db.groceryListItem.delete({
      where: { id },
    })
  }

export const addPantryItemsToGroceryList: MutationResolvers['addPantryItemsToGroceryList'] =
  async ({ inputs }) => {
    const addedItems: PrismaGroceryListItem[] = []
    const skippedItems: string[] = []
    let addedCount = 0
    let skippedCount = 0

    const itemsToCreateData: Array<Omit<AddPantryItemToGroceryInput, 'quantity'> & { purchased: boolean }> = []

    for (const input of inputs) {
      const existingItem = await db.groceryListItem.findFirst({
        where: {
          name: input.name,
          category: input.category === null || input.category === undefined ? null : input.category,
        },
      })

      if (existingItem) {
        skippedItems.push(input.name)
        skippedCount++
      } else {
        itemsToCreateData.push({
          name: input.name,
          category: input.category,
          purchased: false, 
        })
      }
    }

    if (itemsToCreateData.length > 0) {
      try {
        await db.$transaction(async (prisma) => {
          for (const itemData of itemsToCreateData) {
            const createdItem = await prisma.groceryListItem.create({
              data: itemData,
            })
            addedItems.push(createdItem)
            addedCount++
          }
        })
      } catch (error) {
        console.error('Error adding pantry items to grocery list transaction:', error)
        throw new Error('Failed to add one or more items to the grocery list.')
      }
    }

    return {
      addedCount,
      skippedCount,
      addedItems,
      skippedItems,
    }
  }
