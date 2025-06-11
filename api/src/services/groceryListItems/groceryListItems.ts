import type { GroceryListItem as PrismaGroceryListItem } from '@prisma/client'
import type {
  QueryResolvers,
  MutationResolvers,
  AddPantryItemToGroceryInput,
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

export const createMultipleGroceryListItems: MutationResolvers['createMultipleGroceryListItems'] =
  async ({ inputs }) => {
    console.log('[CMGLI] Received inputs:', JSON.stringify(inputs, null, 2))
    const addedItems: PrismaGroceryListItem[] = []
    const skippedItemNames: string[] = [] // Renamed for clarity

    // Fetch existing items with their names and categories
    const existingDbItems = await db.groceryListItem.findMany({
      select: { name: true, category: true },
    })
    console.log(
      '[CMGLI] Fetched existingDbItems:',
      JSON.stringify(existingDbItems, null, 2)
    )

    // Create a set of unique keys (name::category) for existing DB items
    const existingDbItemKeys = new Set(
      existingDbItems.map((item) => {
        const nameKey = item.name.toLowerCase()
        // Handle null categories from DB by using a placeholder string
        const categoryKey = item.category
          ? item.category.toLowerCase()
          : '__null_category__'
        return `${nameKey}::${categoryKey}`
      })
    )
    console.log(
      '[CMGLI] Generated existingDbItemKeys:',
      Array.from(existingDbItemKeys)
    )

    const itemsToCreateData: Array<(typeof inputs)[0]> = []
    // This set tracks unique (name, category) combinations from the input array
    // to ensure each unique input is processed only once for DB check or creation.
    const processedInputKeysInBatch = new Set<string>()

    for (const input of inputs) {
      // input.category is String! from GraphQL schema, so it's a non-null string.
      const inputNameKey = input.name.toLowerCase()
      const inputCategoryKey = input.category.toLowerCase()
      const currentInputKey = `${inputNameKey}::${inputCategoryKey}`

      if (processedInputKeysInBatch.has(currentInputKey)) {
        // This specific (name, category) item from input has already been processed in this batch.
        // This handles cases where the same item (e.g., "Milk", "Dairy") appears multiple times in the `inputs` array.
        // We only consider its first appearance for DB check / addition.
        continue
      }
      processedInputKeysInBatch.add(currentInputKey)

      // Check if this exact name+category combination already exists in the DB
      console.log(
        `[CMGLI] Processing input item: ${input.name}, category: ${input.category}. Generated key: ${currentInputKey}`
      )
      if (existingDbItemKeys.has(currentInputKey)) {
        skippedItemNames.push(input.name) // Add original name to list of skipped items
        console.log(
          `[CMGLI] Item ${input.name} (${currentInputKey}) marked as SKIPPED (already exists in DB).`
        )
      } else {
        // Not a DB duplicate, so add it for creation
        itemsToCreateData.push(input)
        console.log(
          `[CMGLI] Item ${input.name} (${currentInputKey}) marked for CREATION.`
        )
      }
    }

    console.log(
      '[CMGLI] Items marked for creation (itemsToCreateData):',
      JSON.stringify(itemsToCreateData, null, 2)
    )

    // Perform transactional creation for items not found in DB
    if (itemsToCreateData.length > 0) {
      try {
        const successfullyCreatedItems: PrismaGroceryListItem[] = []
        await db.$transaction(async (prisma) => {
          for (const itemData of itemsToCreateData) {
            const createdItem = await prisma.groceryListItem.create({
              data: itemData,
            })
            successfullyCreatedItems.push(createdItem)
          }
        })
        addedItems.push(...successfullyCreatedItems) // Populate addedItems only if transaction succeeds
      } catch (error) {
        console.error(
          'Error in createMultipleGroceryListItems transaction:',
          error
        )
        // If transaction fails, addedItems remains empty (as initialized).
      }
    }

    console.log(
      '[CMGLI] Final addedItems:',
      JSON.stringify(addedItems, null, 2)
    )
    console.log('[CMGLI] Final skippedItemNames:', skippedItemNames)

    return {
      addedCount: addedItems.length,
      skippedCount: skippedItemNames.length,
      addedItems, // Contains PrismaGroceryListItem objects
      skippedItems: skippedItemNames, // Contains array of strings (names)
    }
  }

export const addPantryItemsToGroceryList: MutationResolvers['addPantryItemsToGroceryList'] =
  async ({ inputs }) => {
    const addedItems: PrismaGroceryListItem[] = []
    const skippedItems: string[] = []
    let addedCount = 0
    let skippedCount = 0

    const itemsToCreateData: Array<
      Omit<AddPantryItemToGroceryInput, 'quantity'> & { purchased: boolean }
    > = []

    for (const input of inputs) {
      const existingItem = await db.groceryListItem.findFirst({
        where: {
          name: input.name,
          category:
            input.category === null || input.category === undefined
              ? null
              : input.category,
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
        console.error(
          'Error adding pantry items to grocery list transaction:',
          error
        )
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

export const deleteGroceryListItemsByCategory: MutationResolvers['deleteGroceryListItemsByCategory'] =
  async ({ category }) => {
    console.log(`[DGBC] Attempting to delete items for category: ${category}`)
    // Ensure category is not null or undefined, though GraphQL schema should enforce String!
    if (!category) {
      // This case should ideally be caught by GraphQL validation
      console.error('[DGBC] Category cannot be null or undefined for deletion.')
      // Return 0 or throw error, depending on desired strictness
      // For now, let's prevent Prisma from receiving undefined for a required field
      return { count: 0 }
    }
    try {
      const result = await db.groceryListItem.deleteMany({
        where: { category },
      })
      console.log(
        `[DGBC] Successfully deleted ${result.count} items for category: ${category}`
      )
      return {
        count: result.count,
      }
    } catch (error) {
      console.error(
        `[DGBC] Error deleting grocery items by category ${category}:`,
        error
      )
      // Optionally, rethrow or return a specific error structure
      // For now, returning 0 count on error to fulfill BatchDeleteResult structure
      return { count: 0 }
    }
  }
