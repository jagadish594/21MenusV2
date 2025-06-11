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
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PantryItemStatus } from 'types/graphql' // Import PantryItemStatus as a value
import type {
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
  GroceryListItemsQuery, // Consolidated here
} from 'types/graphql'

import { useMutation } from '@redwoodjs/web'
import type {
  CellFailureProps,
  CellSuccessProps,
  TypedDocumentNode,
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
      category
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
      category
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
        category
        purchased
        createdAt
        updatedAt
      }
      skippedItems
    }
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
      <h2 className="mb-3 border-b pb-2 text-xl font-semibold text-gray-700">
        {categoryName}
      </h2>
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
}: CellSuccessProps<PantryItemsQuery, PantryItemsQueryVariables>) => {
  const [inputValue, setInputValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null)
  const [localPantryItems, setLocalPantryItems] = useState<PantryItem[]>(() =>
    initialPantryItems.map((item) => ({
      ...item,
      // Ensure status conforms to PantryItemStatus, as expected by the PantryItem type
      status: item.status as PantryItemStatus,
    }))
  )
  const [activeDragItem, setActiveDragItem] = useState<PantryItem | null>(null)

  const filteredPantryItems = useMemo(() => {
    if (!searchTerm) {
      return localPantryItems
    }
    return localPantryItems.filter((item) => {
      const term = searchTerm.toLowerCase()
      const nameMatch = item.name.toLowerCase().includes(term)
      const notesMatch = item.notes?.toLowerCase().includes(term) ?? false
      return nameMatch || notesMatch
    })
  }, [localPantryItems, searchTerm])
  const [selectedItemIds, setSelectedItemIds] = useState(new Set<number>())

  const hasSelectedInStockItem = useMemo(() => {
    if (selectedItemIds.size === 0) {
      return false
    }
    for (const id of selectedItemIds) {
      const selectedItem = localPantryItems.find((item) => item.id === id)
      if (selectedItem && selectedItem.status === 'InStock') {
        return true
      }
    }
    return false
  }, [selectedItemIds, localPantryItems])

  const [addPantryItemsToGrocery, { loading: addItemsLoading }] = useMutation<
    AddPantryItemsToGroceryListMutation,
    { inputs: AddPantryItemToGroceryInput[] }
  >(ADD_PANTRY_ITEMS_TO_GROCERY_LIST_MUTATION, {
    update: (cache, { data: mutationData }) => {
      console.log('[PantryItemsCell] Update function called.')
      if (!mutationData?.addPantryItemsToGroceryList?.addedItems) {
        console.log('[PantryItemsCell] No addedItems in mutationData.')
        return
      }
      const { addedItems } = mutationData.addPantryItemsToGroceryList
      console.log(
        '[PantryItemsCell] addedItems from mutation:',
        JSON.stringify(addedItems)
      )
      if (addedItems.length === 0) {
        console.log('[PantryItemsCell] addedItems array is empty.')
        return
      }

      const queryOptions = { query: GET_GROCERY_LIST_ITEMS_QUERY }
      let existingCacheData = null
      try {
        existingCacheData = cache.readQuery<GroceryListItemsQuery>(queryOptions)
      } catch {
        // This is fine, means the query isn't in the cache yet
        console.log(
          '[PantryItemsCell] GET_GROCERY_LIST_ITEMS_QUERY not found in cache (expected if GroceryListPage not visited).'
        )
      }

      if (
        !existingCacheData ||
        !existingCacheData.groceryListItems ||
        existingCacheData.groceryListItems.length === 0
      ) {
        console.warn(
          '[PantryItemsCell] Cache miss or empty/null groceryListItems for GET_GROCERY_LIST_ITEMS_QUERY. Using writeQuery with ONLY new items.',
          'Current cache data for query:',
          existingCacheData
        )
        // This will create/overwrite the groceryListItems with only the newly added items.
        cache.writeQuery<GroceryListItemsQuery>({
          ...queryOptions,
          data: { groceryListItems: addedItems }, // addedItems comes from the mutation
        })
        if (addedItems.length > 0) {
          // Event emission was removed here, so log is also removed.
        }
      } else {
        // Cache exists and has items, so use cache.modify
        console.log(
          '[PantryItemsCell] Cache hit for GET_GROCERY_LIST_ITEMS_QUERY. Using cache.modify.'
        )
        cache.modify({
          fields: {
            groceryListItems(existingItemsRef = [], { readField }) {
              console.log(
                '[PantryItemsCell] Inside groceryListItems modifier function. Existing refs count:',
                existingItemsRef.length
              )
              const newItemsRef = []
              for (const item of addedItems) {
                console.log(
                  `[PantryItemsCell] Processing item: ${item.name} (ID: ${item.id})`
                )
                const itemAlreadyExists = existingItemsRef.some(
                  (ref) => readField('id', ref) === item.id
                )
                console.log(
                  `[PantryItemsCell] Item ${item.name} already exists in cache? ${itemAlreadyExists}`
                )
                if (!itemAlreadyExists) {
                  const newItemRef = cache.writeFragment({
                    data: item,
                    fragment: gql`
                      fragment NewGroceryListItem on GroceryListItem {
                        id
                        name
                        category
                        purchased
                        createdAt
                        updatedAt
                      }
                    `,
                  })
                  newItemsRef.push(newItemRef)
                  console.log(
                    `[PantryItemsCell] Added ${item.name} to newItemsRef.`
                  )
                }
              }
              const finalItems = [...existingItemsRef, ...newItemsRef]
              console.log(
                `[PantryItemsCell] newItemsRef length (from cache.modify): ${newItemsRef.length}`
              )
              // Event emission and related logs removed as part of simplifying event handling.
              return finalItems
            },
          },
        })
      }
    },
    onCompleted: (data) => {
      const { addedCount, skippedCount, skippedItems } =
        data.addPantryItemsToGroceryList
      if (addedCount > 0) {
        toast.success(
          `${addedCount} item${addedCount > 1 ? 's' : ''} added to grocery list.`
        )
      }
      if (skippedCount > 0) {
        toast(
          `${skippedCount} item${skippedCount > 1 ? 's' : ''} already in grocery list: ${skippedItems.join(', ')}`,
          { icon: 'ℹ️' }
        )
      }
      if (addedCount === 0 && skippedCount === 0) {
        toast('No new items were added to the grocery list.', { icon: 'ℹ️' })
      }
      setSelectedItemIds(new Set()) // Clear selection
    },
    onError: (error) => {
      toast.error(`Failed to add items: ${error.message}`)
    },
  })

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

    const itemsToAdd = localPantryItems.filter(
      (item) => selectedItemIds.has(item.id) && item.status === 'OutOfStock'
    )

    if (itemsToAdd.length === 0) {
      toast(
        'No selected items are "Out of Stock". Only "Out of Stock" items can be added to the grocery list.',
        { icon: 'ℹ️' } // Optional: add an info icon
      )
      return
    }

    const mutationInputs: AddPantryItemToGroceryInput[] = itemsToAdd.map(
      (item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity, // Pass quantity, even if not used by GroceryListItem model directly
      })
    )

    addPantryItemsToGrocery({ variables: { inputs: mutationInputs } })
  }

  useEffect(() => {
    setLocalPantryItems(
      initialPantryItems.map((item) => ({
        ...item,
        // Ensure status conforms to PantryItemStatus, as expected by the PantryItem type
        status: item.status as PantryItemStatus,
      }))
    )
  }, [initialPantryItems])

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(inputValue)
    }, 300) // 300ms debounce delay

    return () => {
      clearTimeout(handler)
    }
  }, [inputValue])

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
      toast.success('Pantry items reordered/moved')
    },
    onError: (error) => {
      toast.error(`Error reordering items: ${error.message}`)
    },
    refetchQueries: [{ query: QUERY }],
  })

  const onDeleteClick = (id: number, name: string) => {
    if (editingItem?.id === id) {
      setEditingItem(null)
    }
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deletePantryItem({ variables: { id } })
    }
  }

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

  const handleDragStart = (event: DragEndEvent) => {
    const { active } = event
    if (active.data.current?.type === 'item') {
      setActiveDragItem(active.data.current.item as PantryItem)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragItem(null)

    if (!over) return

    const activeId = active.id.toString()
    const overId = over.id.toString()

    const activeItem = localPantryItems.find(
      (item) => item.id.toString() === activeId
    )
    if (!activeItem) return

    const overIsCategory = over.data.current?.type === 'category'
    const overIsItem = over.data.current?.type === 'item'

    let targetCategoryKey: string | null | undefined

    if (overIsCategory) {
      targetCategoryKey = overId
    } else if (overIsItem) {
      const overItem = localPantryItems.find(
        (item) => item.id.toString() === overId
      )
      targetCategoryKey = overItem?.category || 'Uncategorized'
    } else {
      if (categories.includes(overId)) {
        targetCategoryKey = overId
      }
    }

    if (targetCategoryKey === undefined) return

    const activeCategoryKey = activeItem.category || 'Uncategorized'
    const newCategoryForDb =
      targetCategoryKey === 'Uncategorized' ? null : targetCategoryKey

    const changesToPersist: UpdatePantryItemOrderInput[] = []

    if (activeCategoryKey !== targetCategoryKey) {
      if (editingItem?.id === activeItem.id) {
        toast.error('Cannot move an item while it is being edited.')
        return
      }

      // Optimistically update local state first
      let itemsInOldCatAfterMove: PantryItem[] = []
      let itemsInNewCatAfterMove: PantryItem[] = []

      setLocalPantryItems((prevItems) => {
        const itemMoved = {
          ...activeItem,
          category: newCategoryForDb,
          order: 0,
        } // Temporarily set order to 0
        const remainingItems = prevItems.filter((p) => p.id !== activeItem.id)

        // Items in the old category, re-sorted
        itemsInOldCatAfterMove = remainingItems
          .filter((p) => (p.category || 'Uncategorized') === activeCategoryKey)
          .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
          .map((item, index) => ({ ...item, order: index }))

        // Items in the new category, with the moved item, re-sorted
        itemsInNewCatAfterMove = [
          ...remainingItems.filter(
            (p) => (p.category || 'Uncategorized') === targetCategoryKey
          ),
          itemMoved,
        ]
          .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
          .map((item, index) => ({ ...item, order: index }))

        const otherItems = remainingItems.filter(
          (p) =>
            (p.category || 'Uncategorized') !== activeCategoryKey &&
            (p.category || 'Uncategorized') !== targetCategoryKey
        )
        return [
          ...otherItems,
          ...itemsInOldCatAfterMove,
          ...itemsInNewCatAfterMove,
        ]
      })

      // Prepare changes for batch mutation
      // 1. The moved item
      const movedItemFinalOrder =
        itemsInNewCatAfterMove.find((i) => i.id === activeItem.id)?.order ?? 0
      changesToPersist.push({
        id: activeItem.id,
        category: newCategoryForDb,
        order: movedItemFinalOrder,
      })

      // 2. Items in the old category that had their order changed
      itemsInOldCatAfterMove.forEach((item) => {
        const originalItem = localPantryItems.find((p) => p.id === item.id)
        if (originalItem && originalItem.order !== item.order) {
          changesToPersist.push({ id: item.id, order: item.order })
        }
      })

      // 3. Items in the new category (excluding the moved one) that had their order changed
      itemsInNewCatAfterMove.forEach((item) => {
        if (item.id === activeItem.id) return // Already handled
        const originalItem = localPantryItems.find((p) => p.id === item.id)
        // Check if original was in this category and its order changed, or if it's a new item to this category (covered by movedItem logic)
        if (
          originalItem &&
          (originalItem.category || 'Uncategorized') === targetCategoryKey &&
          originalItem.order !== item.order
        ) {
          changesToPersist.push({ id: item.id, order: item.order })
        }
      })
    } else if (activeId !== overId) {
      // Reordering within the same category
      const itemsInSameCategory = localPantryItems
        .filter(
          (item) => (item.category || 'Uncategorized') === activeCategoryKey
        )
        .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))

      const oldIndex = itemsInSameCategory.findIndex(
        (item) => item.id.toString() === activeId
      )
      const newIndex = itemsInSameCategory.findIndex(
        (item) => item.id.toString() === overId
      )

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reorderedCategoryItems = arrayMove(
          itemsInSameCategory,
          oldIndex,
          newIndex
        ).map((item, index) => ({ ...item, order: index })) // Assign new order right away

        setLocalPantryItems((prevItems) => {
          const otherItems = prevItems.filter(
            (item) => (item.category || 'Uncategorized') !== activeCategoryKey
          )
          return [...otherItems, ...reorderedCategoryItems]
        })

        reorderedCategoryItems.forEach((item) => {
          // Find the original item in the *initial* localPantryItems to compare old order
          const originalItemInFullList = initialPantryItems.find(
            (p) => p.id === item.id
          )
          if (
            originalItemInFullList &&
            originalItemInFullList.order !== item.order
          ) {
            changesToPersist.push({ id: item.id, order: item.order })
          }
        })
      }
    }

    if (changesToPersist.length > 0) {
      updatePantryItemOrders({ variables: { inputs: changesToPersist } })
    }
  }

  const groupedItems = filteredPantryItems.reduce(
    (acc, item) => {
      const categoryKey = item.category || 'Uncategorized'
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

  const countSelectedOutOfStock = filteredPantryItems.filter(
    (item) => selectedItemIds.has(item.id) && item.status === 'OutOfStock'
  ).length

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
        {/* Conditional message about 'In Stock' items */}
        {selectedItemIds.size > 0 && hasSelectedInStockItem && (
          <p className="my-2 text-sm text-orange-600">
            Note: Only &apos;Out of Stock&apos; items will be added to the
            Grocery List.
          </p>
        )}
        <button
          type="button"
          onClick={handleAddSelectedToGroceryList}
          disabled={
            selectedItemIds.size === 0 ||
            countSelectedOutOfStock === 0 ||
            addItemsLoading
          }
          className="rounded bg-green-500 px-6 py-2 text-lg font-semibold text-white shadow hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {addItemsLoading
            ? 'Adding...'
            : `Add ${countSelectedOutOfStock} Selected 'Out of Stock' to Grocery List`}
        </button>
      </div>
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
              />
            ))}
          </div>
        )}
        <DragOverlay>
          {activeDragItem ? (
            <SortablePantryItem
              item={activeDragItem}
              isEditing={false}
              onEditClick={() => {}}
              onDeleteClick={() => {}}
              onSaveEdit={() => {}}
              onCancelEdit={() => {}}
              isSelected={
                activeDragItem ? selectedItemIds.has(activeDragItem.id) : false
              }
              onToggleSelectItem={handleToggleSelectItem} // Pass handler, though likely not used in overlay
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  )
}
