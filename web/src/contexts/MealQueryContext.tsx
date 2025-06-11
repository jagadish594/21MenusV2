import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react'

// Define the shape of the context data
interface MealQueryState {
  queriedMealName: string | null
  setQueriedMealName: (name: string | null) => void
  queriedMealDetails: MealDetails | null // Added to store full meal details
  setQueriedMealDetails: (details: MealDetails | null) => void // Added setter for details
  mealIngredients: string[]
  setMealIngredients: (ingredients: string[]) => void
  selectedIngredients: Set<string>
  setSelectedIngredients: (selected: Set<string>) => void
  toggleIngredientSelection: (ingredientName: string) => void
}

// Define MealDetails structure here or import if defined elsewhere and accessible
// For now, defining a simplified version. Ensure it matches MealDisplayCard's MealDetails.
interface NutrientInfo {
  calories: string;
  protein: string;
  carbohydrates: string;
  fat: string;
}

interface MealDetails { // This should ideally be imported from where MealDisplayCard defines it
  mealName: string;
  ingredients: string[];
  nutrients: NutrientInfo | null; // Use the defined interface, allow null if nutrients can be absent
}

// Create the context with a default undefined value
const MealQueryContext = createContext<MealQueryState | undefined>(undefined)

// Define the props for the provider
interface MealQueryProviderProps {
  children: ReactNode
}

// Create the provider component
export const MealQueryProvider: React.FC<MealQueryProviderProps> = ({
  children,
}) => {
  const [queriedMealName, _setQueriedMealName] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const storedMealName = sessionStorage.getItem('queriedMealName')
      return storedMealName ? JSON.parse(storedMealName) : null
    }
    return null
  })

  const [queriedMealDetails, _setQueriedMealDetails] = useState<MealDetails | null>(() => {
    if (typeof window !== 'undefined') {
      const storedMealDetails = sessionStorage.getItem('cachedMealDetails')
      if (storedMealDetails) {
        const details = JSON.parse(storedMealDetails) as MealDetails
        // Ensure cached details match the cached meal name if both exist
        const storedMealName = sessionStorage.getItem('queriedMealName')
        if (storedMealName && details.mealName === JSON.parse(storedMealName)) {
          return details
        }
      }
    }
    return null
  })

  const [mealIngredients, setMealIngredients] = useState<string[]>([])
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(
    new Set()
  )

  const setQueriedMealName = useCallback((name: string | null) => {
    _setQueriedMealName(name)
    if (typeof window !== 'undefined') {
      if (name) {
        sessionStorage.setItem('queriedMealName', JSON.stringify(name))
        // If name changes, clear cached details for the *previous* meal
        if (queriedMealDetails && queriedMealDetails.mealName !== name) {
          _setQueriedMealDetails(null)
          sessionStorage.removeItem('cachedMealDetails')
        }
      } else {
        sessionStorage.removeItem('queriedMealName')
        _setQueriedMealDetails(null) // Clear details if name is cleared
        sessionStorage.removeItem('cachedMealDetails')
      }
    }
  }, [queriedMealDetails])

  const setQueriedMealDetails = useCallback((details: MealDetails | null) => {
    _setQueriedMealDetails(details)
    if (typeof window !== 'undefined') {
      if (details && details.mealName === queriedMealName) { // Only cache if names match
        sessionStorage.setItem('cachedMealDetails', JSON.stringify(details))
      } else if (!details) {
        sessionStorage.removeItem('cachedMealDetails')
      }
    }
  }, [queriedMealName])

  const toggleIngredientSelection = useCallback((ingredientName: string) => {
    setSelectedIngredients((prevSelected) => {
      const newSelected = new Set(prevSelected)
      if (newSelected.has(ingredientName)) {
        newSelected.delete(ingredientName)
      } else {
        newSelected.add(ingredientName)
      }
      return newSelected
    })
  }, [])

  // Effect to initialize mealIngredients and selectedIngredients from cached details if available
  React.useEffect(() => {
    if (queriedMealDetails && queriedMealDetails.mealName === queriedMealName) {
      setMealIngredients(queriedMealDetails.ingredients || [])
      // setSelectedIngredients(new Set(queriedMealDetails.ingredients || [])) // Optionally auto-select all from cache
      setSelectedIngredients(new Set()) // Or start fresh
    }
  }, [queriedMealDetails, queriedMealName])

    const contextValue = useMemo(() => ({
    queriedMealName,
    setQueriedMealName,
    queriedMealDetails,
    setQueriedMealDetails,
    mealIngredients,
    setMealIngredients,
    selectedIngredients,
    setSelectedIngredients,
    toggleIngredientSelection,
  }), [
    queriedMealName,
    setQueriedMealName,
    queriedMealDetails,
    setQueriedMealDetails,
    mealIngredients,
    // setMealIngredients is stable
    selectedIngredients,
    // setSelectedIngredients is stable
    toggleIngredientSelection,
  ])

  return (
    <MealQueryContext.Provider value={contextValue}>
      {children}
    </MealQueryContext.Provider>
  )
}

// Custom hook to use the meal query context
export const useMealQuery = () => {
  const context = useContext(MealQueryContext)
  if (context === undefined) {
    throw new Error('useMealQuery must be used within a MealQueryProvider')
  }
  return context
}
