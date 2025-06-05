// c:\myProjects\windsurf-test\21menus\web\src\components\MealDisplay\MealDisplayCard\MealDisplayCard.tsx
import React, { useState, useEffect } from 'react'

import { navigate, routes } from '@redwoodjs/router'

// Define categories consistent with GroceryListPage
export type Category =
  | 'Produce'
  | 'Dairy'
  | 'Meat & Seafood'
  | 'Pantry'
  | 'Frozen'
  | 'Beverages'
  | 'Condiments/Spices'
  | 'Other'

const keywordCategoryMap: Partial<Record<string, Category>> = {
  // Produce
  apple: 'Produce',
  banana: 'Produce',
  orange: 'Produce',
  berries: 'Produce',
  strawberry: 'Produce',
  blueberry: 'Produce',
  lettuce: 'Produce',
  spinach: 'Produce',
  tomato: 'Produce',
  potato: 'Produce',
  onion: 'Produce',
  garlic: 'Produce',
  carrot: 'Produce',
  broccoli: 'Produce',
  cabbage: 'Produce',
  avocado: 'Produce',
  grapes: 'Produce',
  lemon: 'Produce',
  lime: 'Produce',
  mushroom: 'Produce',
  cucumber: 'Produce',
  celery: 'Produce',
  asparagus: 'Produce',
  zucchini: 'Produce',
  eggplant: 'Produce',
  ginger: 'Produce',
  cilantro: 'Produce',
  parsley: 'Produce',
  // Dairy
  milk: 'Dairy',
  cheese: 'Dairy',
  yogurt: 'Dairy',
  butter: 'Dairy',
  cream: 'Dairy',
  'sour cream': 'Dairy',
  'sliced cheese': 'Dairy',
  'shredded cheese': 'Dairy',
  'greek yoghurt': 'Dairy',
  // Meal & Seafood
  chicken: 'Meat & Seafood',
  beef: 'Meat & Seafood',
  pork: 'Meat & Seafood',
  fish: 'Meat & Seafood',
  salmon: 'Meat & Seafood',
  shrimp: 'Meat & Seafood',
  turkey: 'Meat & Seafood',
  lamb: 'Meat & Seafood',
  bacon: 'Meat & Seafood',
  sausage: 'Meat & Seafood',
  mutton: 'Meat & Seafood',
  eggs: 'Meat & Seafood',
  // Pantry
  bread: 'Pantry',
  pasta: 'Pantry',
  rice: 'Pantry',
  cereal: 'Pantry',
  flour: 'Pantry',
  sugar: 'Pantry',
  oil: 'Pantry',
  vinegar: 'Pantry',
  salt: 'Pantry',
  pepper: 'Pantry', // 'pepper' (spice) vs 'bell pepper' (produce)
  beans: 'Pantry',
  lentils: 'Pantry',
  nuts: 'Pantry',
  almonds: 'Pantry',
  walnuts: 'Pantry',
  oats: 'Pantry',
  honey: 'Pantry',
  syrup: 'Pantry',
  jam: 'Pantry',
  'peanut butter': 'Pantry',
  'soy sauce': 'Pantry',
  ketchup: 'Pantry',
  mustard: 'Pantry',
  mayonnaise: 'Pantry',
  'hot sauce': 'Pantry',
  broth: 'Pantry',
  stock: 'Pantry',
  'canned tomatoes': 'Pantry',
  'canned beans': 'Pantry',
  breadcrumbs: 'Pantry',
  quinoa: 'Pantry',
  'wheat bread': 'Pantry',
  'flour tortillas': 'Pantry',
  'baking powder': 'Pantry',
  'baking soda': 'Pantry',
  'brown sugar': 'Pantry',
  // Condiments/Spices
  'curry powder': 'Condiments/Spices',
  'coriander powder': 'Condiments/Spices',
  'cumin powder': 'Condiments/Spices',
  'turmeric powder': 'Condiments/Spices',
  'chili powder': 'Condiments/Spices',
  // Frozen
  'frozen vegetables': 'Frozen',
  'ice cream': 'Frozen',
  'frozen pizza': 'Frozen',
  'frozen fruit': 'Frozen',
  // Beverages
  juice: 'Beverages',
  soda: 'Beverages',
  water: 'Beverages',
  coffee: 'Beverages',
  tea: 'Beverages',
}

