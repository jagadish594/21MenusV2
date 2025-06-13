import React, { useState, useEffect } from 'react'

import { useLazyQuery } from '@apollo/client'
import type { ApolloError } from '@apollo/client'
import gql from 'graphql-tag'
import type {
  CreateMultipleGroceryListItemsMutation,
  CreateMultipleGroceryListItemsMutationVariables,
  GetMealDetailsQuery,
  GetMealDetailsQueryVariables,
} from 'types/graphql'

import { navigate, routes } from '@redwoodjs/router'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { useMealQuery } from 'src/contexts/MealQueryContext'
import {
  CATEGORY_NAME_TO_ID_MAP,
  type CategoryName as Category, // Using CategoryName as Category for compatibility
} from 'src/lib/categories'
import { GET_GROCERY_LIST_ITEMS_QUERY } from 'src/pages/GroceryListPage/GroceryListPage'

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
  if (typeof ingredientName !== 'string' || !ingredientName.trim()) {
    console.warn(
      `[MealDisplayCard] getCategoryForIngredient received invalid ingredientName: ${ingredientName}. Defaulting to 'Other'.`
    )
    return 'Other'
  }
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

const GET_MEAL_DETAILS_QUERY = gql`
  query GetMealDetailsQuery($mealName: String!) {
    getMealDetails(mealName: $mealName) # This should be a JSON string
  }
`

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
  selectedMealName: string | null // Input meal name for which to fetch details
  pantryItemNames: string[]
  pantryLoading: boolean
  pantryError: ApolloError | undefined

  // Props from MealQueryContext
  mealIngredients: string[]
  setMealIngredients: (ingredients: string[]) => void
  selectedIngredients: Set<string>
  setSelectedIngredients: (selected: Set<string>) => void // Added from context
  toggleIngredientSelection: (ingredientName: string) => void
}

