import { Prisma } from '@prisma/client'

import type { QueryResolvers, MutationResolvers } from 'types/graphql'

import { UserInputError } from '@redwoodjs/graphql-server'

import { db } from 'src/lib/db'

export const categories: QueryResolvers['categories'] = () => {
  return db.category.findMany({ orderBy: { name: 'asc' } })
}

export const createCategory: MutationResolvers['createCategory'] = async ({
  input,
}) => {
  // Case-insensitive check for existing category name using raw SQL for SQLite compatibility
  const categories: { id: number; name: string }[] = await db.$queryRaw(
    Prisma.sql`SELECT id, name FROM "Category" WHERE LOWER(name) = LOWER(${input.name}) LIMIT 1`
  )
  const existingCategory = categories[0]

  if (existingCategory) {
    throw new UserInputError(`A category named "${input.name}" already exists.`)
  }

  return db.category.create({
    data: input,
  })
}

export const deleteCategory: MutationResolvers['deleteCategory'] = async ({ id }) => {
  // Use a transaction to ensure both operations succeed or fail together
  return db.$transaction(async (prisma) => {
    // First, delete all pantry items associated with the category
    await prisma.pantryItem.deleteMany({
      where: { categoryId: id },
    });

    // Then, delete the category itself
    const deletedCategory = await prisma.category.delete({
      where: { id },
    });

    return deletedCategory;
  });
};