const getCategoryForIngredient = (ingredientName: string): Category => {
  const lowerIngredientName = ingredientName.toLowerCase()

  // Check for more specific multi-word phrases first
  if (lowerIngredientName.includes('bell pepper')) return 'Produce'
  if (lowerIngredientName.includes('olive oil')) return 'Pantry'
  if (lowerIngredientName.includes('coconut milk')) return 'Pantry' // Or Dairy depending on use
  if (lowerIngredientName.includes('almond milk')) return 'Beverages' // Or Dairy alternative
  if (lowerIngredientName.includes('soy milk')) return 'Beverages' // Or Dairy alternative

  // Check single keywords
  for (const keyword in keywordCategoryMap) {
    if (lowerIngredientName.split(/\s+|,/).includes(keyword)) {
      // Check whole words
      return keywordCategoryMap[keyword] as Category
    }
  }
  // Fallback for partial matches if no whole word match (less precise)
  for (const keyword in keywordCategoryMap) {
    if (lowerIngredientName.includes(keyword)) {
      return keywordCategoryMap[keyword] as Category
    }
  }
  return 'Other' // Default category
}

interface NutrientInfo {
  calories: string
  protein: string
  carbohydrates: string
  fat: string
}

interface MealDetails {
  mealName: string
  ingredients: string[]
  nutrients: NutrientInfo
}

interface MealDisplayCardProps {
  mealName: string | null
}

