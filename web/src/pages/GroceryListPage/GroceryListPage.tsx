import React, { useState, useEffect, useMemo } from 'react'

import gql from 'graphql-tag'
import type {
  CategoriesQuery,
  CategoriesQueryVariables,
  CreateGroceryListItemMutation,
  CreateGroceryListItemMutationVariables,
  DeleteGroceryListItemMutation,
  DeleteGroceryListItemMutationVariables,
  DeleteGroceryListItemsByCategoryIdMutation,
  DeleteGroceryListItemsByCategoryIdMutationVariables,
  GroceryListItem as GraphQLGroceryListItem,
  GroceryListItemsQuery,
  GroceryListItemsQueryVariables,
  UpdateGroceryListItemMutation,
  UpdateGroceryListItemMutationVariables,
  UpsertPantryItemFromGroceryItemMutation,
  UpsertPantryItemFromGroceryItemMutationVariables,
  SyncPantryItemPayload, // Added for the new mutation
  SyncGroceryItemToPantryInput, // Added for the new mutation
} from 'types/graphql'

import { MetaTags, useQuery, useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { QUERY as PANTRY_ITEMS_QUERY } from 'src/components/PantryItemsCell/PantryItemsCell' // For refetching pantry


type GroceryItem = GraphQLGroceryListItem

export const GET_CATEGORIES_QUERY = gql`
  query CategoriesQuery {
    categories {
      id
      name
    }
  }
`

export const GET_GROCERY_LIST_ITEMS_QUERY = gql`
  query GroceryListItemsQuery {
    groceryListItems {
      id
      name
      category {
        id
        name
      }
      purchased
      createdAt
      updatedAt
    }
  }
`

const CREATE_GROCERY_LIST_ITEM_MUTATION = gql`
  mutation CreateGroceryListItemMutation($input: CreateGroceryListItemInput!) {
    createGroceryListItem(input: $input) {
      id
      name
      category {
        id
        name
      }
      purchased
    }
  }
`

const UPDATE_GROCERY_LIST_ITEM_MUTATION = gql`
  mutation UpdateGroceryListItemMutation(
    $id: Int!
    $input: UpdateGroceryListItemInput!
  ) {
    updateGroceryListItem(id: $id, input: $input) {
      id
      name
      category {
        id
        name
        createdAt
        updatedAt
      }
      purchased
    }
  }
`

const DELETE_GROCERY_LIST_ITEM_MUTATION = gql`
  mutation DeleteGroceryListItemMutation($id: Int!) {
    deleteGroceryListItem(id: $id) {
      id
    }
  }
`

// Define the new mutation for upserting pantry items from grocery items
const UPSERT_PANTRY_ITEM_FROM_GROCERY_ITEM_MUTATION = gql`
  mutation UpsertPantryItemFromGroceryItemMutation(
    $input: UpsertPantryItemFromGroceryInput!
  ) {
    upsertPantryItemFromGroceryItem(input: $input) {
      id # Or whatever fields you want to return
      name
      category {
        id
        name
      }
      quantity
      notes
    }
  }
`

const DELETE_GROCERY_LIST_ITEMS_BY_CATEGORY_ID_MUTATION = gql`
  mutation DeleteGroceryListItemsByCategoryIdMutation($categoryId: Int!) {
    deleteGroceryListItemsByCategoryId(categoryId: $categoryId) {
      count
    }
  }
`
// Moved DELETE_GROCERY_LIST_ITEMS_BY_CATEGORY_MUTATION above its usage

const SYNC_GROCERY_ITEM_TO_PANTRY_MUTATION = gql`
  mutation SyncGroceryItemToPantryMutation(
    $input: SyncGroceryItemToPantryInput!
  ) {
    syncGroceryItemToPantry(input: $input) {
      pantryItem {
        id
        name
        status
        category {
          id
          name
        }
      }
      groceryListItem {
        id
        purchased
        name
        category {
          id
          name
        }
      }
      message
    }
  }
`

const GroceryListPage: React.FC = () => {
  // State for the new item form
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategoryId, setNewItemCategoryId] = useState<string>('')

  // --- GraphQL Queries ---
  // Fetch grocery list items
  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery<GroceryListItemsQuery, GroceryListItemsQueryVariables>(
    GET_GROCERY_LIST_ITEMS_QUERY,
    {
      fetchPolicy: 'network-only',
    }
  )

  // Fetch categories for the dropdown
  const { data: categoriesData, loading: categoriesLoading } = useQuery<
    CategoriesQuery,
    CategoriesQueryVariables
  >(GET_CATEGORIES_QUERY)

  // Set default category when categories load
  useEffect(() => {
    if (
      !newItemCategoryId &&
      categoriesData?.categories &&
      categoriesData.categories.length > 0
    ) {
      setNewItemCategoryId(categoriesData.categories[0].id.toString())
    }
  }, [categoriesData, newItemCategoryId])

  // --- GraphQL Mutations ---
  // Create a new grocery list item
  const [createGroceryListItem, { loading: createLoading }] =
    useMutation<
      CreateGroceryListItemMutation,
      CreateGroceryListItemMutationVariables
    >(CREATE_GROCERY_LIST_ITEM_MUTATION, {
      onCompleted: () => {
        toast.success('Item added to grocery list!')
        refetch()
      },
      onError: (error) => {
        toast.error(`Failed to add item: ${error.message}`)
      },
    })

  // Update a grocery list item (e.g., toggle purchased status)
  const [updateGroceryListItem, { loading: updateLoading }] =
    useMutation<
      UpdateGroceryListItemMutation,
      UpdateGroceryListItemMutationVariables
    >(UPDATE_GROCERY_LIST_ITEM_MUTATION)

  // Mutation for syncing grocery item to pantry
  const [syncGroceryItemToPantry, { loading: syncToPantryLoading }] =
    useMutation<
      { syncGroceryItemToPantry: SyncPantryItemPayload }, // Wrapping the payload type
      { input: SyncGroceryItemToPantryInput } // Defining variable structure
    >(SYNC_GROCERY_ITEM_TO_PANTRY_MUTATION) // onCompleted handled inline

  // Delete a single grocery list item
  const [deleteGroceryListItem, { loading: deleteLoading }] =
    useMutation<
      DeleteGroceryListItemMutation,
      DeleteGroceryListItemMutationVariables
    >(DELETE_GROCERY_LIST_ITEM_MUTATION, {
      onCompleted: () => {
        toast.success('Item deleted.')
        refetch()
      },
      onError: (error) => {
        toast.error(`Failed to delete item: ${error.message}`)
      },
    })

  // Upsert a pantry item when a grocery item is marked as purchased
  const [upsertPantryItemFromGroceryItem] = useMutation<
    UpsertPantryItemFromGroceryItemMutation,
    UpsertPantryItemFromGroceryItemMutationVariables
  >(UPSERT_PANTRY_ITEM_FROM_GROCERY_ITEM_MUTATION, {
    onCompleted: () => {
      // This toast can be noisy, so it's commented out.
      // toast.success('Pantry updated from grocery list!')
    },
    onError: (error) => {
      toast.error(`Failed to update pantry: ${error.message}`)
    },
    refetchQueries: [{ query: PANTRY_ITEMS_QUERY }],
    awaitRefetchQueries: true,
  })

  // Delete all items in a category
  const [
    deleteGroceryListItemsByCategoryId,
    { loading: deleteByCategoryLoading },
  ] = useMutation<
    DeleteGroceryListItemsByCategoryIdMutation,
    DeleteGroceryListItemsByCategoryIdMutationVariables
  >(DELETE_GROCERY_LIST_ITEMS_BY_CATEGORY_ID_MUTATION, {
    onCompleted: (data) => {
      toast.success(
        `${data.deleteGroceryListItemsByCategoryId.count} item(s) deleted.`
      )
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to delete category items: ${error.message}`)
    },
  })

  // --- Event Handlers ---
  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newItemName.trim() || !newItemCategoryId) {
      toast.error('Please enter an item name and select a category.')
      return
    }
    createGroceryListItem({
      variables: {
        input: {
          name: newItemName.trim(),
          categoryId: parseInt(newItemCategoryId, 10),
          purchased: false,
        },
      },
    })
    setNewItemName('')
  }

  const handleDeleteItem = (itemId: number) => {
    deleteGroceryListItem({ variables: { id: itemId } })
  }

  const handleDeleteCategoryItems = (categoryId: number | null | undefined) => {
    if (typeof categoryId !== 'number') {
      toast.error('Cannot delete items for an unknown category.')
      return
    }
    deleteGroceryListItemsByCategoryId({
      variables: { categoryId },
    })
  }

  const handleTogglePurchased = async (itemId: number) => {
    const item = data?.groceryListItems.find((i) => i.id === itemId)
    if (!item) return

    const newPurchasedStatus = !item.purchased

    if (newPurchasedStatus) {
      // Item is being marked AS PURCHASED - use the new sync mutation
      try {
        await syncGroceryItemToPantry({
          variables: { input: { groceryListItemId: itemId } },
          refetchQueries: [
            { query: GET_GROCERY_LIST_ITEMS_QUERY },
            { query: PANTRY_ITEMS_QUERY }, // Refetch pantry items as well
          ],
          onCompleted: (syncData) => {
            toast.success(syncData.syncGroceryItemToPantry.message)
            // The grocery list is refetched, so no manual cache update needed here for it.
          },
          onError: (error) => {
            toast.error(`Error syncing to pantry: ${error.message}`)
          },
        })
      } catch (error) {
        console.error('Failed to sync grocery item to pantry:', error)
        toast.error('Failed to sync item to pantry.')
      }
    } else {
      // Item is being marked AS NOT PURCHASED - use existing update logic
      try {
        await updateGroceryListItem({
          variables: { id: itemId, input: { purchased: false } },
          // Optimistic update or refetch can be used here as before
          refetchQueries: [{ query: GET_GROCERY_LIST_ITEMS_QUERY }], 
          onCompleted: (updatedData) => {
            toast.success(
              `"${updatedData.updateGroceryListItem.name}" marked as not purchased.`
            )
          },
          onError: (error) => {
            toast.error(`Error updating item: ${error.message}`)
          },
        })
      } catch (error) {
        console.error('Failed to mark item as not purchased:', error)
        toast.error('Failed to update item status.')
      }
    }
  }

  // --- Data Processing for Rendering ---
  const groupedItems = useMemo(() => {
    const groups: Record<string, GroceryItem[]> = {}
    data?.groceryListItems?.forEach((item) => {
      const categoryName = item.category?.name || 'Uncategorized'
      if (!groups[categoryName]) {
        groups[categoryName] = []
      }
      groups[categoryName].push(item)
    })
    // Sort categories alphabetically
    const sortedGroups: Record<string, GroceryItem[]> = {}
    Object.keys(groups)
      .sort()
      .forEach((key) => {
        sortedGroups[key] = groups[key]
      })
    return sortedGroups
  }, [data])

  // --- Render Logic ---
  if (queryLoading) return <p>Loading...</p>
  if (queryError) return <p>Error loading grocery list: {queryError.message}</p>

  return (
    <>
      <MetaTags title="Grocery List" description="Manage your grocery list" />

      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Grocery List</h1>

        {/* Add Item Form */}
        <form
          onSubmit={handleAddItem}
          className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow md:flex-row md:items-end"
        >
          <div className="flex-grow">
            <label
              htmlFor="itemName"
              className="block text-sm font-medium text-gray-700"
            >
              Item Name
            </label>
            <input
              type="text"
              id="itemName"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
              placeholder="e.g., Milk"
            />
          </div>
          <div>
            <label
              htmlFor="itemCategory"
              className="block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              id="itemCategory"
              value={newItemCategoryId}
              onChange={(e) => setNewItemCategoryId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm"
              disabled={categoriesLoading}
            >
              {categoriesData?.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={createLoading}
            className="w-full rounded-md bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 md:w-auto"
          >
            Add Item
          </button>
        </form>

        {/* Display Items */}
        <div className="space-y-6">
          {(data?.groceryListItems || []).length === 0 ? (
            <p className="py-4 text-center italic text-gray-500">
              Your grocery list is empty. Add some items above!
            </p>
          ) : (
            Object.keys(groupedItems).map((categoryName) => {
              const itemsInCategory = groupedItems[categoryName]
              const categoryId = itemsInCategory[0]?.category?.id

              return (
                <div key={categoryName} className="rounded-lg bg-white p-4 shadow">
                  <div className="mb-3 flex items-center justify-between border-b pb-2">
                    <h2 className="text-xl font-semibold text-gray-700">
                      {categoryName}
                    </h2>
                    <button
                      onClick={() => handleDeleteCategoryItems(categoryId)}
                      disabled={deleteByCategoryLoading}
                      className="rounded bg-red-500 px-2 py-1 text-xs text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50"
                      aria-label={`Delete all items in ${categoryName}`}
                    >
                      Delete All
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {itemsInCategory.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between rounded p-2 hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <button
                            onClick={() => handleTogglePurchased(item.id)}
                            className="mr-2"
                            disabled={updateLoading || syncToPantryLoading}
                          >
                            {item.purchased ? '☑️' : '🔲'}
                          </button>
                          <span
                            className={`${
                              item.purchased ? 'text-gray-500 line-through' : ''
                            }`}
                          >
                            {item.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deleteLoading}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          🗑️
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

export default GroceryListPage
