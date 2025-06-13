// PantryItemsCell.tsx
import { useState, useEffect, useMemo } from 'react'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PantryItemStatus, // Import PantryItemStatus as a type
  DeletePantryItemMutation,
  DeletePantryItemMutationVariables,
  PantryItem,
  PantryItemsQuery,
  PantryItemsQueryVariables,
  UpdatePantryItemOrdersMutation,
  UpdatePantryItemOrdersMutationVariables,
  UpdatePantryItemOrderInput,
  AddPantryItemToGroceryInput,
  AddPantryItemsToGroceryListMutation,
  DeleteCategoryMutation,
  DeleteCategoryMutationVariables,
  // Consolidated here
  SuggestMealsFromPantryMutation,
  SuggestMealsFromPantryMutationVariables,
} from 'types/graphql'

import {
  useMutation,
  type CellFailureProps,
  type CellSuccessProps,
  type TypedDocumentNode,
} from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

// Helper component to highlight matched text
interface HighlightMatchProps {
  text: string
  highlight: string
}

const HighlightMatch: React.FC<HighlightMatchProps> = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <>{text}</>
  }
  const regex = new RegExp(
    `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  )
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <strong key={index} className="bg-yellow-200">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </>
  )
}

import EditPantryItemForm from 'src/components/EditPantryItemForm'
import { GET_GROCERY_LIST_ITEMS_QUERY } from 'src/pages/GroceryListPage/GroceryListPage'
export const QUERY: TypedDocumentNode<
  PantryItemsQuery,
  PantryItemsQueryVariables
> = gql`
  query PantryItemsQuery {
    pantryItems {
      id
      name
      category {
        id
        name
        createdAt
        updatedAt
      }
      order
      quantity
      notes
      status
      createdAt
      updatedAt
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => (
  <div className="py-4 text-center italic text-gray-500">
    Your pantry is empty. Let&apos;s add some items!
  </div>
)

export const Failure = ({
  error,
}: CellFailureProps<PantryItemsQueryVariables>) => (
  <div style={{ color: 'red' }}>Error: {error?.message}</div>
)

const DELETE_CATEGORY_MUTATION = gql`
  mutation DeleteCategoryMutation($id: Int!) {
    deleteCategory(id: $id) {
      id
    }
  }
`

const DELETE_PANTRY_ITEM_MUTATION = gql`
  mutation DeletePantryItemMutation($id: Int!) {
    deletePantryItem(id: $id) {
      id
    }
  }
`

const UPDATE_PANTRY_ITEM_ORDERS_MUTATION = gql`
  mutation UpdatePantryItemOrdersMutation(
    $inputs: [UpdatePantryItemOrderInput!]!
  ) {
    updatePantryItemOrders(inputs: $inputs) {
      id # Minimal return, relying on refetch for full data
      order
      category {
        id
        name
      }
    }
  }
`

const ADD_PANTRY_ITEMS_TO_GROCERY_LIST_MUTATION: TypedDocumentNode<
  AddPantryItemsToGroceryListMutation,
  { inputs: AddPantryItemToGroceryInput[] }
> = gql`
  mutation AddPantryItemsToGroceryListMutation(
    $inputs: [AddPantryItemToGroceryInput!]!
  ) {
    addPantryItemsToGroceryList(inputs: $inputs) {
      addedCount
      skippedCount
      addedItems {
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
      skippedItems
    }
  }
`

const SUGGEST_MEALS_MUTATION = gql`
  mutation SuggestMealsFromPantryMutation($itemNames: [String!]!) {
    suggestMealsFromPantry(itemNames: $itemNames)
  }
`

interface SortablePantryItemProps {
  searchTerm?: string
  isSelected: boolean
  onToggleSelectItem: (itemId: number) => void
  item: PantryItem
  isEditing: boolean
  onEditClick: (item: PantryItem) => void
  onDeleteClick: (id: number, name: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  isOverlay?: boolean
}

const SortablePantryItem = ({
  item,
  isEditing,
  onEditClick,
  onDeleteClick,
  onSaveEdit,
  onCancelEdit,
  isOverlay,
  isSelected,
  onToggleSelectItem,
  searchTerm,
}: SortablePantryItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id.toString(),
    data: { item, type: 'item' },
    disabled: isEditing,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging && !isOverlay ? 0.3 : 1,
  }

  const itemClasses = `py-1 ${
    isDragging && !isOverlay ? 'opacity-30' : ''
  } ${isOverlay ? 'shadow-xl bg-white rounded' : ''}`

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={itemClasses}
    >
      {isEditing ? (
        <EditPantryItemForm
          pantryItem={item}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
        />
      ) : (
        <div className="flex items-center justify-between rounded bg-white p-2 ring-1 ring-gray-200 hover:bg-gray-50">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation() // Important to prevent drag initiation
              onToggleSelectItem(item.id)
            }}
            onClick={(e) => e.stopPropagation()} // Stop click propagation as well
            className="mr-3 h-5 w-5 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={isOverlay || isEditing}
            aria-label={`Select item ${item.name}`}
          />
          <div className="flex flex-grow flex-col">
            <div className="flex-1 truncate">
              <HighlightMatch text={item.name} highlight={searchTerm || ''} />{' '}
              <span className="text-xs text-gray-500">({item.status})</span>
            </div>
            {item.quantity && (
              <span className="text-sm text-gray-600">
                Quantity: {item.quantity}
              </span>
            )}
            {item.notes && (
              <span className="text-sm text-gray-500">
                Notes:{' '}
                <HighlightMatch
                  text={item.notes}
                  highlight={searchTerm || ''}
                />
              </span>
            )}
          </div>
          <div className="flex-shrink-0 space-x-2">
            <button
              onClick={() => onEditClick(item)}
              className="text-sm text-blue-500 hover:underline"
              type="button"
              disabled={isOverlay}
            >
              Edit
            </button>
            <button
              onClick={() => onDeleteClick(item.id, item.name)}
              className="text-sm text-red-500 hover:underline"
              type="button"
              disabled={isOverlay}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

interface DroppableCategoryProps {
  searchTerm?: string
  selectedItemIds: Set<number>
  onToggleSelectItem: (itemId: number) => void
  id: string
  categoryName: string
  items: PantryItem[]
  editingItemId: number | null
  onEditClick: (item: PantryItem) => void
  onDeleteClick: (id: number, name: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDeleteCategory: (categoryName: string) => void
}

const DroppableCategory = ({
  id,
  categoryName,
  items,
  editingItemId,
  onEditClick,
  onDeleteClick,
  onSaveEdit,
  onCancelEdit,
  selectedItemIds,
  onToggleSelectItem,
  searchTerm,
  onDeleteCategory,
}: DroppableCategoryProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: 'category', categoryId: id },
  })

  const itemIds = items.map((item) => item.id.toString())

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg p-4 shadow ${
        isOver ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="mb-3 text-xl font-bold text-gray-800">{categoryName}</h2>
        {categoryName !== 'Uncategorized' && (
          <button
            onClick={() => onDeleteCategory(categoryName)}
            className="rw-button rw-button-small rw-button-red"
            title={`Delete ${categoryName} category`}
          >
            Delete Category
          </button>
        )}
      </div>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <ul className="min-h-[60px] space-y-2">
          {items.map((item) => (
            <SortablePantryItem
              key={item.id}
              item={item}
              isEditing={editingItemId === item.id}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              isSelected={selectedItemIds.has(item.id)}
              onToggleSelectItem={onToggleSelectItem}
              searchTerm={searchTerm}
            />
          ))}
          {items.length === 0 && (
            <li className="py-2 text-center text-sm italic text-gray-400">
              Drag items here or add new ones.
            </li>
          )}
        </ul>
      </SortableContext>
    </div>
  )
}
export const Success = ({
  pantryItems: initialPantryItems,
  refetch: _refetch, // Now correctly prefixed in the Success component's props destructuring
  error: _pantryQueryError, // Now correctly prefixed
}: CellSuccessProps<PantryItemsQuery, PantryItemsQueryVariables> & { refetch: () => void; error?: ApolloError }) => {
  const [mealSuggestions, setMealSuggestions] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null)

  const allCategories = useMemo(() => {
    const categories = new Map<string, PantryItem['category']>()
    initialPantryItems.forEach((item) => {
      if (item.category) {
        categories.set(item.category.name, item.category)
      }
    })
    return categories
  }, [initialPantryItems])

  const [
    suggestMeals,
    { loading: suggestMealsLoading }, // Removed data and error as they are handled in onCompleted/onError
  ] = useMutation<
    SuggestMealsFromPantryMutation,
    SuggestMealsFromPantryMutationVariables
  >(SUGGEST_MEALS_MUTATION, {
    onCompleted: (data) => {
      if (data.suggestMealsFromPantry) {
        setMealSuggestions(data.suggestMealsFromPantry)
        toast.success('Meal suggestions loaded!')
      } else {
        toast.error('Could not fetch meal suggestions.')
        setMealSuggestions([]) // Clear suggestions if fetch failed or returned no data
      }
    },
    onError: (error) => {
      toast.error(`Error suggesting meals: ${error.message}`)
      setMealSuggestions([]) // Clear suggestions on error
    },
  })
  const [currentPantryItems, _setCurrentPantryItems] = useState<PantryItem[]>(
    initialPantryItems.map((item) => ({
      ...item,
      status: item.status as PantryItemStatus,
    }))
  ) 



  const [addPantryItemsToGroceryList, { loading: addItemsLoading }] = useMutation<
    AddPantryItemsToGroceryListMutation,
    { inputs: AddPantryItemToGroceryInput[] }
  >(ADD_PANTRY_ITEMS_TO_GROCERY_LIST_MUTATION, {
    onCompleted: (data) => {
      // Always clear the selection after the mutation is complete.
      setSelectedItemIds(new Set())

      const { addedCount, skippedCount, skippedItems } =
        data.addPantryItemsToGroceryList

      // Provide feedback to the user based on the outcome.
      if (addedCount > 0) {
        toast.success(`${addedCount} item(s) added to the grocery list.`)
      }

      if (skippedCount > 0) {
        const message = `${skippedCount} item(s) were already on the list: ${skippedItems?.join(
          ', '
        )}`
        toast(message, { icon: 'ℹ️', duration: 6000 })
      }

      if (addedCount === 0 && skippedCount === 0) {
        toast('No new items were added to the grocery list.', { icon: 'ℹ️' })
      }
    },
    onError: (error) => {
      toast.error(`Failed to add items: ${error.message}`)
    },
    refetchQueries: [
      { query: GET_GROCERY_LIST_ITEMS_QUERY as TypedDocumentNode<unknown, unknown> }, // Cast to unknown if specific types cause issues before generation
    ],
  })

  const filteredPantryItems = useMemo(() => {
    if (!searchTerm) {
      return currentPantryItems
    }
    return currentPantryItems.filter((item) => {
      const term = searchTerm.toLowerCase()
      const nameMatch = item.name.toLowerCase().includes(term)
      const notesMatch = item.notes?.toLowerCase().includes(term) ?? false
      return nameMatch || notesMatch
    })
  }, [currentPantryItems, searchTerm])
  const [selectedItemIds, setSelectedItemIds] = useState(new Set<number>())

  const hasSelectedInStockItem = useMemo(() => {
    if (selectedItemIds.size === 0) {
      return false
    }
    for (const id of selectedItemIds) {
      const selectedItem = currentPantryItems.find((item) => item.id === id)
      if (selectedItem && selectedItem.status === 'InStock') {
        return true
      }
    }
    return false
  }, [selectedItemIds, currentPantryItems])

  const countSelectedOutOfStock = filteredPantryItems.filter(
    (item) => selectedItemIds.has(item.id) && item.status === 'OutOfStock'
  ).length

  const handleSuggestMeals = async () => {
    const availableItems = currentPantryItems
      .filter((item) => item.status === 'InStock' || item.status === 'LowStock')
      .map((item) => item.name)

    if (availableItems.length === 0) {
      toast.error(
          'No items in pantry are suitable for meal suggestions (must be In Stock or Low Stock).'
        )
      setMealSuggestions([])
      return
    }

    suggestMeals({
      variables: { itemNames: availableItems },
    })
  }

  const handleToggleSelectItem = (itemId: number) => {
    setSelectedItemIds((prevSelectedIds) => {
      const newSelectedIds = new Set(prevSelectedIds)
      if (newSelectedIds.has(itemId)) {
        newSelectedIds.delete(itemId)
      } else {
        newSelectedIds.add(itemId)
      }
      return newSelectedIds
    })
  }

  const handleAddSelectedToGroceryList = () => {
    if (selectedItemIds.size === 0) {
      toast.error('No items selected.')
      return
    }

    const itemsToAdd = currentPantryItems.filter(
      (item) => selectedItemIds.has(item.id) && item.status === 'OutOfStock'
    )

    if (itemsToAdd.length === 0) {
      toast(
        'No selected items are "Out of Stock". Only "Out of Stock" items can be added to the grocery list.',
        { icon: 'ℹ️' }
      )
      return
    }

    const mutationInputs: AddPantryItemToGroceryInput[] = itemsToAdd.map(
      (item) => ({
        name: item.name,
        categoryId: item.category ? item.category.id : null,
        quantity: item.quantity,
      })
    )

    addPantryItemsToGroceryList({ variables: { inputs: mutationInputs } })
  }

  const [deletePantryItem] = useMutation<
    DeletePantryItemMutation,
    DeletePantryItemMutationVariables
  >(DELETE_PANTRY_ITEM_MUTATION, {
    onCompleted: () => {
      toast.success('Pantry item deleted')
    },
    onError: (error) => {
      toast.error(error.message)
    },
    refetchQueries: [{ query: QUERY }],
  })

  const [updatePantryItemOrders] = useMutation<
    UpdatePantryItemOrdersMutation,
    UpdatePantryItemOrdersMutationVariables
  >(UPDATE_PANTRY_ITEM_ORDERS_MUTATION, {
    onCompleted: () => {
      toast.success('Pantry items reordered/moved');
    },
    onError: (error) => {
      toast.error(`Error reordering items: ${error.message}`);
    },
    // No refetch here, optimistic update is sufficient
  });

  const [deleteCategory] = useMutation<
    DeleteCategoryMutation,
    DeleteCategoryMutationVariables
  >(DELETE_CATEGORY_MUTATION, {
    onCompleted: () => {
      toast.success('Category deleted successfully.');
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
    refetchQueries: [{ query: QUERY }],
  });

  const onDeleteClick = (id: number, name: string) => {
    if (editingItem?.id === id) {
      setEditingItem(null);
    }
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deletePantryItem({ variables: { id } });
    }
  };

  const handleDeleteCategory = (categoryName: string) => {
    if (
      confirm(
        `Are you sure you want to delete the "${categoryName}" category? This will also delete all items within it.`
      )
    ) {
      deleteCategory({ variables: { id: allCategories.get(categoryName)?.id } });
    }
  };

  const handleEditClick = (item: PantryItem) => {
    setEditingItem(item)
  }

  const handleSaveEdit = () => {
    setEditingItem(null)
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {})
  )

  const handleDragStart = (_event: DragEndEvent) => {
    // This function is a placeholder for any logic that needs to run
    // when a drag operation begins, such as setting state for a visual
    // drag overlay. Currently, no such logic is implemented.
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) {
      return;
    }

    _setCurrentPantryItems((currentItems) => {
      const activeItem = currentItems.find((item) => item.id.toString() === activeId);
      if (!activeItem) return currentItems;

      const overItem = currentItems.find((item) => item.id.toString() === overId);

      let targetCategory: PantryItem['category'] | null | undefined = undefined;

      if (over.data.current?.type === 'category') {
        const categoryName = over.id.toString();
        targetCategory = allCategories.get(categoryName);
      } else if (over.data.current?.type === 'item' && overItem) {
        targetCategory = overItem.category;
      } else if (
        over.data.current?.type === 'category-container' &&
        over.id === 'Uncategorized'
      ) {
        targetCategory = null;
      }

      if (typeof targetCategory === 'undefined') {
        return currentItems;
      }

      const itemsWithUpdatedCategory = currentItems.map((item) => {
        if (item.id.toString() === activeId) {
          return { ...item, category: targetCategory };
        }
        return item;
      });

      const oldIndex = itemsWithUpdatedCategory.findIndex(
        (item) => item.id.toString() === activeId
      );
      const newIndex = overItem
        ? itemsWithUpdatedCategory.findIndex(
            (item) => item.id.toString() === overId
          )
        : -1;

      let reorderedItems = itemsWithUpdatedCategory;
      if (newIndex !== -1) {
        reorderedItems = arrayMove(itemsWithUpdatedCategory, oldIndex, newIndex);
      }

      const changesToPersist: UpdatePantryItemOrderInput[] = [];
      const categoriesToUpdate = new Set<string>();
      const originalCategoryName = activeItem.category?.name || 'Uncategorized';
      const newCategoryName = targetCategory?.name || 'Uncategorized';
      categoriesToUpdate.add(originalCategoryName);
      categoriesToUpdate.add(newCategoryName);

      categoriesToUpdate.forEach((categoryName) => {
        reorderedItems
          .filter(
            (item) => (item.category?.name || 'Uncategorized') === categoryName
          )
          .forEach((item, index) => {
            const originalItem = currentItems.find((i) => i.id === item.id);
            if (
              originalItem &&
              (originalItem.order !== index ||
                (originalItem.category?.name || 'Uncategorized') !==
                  (item.category?.name || 'Uncategorized'))
            ) {
              changesToPersist.push({
                id: item.id,
                order: index,
                categoryId: item.category?.id,
              });
            }
          });
      });

      if (changesToPersist.length > 0) {
        updatePantryItemOrders({ variables: { inputs: changesToPersist } });
      }

      return reorderedItems;
    });
  };

  const groupedItems = filteredPantryItems.reduce(
    (acc, item) => {
      const categoryKey = item.category?.name || 'Uncategorized'
      if (!acc[categoryKey]) {
        acc[categoryKey] = []
      }
      acc[categoryKey].push(item)
      return acc
    },
    {} as Record<string, PantryItem[]>
  )

  for (const categoryKey in groupedItems) {
    groupedItems[categoryKey].sort(
      (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)
    )
  }

  const categories = Object.keys(groupedItems).sort()
  if (categories.includes('Uncategorized')) {
    categories.splice(categories.indexOf('Uncategorized'), 1)
    categories.push('Uncategorized')
  }

  useEffect(() => {
    _setCurrentPantryItems(
      initialPantryItems.map((item) => ({
        ...item,
        status: item.status as PantryItemStatus,
      }))
    )
  }, [initialPantryItems])

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(inputValue)
    }, 300) 

    return () => {
      clearTimeout(handler)
    }
  }, [inputValue])

  return (
    <>
      <div className="mb-4 px-1">
        <input
          type="text"
          placeholder="Search pantry items..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="rw-input w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div className="my-4 text-center">
        {selectedItemIds.size > 0 && hasSelectedInStockItem && (
          <p className="my-2 text-sm text-orange-600">
            Note: Only &apos;Out of Stock&apos; items will be added to the
            Grocery List.
          </p>
        )}
        <button
          type="button"
          onClick={handleAddSelectedToGroceryList}
          disabled={selectedItemIds.size === 0 || addItemsLoading || countSelectedOutOfStock === 0}
          className="rw-button rw-button-green"
        >
          {addItemsLoading ? 'Adding...' : `Add ${countSelectedOutOfStock} Selected 'Out of Stock' to Grocery List`}
        </button>
      </div>

      {/* Suggest Meals Section */}
      <div className="my-4 text-center">
        <button
          type="button"
          onClick={handleSuggestMeals}
          className="rw-button rw-button-blue mt-4"
          disabled={suggestMealsLoading}
        >
          {suggestMealsLoading ? 'Suggesting...' : 'Suggest Meals'}
        </button>
      </div>

      {suggestMealsLoading && (
        <div className="py-4 text-center italic text-gray-500">
          Loading meal suggestions...
        </div>
      )}

      {mealSuggestions.length > 0 && !suggestMealsLoading && (
        <div className="my-4 rounded-lg border border-gray-200 bg-white p-4 shadow">
          <h3 className="mb-3 text-xl font-semibold text-gray-700">
            Meal Ideas Based on Your Pantry:
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-gray-600">
            {mealSuggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {searchTerm && filteredPantryItems.length === 0 ? (
          <div className="py-4 text-center italic text-gray-500">
            No items found matching &apos;{searchTerm}&apos;.
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((categoryKey) => (
              <DroppableCategory
                key={categoryKey}
                id={categoryKey}
                categoryName={categoryKey}
                items={groupedItems[categoryKey]}
                editingItemId={editingItem?.id ?? null}
                onEditClick={handleEditClick}
                onDeleteClick={onDeleteClick}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                selectedItemIds={selectedItemIds}
                onToggleSelectItem={handleToggleSelectItem}
                searchTerm={searchTerm}
                onDeleteCategory={handleDeleteCategory}
              />
            ))}
          </div>
        )}

      </DndContext>
    </>
  )
}
