import React, { useState, useEffect } from 'react'

import gql from 'graphql-tag'
import type {
  CreateMultipleGroceryListItemsMutation,
  CreateMultipleGroceryListItemsMutationVariables,
} from 'types/graphql'

import { navigate, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { GET_GROCERY_LIST_ITEMS_QUERY } from 'src/pages/GroceryListPage/GroceryListPage'

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

// Define the mutation (can also be imported if centralized)
const CREATE_MULTIPLE_GROCERY_LIST_ITEMS_MUTATION = gql`
  mutation CreateMultipleGroceryListItemsMutation(
    $inputs: [CreateGroceryListItemInput!]!
  ) {
    createMultipleGroceryListItems(inputs: $inputs) {
      addedCount
      skippedCount
      addedItems {
        id
        name
      }
      skippedItems
    }
  }
`

interface MealDisplayCardProps {
  mealName: string | null
  pantryItemNames: string[]
  pantryLoading: boolean
  pantryError: Error | undefined
}

const MealDisplayCard: React.FC<MealDisplayCardProps> = ({
  mealName,
  pantryItemNames,
  /*pantryLoading, pantryError are not used yet, but kept for future use*/
}) => {
  const [details, setDetails] = useState<MealDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true) // For LLM call
  const [error, setError] = useState<string | null>(null)
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(
    new Set()
  )

  const [
    createMultipleGroceryListItems,
    { loading: _createLoading, error: _createError },
  ] = useMutation<
    CreateMultipleGroceryListItemsMutation,
    CreateMultipleGroceryListItemsMutationVariables
  >(CREATE_MULTIPLE_GROCERY_LIST_ITEMS_MUTATION, {
    onCompleted: (data) => {
      const { addedCount, skippedCount, skippedItems } =
        data.createMultipleGroceryListItems
      if (addedCount > 0) {
        toast.success(`${addedCount} ingredient(s) added to grocery list!`)
      }
      if (skippedCount > 0) {
        toast(
          `${skippedCount} ingredient(s) already on the list: ${skippedItems.join(
            ', '
          )}`
        )
      }
    },
    onError: (error) => {
      toast.error(`Failed to add ingredients: ${error.message}`)
    },
    refetchQueries: [{ query: GET_GROCERY_LIST_ITEMS_QUERY }],
    awaitRefetchQueries: true,
  })

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

  const handleAddToGroceryList = async () => {
    const ingredientsToAddArray = Array.from(selectedIngredients)

    if (ingredientsToAddArray.length === 0) {
      toast.error('No ingredients selected to add.')
      return
    }

    const inputs = ingredientsToAddArray.map((ingredientName) => ({
      name: ingredientName,
      category: getCategoryForIngredient(ingredientName),
      purchased: false,
    }))

    await createMultipleGroceryListItems({ variables: { inputs } })

    setSelectedIngredients(new Set())
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
                <label htmlFor={`ingredient-${index}`}>
                  {ingredient}
                  {pantryItemNames.includes(ingredient.toLowerCase()) && (
                    <span className="ml-1 text-xs text-blue-600">
                      (In Pantry)
                    </span>
                  )}
                </label>
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
    </div>
  )
}

export default MealDisplayCard
