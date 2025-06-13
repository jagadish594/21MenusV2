import type {
  QueryResolvers,
  MutationResolvers,
  UpsertPantryItemFromGroceryInput,
  PantryItemStatus,
  SyncGroceryItemToPantryInput,
  // GraphQLGroceryListItem was unused after removing explicit cast
} from 'types/graphql'

import { db } from 'src/lib/db'

export const pantryItems: QueryResolvers['pantryItems'] = () => {
  return db.pantryItem.findMany({
    include: { category: true },
    orderBy: [{ category: { name: 'asc' } }, { order: 'asc' }],
  })
}

export const pantryItem: QueryResolvers['pantryItem'] = ({ id }) => {
  return db.pantryItem.findUnique({
    where: { id },
    include: { category: true },
  })
}

export const createPantryItem: MutationResolvers['createPantryItem'] = ({
  input,
}) => {
  return db.pantryItem.create({
    data: input, // input now contains categoryId directly
    include: { category: true },
  })
}

export const updatePantryItem: MutationResolvers['updatePantryItem'] = ({
  id,
  input,
}) => {
  return db.pantryItem.update({
    data: input, // input now contains categoryId directly
    where: { id },
    include: { category: true },
  })
}

export const deletePantryItem: MutationResolvers['deletePantryItem'] = ({
  id,
}) => {
  return db.pantryItem.delete({
    where: { id },
  })
}

export const updatePantryItemOrders: MutationResolvers['updatePantryItemOrders'] = async ({ inputs }) => {
    // inputs now contain categoryId
    return db.$transaction(
      inputs.map((input) => {
        const { id, ...data } = input
        return db.pantryItem.update({
          where: { id },
          data, // data includes order and categoryId
          include: { category: true },
        })
      })
    )
  }

export const upsertPantryItemFromGroceryItem: MutationResolvers['upsertPantryItemFromGroceryItem'] = async ({
  input,
}: { input: UpsertPantryItemFromGroceryInput }) => {
    const { name, categoryId, quantity, notes } = input // categoryId is now an Int

    const existingItem = await db.pantryItem.findFirst({
      where: { name, categoryId }, // Use categoryId for lookup
      include: { category: true },
    })

    const pantryItemData = {
      name,
      categoryId, // Use categoryId
      quantity: quantity || '1',
      notes: notes || '',
      status: 'InStock' as PantryItemStatus,
    }

    if (existingItem) {
      return db.pantryItem.update({
        where: { id: existingItem.id },
        data: {
          ...pantryItemData,
          order: existingItem.order, // Preserve existing order
        },
        include: { category: true },
      })
    } else {
      const maxOrderEntry = await db.pantryItem.findFirst({
        where: { categoryId }, // Use categoryId for ordering within the same category
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      const newOrder = (maxOrderEntry?.order ?? -1) + 1

      return db.pantryItem.create({
        data: {
          ...pantryItemData,
          order: newOrder,
        },
        include: { category: true },
      })
    }
  }

export const clearPantry: MutationResolvers['clearPantry'] = async () => {
  const { count } = await db.pantryItem.deleteMany({})
  return {
    count,
    message: `Successfully cleared ${count} item(s) from the pantry.`,
  }
}

export const syncGroceryItemToPantry: MutationResolvers['syncGroceryItemToPantry'] = async ({ input }: { input: SyncGroceryItemToPantryInput }) => {
  const { groceryListItemId } = input

  const groceryListItem = await db.groceryListItem.findUnique({
    where: { id: groceryListItemId },
    include: { category: true }, // Include category for the new pantry item if needed
  })

  if (!groceryListItem) {
    throw new Error(`GroceryListItem with id ${groceryListItemId} not found.`)
  }

  if (!groceryListItem.category) {
    // This should ideally not happen if data integrity is maintained
    throw new Error(
      `GroceryListItem with id ${groceryListItemId} does not have a category.`
    )
  }

  // Fetch all pantry items to perform a case-insensitive search in memory
  // This is a workaround for SQLite not supporting 'mode: insensitive' with 'equals'
  const allPantryItems = await db.pantryItem.findMany({
    include: { category: true }, // Include category for potential use
  })

  const existingPantryItem = allPantryItems.find(
    (item) => item.name.toLowerCase() === groceryListItem.name.toLowerCase()
  )

  let pantryItemResult = null
  let message = ''

  if (existingPantryItem) {
    if (existingPantryItem.status !== 'InStock') {
      pantryItemResult = await db.pantryItem.update({
        where: { id: existingPantryItem.id },
        data: { status: 'InStock' },
        include: { category: true },
      })
      // pantryItemResult is the updated item here
      message = `${groceryListItem.name} status updated to InStock in Pantry (Category: ${pantryItemResult.category?.name || 'N/A'}).`
    } else {
      pantryItemResult = existingPantryItem // No change, pantryItemResult is existingPantryItem
      message = `${groceryListItem.name} already exists in Pantry (Category: ${pantryItemResult.category?.name || 'N/A'}) with InStock status.`
    }
  } else {
    // Determine order for new item in its category
    const maxOrderEntry = await db.pantryItem.findFirst({
      where: { categoryId: groceryListItem.categoryId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const newOrder = (maxOrderEntry?.order ?? -1) + 1

    pantryItemResult = await db.pantryItem.create({
      data: {
        name: groceryListItem.name,
        categoryId: groceryListItem.categoryId, // Use original grocery item's category
        quantity: '1', // Default quantity
        notes: '', // Default notes
        status: 'InStock',
        order: newOrder,
      },
      include: { category: true },
    })
    // pantryItemResult is the newly created item here
    message = `${groceryListItem.name} added to Pantry (Category: ${pantryItemResult.category?.name || groceryListItem.category?.name || 'N/A'}) with InStock status.`
  }

  // Mark grocery list item as purchased
  const updatedGroceryListItem = await db.groceryListItem.update({
    where: { id: groceryListItemId },
    data: { purchased: true },
    include: { category: true }, // Ensure category is included for the return type
  })

  return {
    pantryItem: pantryItemResult,
    message,
    // Prisma's updatedGroceryListItem should align with the resolver's expected GraphQLGroceryListItem type, especially for Date fields.
    // The cast 'as GraphQLGroceryListItem' was removed to rely on Prisma's return type matching the resolver's needs.
    groceryListItem: updatedGroceryListItem,
  }
}
