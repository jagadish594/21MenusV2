import type { GroceryListItem as PrismaGroceryListItem, Category as PrismaCategory } from '@prisma/client'
import type {
  QueryResolvers,
  MutationResolvers,
  AddPantryItemToGroceryInput,
  // GroceryListItem from types/graphql might be causing issues with Date types
} from 'types/graphql'

import { db } from 'src/lib/db'

export const groceryListItems: QueryResolvers['groceryListItems'] = () => {
  return db.groceryListItem.findMany({ include: { category: true } })
}

export const groceryListItem: QueryResolvers['groceryListItem'] = ({ id }) => {
  return db.groceryListItem.findUnique({
    where: { id },
    include: { category: true },
  })
}

export const createGroceryListItem: MutationResolvers['createGroceryListItem'] =
  ({ input }) => {
    // input now contains categoryId instead of category string
    return db.groceryListItem.create({
      data: input,
      include: { category: true },
    })
  }

export const updateGroceryListItem: MutationResolvers['updateGroceryListItem'] =
  ({ id, input }) => {
    // input now contains categoryId instead of category string
    return db.groceryListItem.update({
      data: input,
      where: { id },
      include: { category: true },
    })
  }

export const deleteGroceryListItem: MutationResolvers['deleteGroceryListItem'] =
  ({ id }) => {
    return db.groceryListItem.delete({
      where: { id },
      include: { category: true }, // Include category in the returned deleted item
    })
  }

export const createMultipleGroceryListItems: MutationResolvers['createMultipleGroceryListItems'] =
  async ({ inputs }) => {
    // inputs now contain categoryId (Int) instead of category (String)
    console.log('[CMGLI] Received inputs:', JSON.stringify(inputs, null, 2))
    const addedItems: (PrismaGroceryListItem & { category: PrismaCategory | null })[] = [] // Adjusted type for include
    const skippedItemNames: string[] = []

    const existingDbItems = await db.groceryListItem.findMany({
      select: { name: true, categoryId: true }, // Select categoryId
    })
    console.log(
      '[CMGLI] Fetched existingDbItems:',
      JSON.stringify(existingDbItems, null, 2)
    )

    const existingDbItemKeys = new Set(
      existingDbItems.map((item) => {
        const nameKey = item.name.toLowerCase()
        // categoryId can be null, handle it for key generation
        const categoryIdKey = item.categoryId === null ? '__null_category_id__' : item.categoryId
        return `${nameKey}::${categoryIdKey}`
      })
    )
    console.log(
      '[CMGLI] Generated existingDbItemKeys:',
      Array.from(existingDbItemKeys)
    )

    const itemsToCreateData: Array<typeof inputs[0]> = []
    const processedInputKeysInBatch = new Set<string>()

    for (const input of inputs) {
      const inputNameKey = input.name.toLowerCase()
      // input.categoryId can be null from GraphQL input CreateGroceryListItemInput
      const inputCategoryIdKey = input.categoryId === null || input.categoryId === undefined ? '__null_category_id__' : input.categoryId
      const currentInputKey = `${inputNameKey}::${inputCategoryIdKey}`

      if (processedInputKeysInBatch.has(currentInputKey)) {
        continue
      }
      processedInputKeysInBatch.add(currentInputKey)

      console.log(
        `[CMGLI] Processing input item: ${input.name}, categoryId: ${input.categoryId}. Generated key: ${currentInputKey}`
      )
      if (existingDbItemKeys.has(currentInputKey)) {
        skippedItemNames.push(input.name)
        console.log(
          `[CMGLI] Item ${input.name} (${currentInputKey}) marked as SKIPPED (already exists in DB).`
        )
      } else {
        itemsToCreateData.push(input) // input contains name, categoryId, purchased
        console.log(
          `[CMGLI] Item ${input.name} (${currentInputKey}) marked for CREATION.`
        )
      }
    }

    console.log(
      '[CMGLI] Items marked for creation (itemsToCreateData):',
      JSON.stringify(itemsToCreateData, null, 2)
    )

    if (itemsToCreateData.length > 0) {
      try {
        const successfullyCreatedItems: (PrismaGroceryListItem & { category: PrismaCategory | null })[] = []
        await db.$transaction(async (prisma) => {
          for (const itemData of itemsToCreateData) {
            const createdItem = await prisma.groceryListItem.create({
              data: itemData, // itemData is CreateGroceryListItemInput (name, categoryId, purchased)
              include: { category: true },
            })
            successfullyCreatedItems.push(createdItem)
          }
        })
        addedItems.push(...successfullyCreatedItems)
      } catch (error) {
        console.error(
          'Error in createMultipleGroceryListItems transaction:',
          error
        )
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
      addedItems,
      skippedItems: skippedItemNames,
    }
  }

export const addPantryItemsToGroceryList: MutationResolvers['addPantryItemsToGroceryList'] =
  async ({ inputs }: { inputs: AddPantryItemToGroceryInput[] }) => {
    const addedItems: (PrismaGroceryListItem & { category: PrismaCategory | null })[] = []
    const skippedItems: string[] = []
    let addedCount = 0
    let skippedCount = 0

    // Using a transaction to ensure all operations succeed or none do.
    await db.$transaction(async (prisma) => {
      for (const input of inputs) {
        const existingItem = await prisma.groceryListItem.findFirst({
          where: {
            name: input.name,
            categoryId: input.categoryId,
          },
        })

        if (existingItem) {
          // Item exists. If it's purchased, un-purchase it.
          if (existingItem.purchased) {
            const updatedItem = await prisma.groceryListItem.update({
              where: { id: existingItem.id },
              data: { purchased: false },
              include: { category: true },
            })
            addedItems.push(updatedItem)
            addedCount++
          } else {
            // Item exists and is not purchased, so skip it.
            skippedItems.push(input.name)
            skippedCount++
          }
        } else {
          // Item does not exist, create it.
          const createData = {
            name: input.name,
            purchased: false,
            ...(input.categoryId && {
              category: {
                connect: { id: input.categoryId },
              },
            }),
          }
          const createdItem = await prisma.groceryListItem.create({
            data: createData,
            include: { category: true },
          })
          addedItems.push(createdItem)
          addedCount++
        }
      }
    })

    return {
      addedCount,
      skippedCount,
      addedItems,
      skippedItems,
    }
  }

export const deleteGroceryListItemsByCategoryId: MutationResolvers['deleteGroceryListItemsByCategoryId'] =
  async ({ categoryId }) => {
    console.log(`[DGBCI] Attempting to delete items for categoryId: ${categoryId}`)
    if (categoryId === null || categoryId === undefined) {
      console.error('[DGBCI] CategoryId cannot be null or undefined for deletion.')
      return { count: 0 }
    }
    try {
      const result = await db.groceryListItem.deleteMany({
        where: { categoryId },
      })
      console.log(
        `[DGBCI] Successfully deleted ${result.count} items for categoryId: ${categoryId}`
      )
      return {
        count: result.count,
      }
    } catch (error) {
      console.error(
        `[DGBCI] Error deleting grocery items by categoryId ${categoryId}:`,
        error
      )
      return { count: 0 }
    }
  }