export const MealDisplayCard: React.FC<MealDisplayCardProps> = ({
  selectedMealName,
  pantryItemNames,
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  pantryLoading,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pantryError,
  mealIngredients,
  setMealIngredients,
  selectedIngredients,
  setSelectedIngredients,
  toggleIngredientSelection,
}) => {
  const [details, setDetails] = useState<MealDetails | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [componentError, setComponentError] = useState<string | null>(null)
  const { queriedMealDetails, setQueriedMealDetails } = useMealQuery()
  console.log(
    '[MealDisplayCard] Initial local state: isLoading:',
    isLoading,
    'componentError:',
    componentError,
    'details:',
    details
  )
  const [_showNutrients, _setShowNutrients] = useState(false)

  console.log('[MealDisplayCard] Initializing Apollo hooks...')
  const [
    callGetMealDetails,
    {
      data: mealDetailsData,
      loading: mealDetailsLoading,
      error: mealDetailsError,
    },
  ] = useLazyQuery<GetMealDetailsQuery, GetMealDetailsQueryVariables>(
    GET_MEAL_DETAILS_QUERY
  )

  const [
    createMultipleGroceryListItems,
    { loading: _createLoading, error: _createError },
  ] = useMutation<
    CreateMultipleGroceryListItemsMutation,
    CreateMultipleGroceryListItemsMutationVariables
  >(CREATE_MULTIPLE_GROCERY_LIST_ITEMS_MUTATION, {
    onCompleted: (data) => {
      console.log('[MealDisplayCard] useLazyQuery onCompleted. Raw data:', data)
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
      console.error('[MealDisplayCard] useLazyQuery onError:', error)
      toast.error(`Failed to add ingredients: ${error.message}`)
    },
    refetchQueries: [{ query: GET_GROCERY_LIST_ITEMS_QUERY }],
    awaitRefetchQueries: true,
  })

  // Effect to trigger the query when mealName changes
  useEffect(() => {
    if (selectedMealName) {
      // Check if details for this meal are already in context (cache)
      if (
        queriedMealDetails &&
        queriedMealDetails.mealName === selectedMealName
      ) {
        console.log(
          '[MealDisplayCard] Using cached details for:',
          selectedMealName
        )
        setDetails(queriedMealDetails)
        setMealIngredients(queriedMealDetails.ingredients || [])
        // Decide on selection state: clear or restore from cache if that was also stored
        setSelectedIngredients(new Set()) // Default: clear selections for cached meal
        setComponentError(null)
        setIsLoading(false) // Not loading from API
      } else {
        // Not cached or different meal, so fetch from API
        setDetails(null) // Clear previous local details
        setComponentError(null)
        setMealIngredients([])
        setSelectedIngredients(new Set())
        setIsLoading(true) // Indicate loading from API
        callGetMealDetails({ variables: { mealName: selectedMealName } })
      }
    } else {
      // Clear all details if mealName is cleared
      setDetails(null)
      setIsLoading(false)
      setComponentError(null)
      setMealIngredients([])
      setSelectedIngredients(new Set())
    }
  }, [
    selectedMealName,
    callGetMealDetails,
    queriedMealDetails,
    setMealIngredients,
    setSelectedIngredients,
  ])

  // Effect to process query result (data or error)
  useEffect(() => {
    console.log(
      '[MealDisplayCard] Effect to PROCESS query result. Data:',
      mealDetailsData,
      'Error:',
      mealDetailsError,
      'Loading:',
      mealDetailsLoading
    )

    setIsLoading(mealDetailsLoading) // Update component's loading state based on hook's loading state

    if (mealDetailsError) {
      console.error(
        '[MealDisplayCard] Error from useLazyQuery:',
        mealDetailsError
      )
      setComponentError(
        `Error fetching meal details: ${mealDetailsError.message}`
      )
      setDetails(null)
      setMealIngredients([])
      return
    }

    if (mealDetailsData) {
      if (mealDetailsData.getMealDetails) {
        try {
          console.log(
            '[MealDisplayCard] Attempting to parse:',
            mealDetailsData.getMealDetails
          )
          const parsedDetails: MealDetails = JSON.parse(
            mealDetailsData.getMealDetails
          )
          setDetails(parsedDetails)
          setQueriedMealDetails(parsedDetails) // Update context and sessionStorage
          const ingredientNames = Array.isArray(parsedDetails.ingredients)
            ? parsedDetails.ingredients
            : []
          setMealIngredients(ingredientNames)
          setSelectedIngredients(new Set()) // Start with no ingredients selected
          setComponentError(null)
        } catch (e) {
          console.error(
            '[MealDisplayCard] Failed to parse meal details JSON:',
            e
          )
          setComponentError('Failed to parse meal details from LLM.')
          setDetails(null)
          setMealIngredients([])
        }
      } else {
        // This case means query returned data, but getMealDetails field was null or missing.
        // Could happen if LLM returns empty string or an error structure that GraphQL doesn't reject.
        console.log(
          '[MealDisplayCard] getMealDetails was null/undefined in response data',
          mealDetailsData
        )
        setComponentError('No meal details content received from LLM.')
        setDetails(null)
        setMealIngredients([])
      }
    }
    // If mealDetailsData is null and no error, it means the query hasn't completed or was reset.
    // Loading state is handled by setIsLoading(mealDetailsLoading).
  }, [
    mealDetailsData,
    mealDetailsError,
    mealDetailsLoading,
    setDetails,
    setComponentError,
    setIsLoading,
    setMealIngredients,
    setSelectedIngredients,
    setQueriedMealDetails,
  ])

  const handleAddToPlannerClick = () => {
    if (details?.mealName) {
      navigate(routes.planner({ addMeal: details.mealName }))
    }
  }

  const handleIngredientSelectionChange = (ingredientName: string) => {
    toggleIngredientSelection(ingredientName) // Use prop from context
  }

  const handleAddToGroceryList = async () => {
    const ingredientsToAddArray = Array.from(selectedIngredients)

    if (ingredientsToAddArray.length === 0) {
      toast.error('No ingredients selected to add.')
      return
    }

    const inputs = ingredientsToAddArray.map((ingredientName) => ({
      name: ingredientName,
      categoryId:
        CATEGORY_NAME_TO_ID_MAP[getCategoryForIngredient(ingredientName)],
      purchased: false,
    }))

    await createMultipleGroceryListItems({ variables: { inputs } })

    setSelectedIngredients(new Set())
  }

  const handleSelectAll = () => {
    if (details && details.ingredients && details.ingredients.length > 0) {
      setSelectedIngredients(new Set(details.ingredients))
      console.log(
        '[MealDisplayCard] handleSelectAll: Selected all ingredients:',
        details.ingredients
      )
    } else {
      console.log(
        '[MealDisplayCard] handleSelectAll: No ingredients to select.'
      )
    }
  }

  const handleClearAll = () => {
    setSelectedIngredients(new Set()) // Use prop from context
  }

  console.log(
    '[MealDisplayCard] RENDERING. Current states: selectedMealName:',
    selectedMealName,
    'isLoading:',
    isLoading,
    'componentError:',
    componentError,
    'hookError:',
    mealDetailsError,
    'details:',
    details,
    'hookLoading:',
    mealDetailsLoading
  )

  if (!selectedMealName) {
    console.log('[MealDisplayCard] Render branch: No mealName')
    return (
      <div className="mt-8 rounded-lg border border-gray-200 p-6 text-center text-gray-500 shadow">
        Select a meal from the search bar to see its details.
      </div>
    )
  }

  // Prioritize error from the query hook itself
  if (mealDetailsError) {
    console.log(
      '[MealDisplayCard] Render branch: mealDetailsError from hook',
      mealDetailsError
    )
    return (
      <div className="mt-8 rounded-lg border border-red-300 bg-red-50 p-6 text-center text-red-700 shadow">
        Error fetching details: {mealDetailsError.message}
      </div>
    )
  }

  // Then check component's managed loading state
  if (isLoading || mealDetailsLoading) {
    console.log(
      '[MealDisplayCard] Render branch: isLoading or mealDetailsLoading. isLoading:',
      isLoading,
      'mealDetailsLoading:',
      mealDetailsLoading
    )
    return (
      <div className="mt-8 rounded-lg border border-gray-200 p-6 text-center text-gray-500 shadow">
        Loading meal details...
      </div>
    )
  }

  // Then check component's managed error state (e.g., from parsing)
  if (componentError) {
    console.log(
      '[MealDisplayCard] Render branch: component error state',
      componentError
    )
    return (
      <div className="mt-8 rounded-lg border border-red-300 bg-red-50 p-6 text-center text-red-700 shadow">
        Error: {componentError}
      </div>
    )
  }

  if (!details) {
    console.log('[MealDisplayCard] Render branch: No details object')
    // This case is mostly covered by the initial !mealName check,
    // but good for robustness if details somehow become null after loading without error.
    return null
  }

  console.log(
    '[MealDisplayCard] Render branch: Main content with details',
    details
  )
  return (
    <div className="mt-8 rounded-lg border border-gray-300 p-6 shadow-lg">
      <h2 className="mb-4 text-2xl font-semibold">{details.mealName}</h2>
      <div>
        <h3 className="mb-2 text-xl font-medium">Ingredients:</h3>
        {mealIngredients && mealIngredients.length > 0 && (
          <div className="mb-2 flex space-x-2">
            <button
              onClick={handleSelectAll}
              className="rounded bg-blue-500 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-600"
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              className="rounded bg-gray-500 px-3 py-1 text-xs text-white transition-colors hover:bg-gray-600"
            >
              Clear All
            </button>
          </div>
        )}
        {details.ingredients && details.ingredients.length > 0 ? (
          <ul className="list-none space-y-1 text-gray-700">
            {details.ingredients.map((ingredientName, index) => (
              <li key={index} className="mb-2 flex items-center">
                <input
                  type="checkbox"
                  id={`ingredient-${index}`}
                  name={ingredientName}
                  checked={selectedIngredients.has(ingredientName)}
                  onChange={() =>
                    handleIngredientSelectionChange(ingredientName)
                  }
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor={`ingredient-${index}`}>
                  {ingredientName}
                  {pantryItemNames.includes(ingredientName.toLowerCase()) && (
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
          Add this meal to Meal Planner
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
