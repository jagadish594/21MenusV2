import React, { useState, useEffect } from 'react'

import { MetaTags } from '@redwoodjs/web'

interface GroceryItem {
  id: string
  name: string
  category: string
  purchased: boolean
}

const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Pantry',
  'Frozen',
  'Beverages',
  'Condiments/Spices',
  'Other',
] as const

type Category = (typeof CATEGORIES)[number]

interface PendingGroceryItem {
  name: string
  category: Category
}

const GroceryListPage = () => {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState<Category>(
    CATEGORIES[0]
  )

  const loadAndProcessItems = () => {
    console.log('[GroceryListPage] loadAndProcessItems called')
    let currentItems: GroceryItem[] = []
    const storedItems = localStorage.getItem('groceryList')
    if (storedItems) {
      try {
        currentItems = JSON.parse(storedItems)
      } catch (e) {
        console.error('Error parsing groceryList from localStorage:', e)
        // Potentially clear corrupted data: localStorage.removeItem('groceryList');
      }
    }

    const pendingItemsRaw = localStorage.getItem('pendingGroceryItems')
    console.log(
      '[GroceryListPage] pendingItemsRaw (from localStorage):',
      pendingItemsRaw
    )
    if (pendingItemsRaw) {
      try {
        const pendingItems: PendingGroceryItem[] = JSON.parse(pendingItemsRaw)
        console.log(
          '[GroceryListPage] pendingItems (parsed from localStorage):',
          pendingItems
        )
        if (pendingItems.length > 0) {
          console.log(
            '[GroceryListPage] currentItems (before filtering pending):',
            JSON.parse(JSON.stringify(currentItems))
          )
          const newItemsToConsiderAdding = pendingItems.filter(
            (pendingItem) => {
              const alreadyExists = currentItems.some((existingItem) => {
                const isDuplicate =
                  existingItem.name.toLowerCase() ===
                    pendingItem.name.toLowerCase() &&
                  existingItem.category === pendingItem.category
                // if (isDuplicate) {
                //   console.log(`[GroceryListPage] Duplicate found: Pending='${pendingItem.name}', Existing='${existingItem.name}'`)
                // }
                return isDuplicate
              })
              return !alreadyExists
            }
          )
          console.log(
            '[GroceryListPage] newItemsToConsiderAdding (after filtering duplicates from pending):',
            newItemsToConsiderAdding
          )
          const newItemsToAdd = newItemsToConsiderAdding.map((item) => ({
            id: Date.now().toString() + '-' + item.name.slice(0, 5), // More unique ID
            name: item.name,
            category: item.category as Category, // Assuming category from pending is valid
            purchased: false, // Default to not purchased
          }))
          console.log(
            '[GroceryListPage] newItemsToAdd (transformed from newItemsToConsiderAdding):',
            newItemsToAdd
          )
          if (newItemsToAdd.length > 0) {
            currentItems = [...currentItems, ...newItemsToAdd]
          }
          localStorage.removeItem('pendingGroceryItems') // Clear pending items after processing
        }
      } catch (e) {
        console.error(
          'Error processing pendingGroceryItems from localStorage:',
          e
        )
        // Potentially clear corrupted data: localStorage.removeItem('pendingGroceryItems');
      }
    }
    console.log(
      '[GroceryListPage] currentItems (before setting state):',
      currentItems
    )
    setItems(currentItems)
  }

  // Load items on initial render
  useEffect(() => {
    loadAndProcessItems()
  }, [])

  // Listen for changes to pendingGroceryItems from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'pendingGroceryItems') {
        console.log(
          '[GroceryListPage] storage event detected for pendingGroceryItems'
        )
        loadAndProcessItems()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, []) // Empty dependency array means this effect runs once on mount and cleans up on unmount

  useEffect(() => {
    localStorage.setItem('groceryList', JSON.stringify(items))
  }, [items])

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newItemName.trim()) return
    const newItem: GroceryItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: newItemCategory,
      purchased: false,
    }
    setItems([...items, newItem])
    setNewItemName('')
    // setNewItemCategory(CATEGORIES[0])
  }

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter((item) => item.id !== itemId))
  }

  const handleDeleteCategoryItems = (categoryToDelete: Category) => {
    if (
      !window.confirm(
        `Are you sure you want to delete all items in the "${categoryToDelete}" category?`
      )
    ) {
      return
    }
    setItems((prevItems) =>
      prevItems.filter((item) => item.category !== categoryToDelete)
    )
  }

  const handleTogglePurchased = (itemId: string) => {
    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, purchased: !item.purchased } : item
      )
    )
  }

  const groupedItems = CATEGORIES.reduce(
    (acc, category) => {
      const itemsInCategory = items.filter((item) => item.category === category)
      if (itemsInCategory.length > 0) {
        acc[category] = itemsInCategory
      }
      return acc
    },
    {} as Record<Category, GroceryItem[]>
  )

  return (
    <>
      <MetaTags title="Grocery List" description="Manage your grocery list" />

      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Grocery List</h1>

        {/* Add Item Form */}
        <form
          onSubmit={handleAddItem}
          className="space-y-3 rounded-lg bg-white p-4 shadow md:flex md:items-end md:space-x-3 md:space-y-0"
        >
          <div>
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
              placeholder="E.g., Apples"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm"
              required
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
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as Category)}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 md:w-auto"
          >
            Add Item
          </button>
        </form>

        {/* Display Items */}
        <div className="space-y-6">
          {items.length === 0 ? (
            <p className="py-4 text-center italic text-gray-500">
              Your grocery list is empty. Add some items above!
            </p>
          ) : (
            CATEGORIES.map((category) => {
              const itemsInCategory = groupedItems[category]
              if (!itemsInCategory || itemsInCategory.length === 0) {
                return null // Don't render category if no items
              }
              return (
                <div key={category} className="rounded-lg bg-white p-4 shadow">
                  <div className="mb-3 flex items-center justify-between border-b pb-2">
                    <h2 className="text-xl font-semibold text-gray-700">
                      {category}
                    </h2>
                    <button
                      onClick={() => handleDeleteCategoryItems(category)}
                      className="rounded bg-red-500 px-2 py-1 text-xs text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                      aria-label={`Delete all items in ${category}`}
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
                          <input
                            type="checkbox"
                            checked={item.purchased}
                            onChange={() => handleTogglePurchased(item.id)}
                            className="mr-2 h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span
                            className={`${item.purchased ? 'text-gray-400 line-through' : 'text-gray-800'}
                            `}
                          >
                            {item.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="rounded-full p-1 leading-none text-red-500 hover:bg-red-100 hover:text-red-700"
                          aria-label="Delete item"
                        >
                          &#x2715; {/* HTML entity for X */}
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
