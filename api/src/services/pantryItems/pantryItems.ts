import type {
  QueryResolvers,
  MutationResolvers,
  UpsertPantryItemFromGroceryInput,
  PantryItemStatus,
} from 'types/graphql'

import { db } from 'src/lib/db'

export const pantryItems: QueryResolvers['pantryItems'] = () => {
  return db.pantryItem.findMany()
}

export const pantryItem: QueryResolvers['pantryItem'] = ({ id }) => {
  return db.pantryItem.findUnique({
    where: { id },
  })
}

export const createPantryItem: MutationResolvers['createPantryItem'] = ({
  input,
}) => {
  return db.pantryItem.create({
    data: input,
  })
}

export const updatePantryItem: MutationResolvers['updatePantryItem'] = ({
  id,
  input,
}) => {
  return db.pantryItem.update({
    data: input,
    where: { id },
  })
}

export const deletePantryItem: MutationResolvers['deletePantryItem'] = ({
  id,
}) => {
  return db.pantryItem.delete({
    where: { id },
  })
}

export const updatePantryItemOrders: MutationResolvers['updatePantryItemOrders'] =
  async ({ inputs }) => {
    return db.$transaction(
      inputs.map((input) => {
        const { id, ...data } = input
        return db.pantryItem.update({
          where: { id },
          data,
        })
      })
    )
  }

export const upsertPantryItemFromGroceryItem: MutationResolvers['upsertPantryItemFromGroceryItem'] =
  async ({ input }: { input: UpsertPantryItemFromGroceryInput }) => {
    const { name, category, quantity, notes } = input

    const existingItem = await db.pantryItem.findFirst({
      where: { name, category },
    })

    const pantryItemData = {
      name,
      category,
      quantity: quantity || '1', // Default quantity if not provided
      notes: notes || '',
      status: 'InStock' as PantryItemStatus, // Set status to InStock
    }

    if (existingItem) {
      // Item exists, update it
      return db.pantryItem.update({
        where: { id: existingItem.id },
        data: {
          ...pantryItemData,
          // Preserve existing order or update if needed based on your logic
          order: existingItem.order,
        },
      })
    } else {
      // Item does not exist, create it
      // Determine the order for the new item
      const maxOrderEntry = await db.pantryItem.findFirst({
        where: { category },
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      const newOrder = (maxOrderEntry?.order ?? -1) + 1

      return db.pantryItem.create({
        data: {
          ...pantryItemData,
          order: newOrder,
        },
      })
    }
  }