const MealDisplayCard: React.FC<MealDisplayCardProps> = ({ mealName }) => {
  // Define a type for items to be added to grocery list from here
  // This aligns with what GroceryListPage expects, minus id and purchased status initially
  type PendingGroceryItem = {
    name: string
    category: string // We'll use a default category like 'Other'
  }
  const [details, setDetails] = useState<MealDetails | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(
    new Set()
  )

  useEffect(() => {
    if (!mealName) {
      setDetails(null)
      setError(null)
      setIsLoading(false)
      return
    }

    setSelectedIngredients(new Set()) // Reset selections when meal changes
    const fetchMealDetails = async () => {
      setIsLoading(true)
      setError(null)
      setDetails(null)
      try {
        const response = await fetch(
          `/api/getMealDetails?mealName=${encodeURIComponent(mealName)}`
        )
        if (!response.ok) {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            throw new Error(
              errorData.error || `Server error: ${response.status}`
            )
          } else {
            const errorText = await response.text()
            console.error('Server returned non-JSON error:', errorText)
            throw new Error(
              `Server error: ${response.status}. Check console for details.`
            )
          }
        }
        const data: MealDetails = await response.json()
        setDetails(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch meal details'
        )
        console.error(err)
      }
      setIsLoading(false)
    }

    fetchMealDetails()
  }, [mealName])

  const handleAddToPlannerClick = () => {
    if (details?.mealName) {
      navigate(routes.planner({ addMeal: details.mealName }))
    }
  }

  const handleIngredientSelectionChange = (ingredientName: string) => {
    setSelectedIngredients((prevSelected) => {
      const newSelected = new Set(prevSelected)
      if (newSelected.has(ingredientName)) {
        newSelected.delete(ingredientName)
      } else {
        newSelected.add(ingredientName)
      }
      return newSelected
    })
  }

  const handleAddToGroceryList = () => {
    console.log('[MealDisplayCard] handleAddToGroceryList triggered')
    const ingredientsToAddArray = Array.from(selectedIngredients)
    console.log(
      '[MealDisplayCard] selectedIngredients (raw Set):',
      selectedIngredients
    )
    console.log(
      '[MealDisplayCard] ingredientsToAddArray (from Set):',
      ingredientsToAddArray
    )
    if (ingredientsToAddArray.length === 0) {
      setFeedbackMessage('No ingredients selected to add.')
      setTimeout(() => setFeedbackMessage(null), 3000)
      return
    }

    const itemsToAdd: PendingGroceryItem[] = ingredientsToAddArray.map(
      (ingredientName) => ({
        name: ingredientName,
        category: getCategoryForIngredient(ingredientName),
      })
    )
    console.log(
      '[MealDisplayCard] itemsToAdd (selected items with category):',
      itemsToAdd
    )

    try {
      const existingPendingItemsRaw = localStorage.getItem(
        'pendingGroceryItems'
      )
      const existingPendingItems: PendingGroceryItem[] = existingPendingItemsRaw
        ? JSON.parse(existingPendingItemsRaw)
        : []
      console.log(
        '[MealDisplayCard] existingPendingItems (from localStorage before add):',
        existingPendingItems
      )

      // Simple check to avoid adding exact same named items if function is spammed
      // More robust duplicate handling (e.g. by ID) would be in GroceryListPage itself
      const newItemsToActuallyAdd = itemsToAdd.filter(
        (newItem) =>
          !existingPendingItems.some(
            (existingItem) => existingItem.name === newItem.name
          )
      )
      console.log(
        '[MealDisplayCard] newItemsToActuallyAdd (after filtering against existing pending):',
        newItemsToActuallyAdd
      )

      // If all selected items were already in the queue, inform the user
      if (newItemsToActuallyAdd.length === 0 && itemsToAdd.length > 0) {
        setFeedbackMessage('Selected ingredients were already in the queue.')
        setTimeout(() => setFeedbackMessage(null), 3000)
        return
      }

      const updatedPendingItems = [
        ...existingPendingItems,
        ...newItemsToActuallyAdd,
      ]
      console.log(
        '[MealDisplayCard] updatedPendingItems (to be saved to localStorage):',
        updatedPendingItems
      )
      localStorage.setItem(
        'pendingGroceryItems',
        JSON.stringify(updatedPendingItems)
      )
      const finalMessage =
        newItemsToActuallyAdd.length > 0
          ? `${newItemsToActuallyAdd.length} ingredient(s) added to grocery list queue!`
          : itemsToAdd.length > 0
            ? 'Selected ingredients already in queue.'
            : 'No new ingredients to add.'
      setFeedbackMessage(finalMessage)
      setSelectedIngredients(new Set()) // Clear selection after adding
    } catch (e) {
      console.error('Failed to save pending grocery items:', e)
      setFeedbackMessage('Error adding ingredients.')
    }

    setTimeout(() => setFeedbackMessage(null), 3000)
  }
  if (!mealName) {
    return (
      <div className="mt-8 rounded-lg border border-gray-200 p-6 text-center text-gray-500 shadow">
        Select a meal from the search bar to see its details.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mt-8 rounded-lg border border-gray-200 p-6 text-center text-gray-500 shadow">
        Loading meal details...
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 rounded-lg border border-red-300 bg-red-50 p-6 text-center text-red-700 shadow">
        Error: {error}
      </div>
    )
  }

  if (!details) {
    // This case is mostly covered by the initial !mealName check,
    // but good for robustness if details somehow become null after loading without error.
    return null
  }

  return (
    <div className="mt-8 rounded-lg border border-gray-300 p-6 shadow-lg">
      <h2 className="mb-4 text-2xl font-semibold">{details.mealName}</h2>
      <div>
        <h3 className="mb-2 text-xl font-medium">Ingredients:</h3>
        {details.ingredients && details.ingredients.length > 0 ? (
          <ul className="list-none space-y-1 text-gray-700">
            {details.ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`ingredient-${index}`}
                  name={ingredient}
                  checked={selectedIngredients.has(ingredient)}
                  onChange={() => handleIngredientSelectionChange(ingredient)}
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor={`ingredient-${index}`}>{ingredient}</label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700">No ingredients listed.</p>
        )}
      </div>
      <div className="mt-4">
        <h3 className="mb-2 text-xl font-medium">Nutrient Content:</h3>
        {details.nutrients ? (
          <ul className="text-gray-700">
            <li>
              <strong>Calories:</strong> {details.nutrients.calories}
            </li>
            <li>
              <strong>Protein:</strong> {details.nutrients.protein}
            </li>
            <li>
              <strong>Carbohydrates:</strong> {details.nutrients.carbohydrates}
            </li>
            <li>
              <strong>Fat:</strong> {details.nutrients.fat}
            </li>
          </ul>
        ) : (
          <p className="text-gray-700">No nutrient information available.</p>
        )}
      </div>
      <div className="mt-6 items-center text-center md:flex md:justify-center">
        <button
          onClick={handleAddToPlannerClick}
          className="mb-2 block w-full rounded-lg bg-green-500 px-6 py-2 font-semibold text-white transition-colors duration-150 ease-in-out hover:bg-green-600 md:mb-0 md:mr-2 md:w-auto"
        >
          Add to Planner
        </button>
        <button
          onClick={handleAddToGroceryList}
          className="block w-full rounded-lg bg-sky-500 px-6 py-2 font-semibold text-white transition-colors duration-150 ease-in-out hover:bg-sky-600 md:w-auto"
        >
          Add Ingredients to Grocery List
        </button>
      </div>
      {feedbackMessage && (
        <div className="mt-4 rounded-md bg-blue-100 p-2 text-center text-sm text-blue-700">
          {feedbackMessage}
        </div>
      )}
    </div>
  )
}

export default MealDisplayCard
