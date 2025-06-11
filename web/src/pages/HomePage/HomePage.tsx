import React, { useMemo } from 'react' // useState might still be needed in HomePageContent or removed if all state moves to context

import { gql } from 'graphql-tag'

import { MetaTags, useQuery } from '@redwoodjs/web'

import MealDisplayCard from 'src/components/MealDisplay/MealDisplayCard/MealDisplayCard'
import MealSearchBar from 'src/components/MealSearchBar/MealSearchBar'
import { MealQueryProvider, useMealQuery } from 'src/contexts/MealQueryContext'
// import { appEvents } from 'src/lib/eventEmitter' // No longer needed for diagnostics here

export const PANTRY_ITEMS_FOR_HOME_QUERY = gql`
  query PantryItemsForHomeQuery {
    pantryItems {
      id
      name
    }
  }
`

const HomePageContent = () => {
  // console.log('[HomePage] Initializing. appEvents instance:', appEvents) // Diagnostic log removed
  const {
    queriedMealName,
    setQueriedMealName,
    mealIngredients,
    setMealIngredients,
    selectedIngredients,
    setSelectedIngredients,
    toggleIngredientSelection,
  } = useMealQuery()
  const {
    data: pantryData,
    loading: pantryLoading,
    error: pantryError,
  } = useQuery(PANTRY_ITEMS_FOR_HOME_QUERY)

  const pantryItemNames = useMemo(() => {
    return pantryData?.pantryItems.map((item) => item.name.toLowerCase()) || []
  }, [pantryData])

  const handleMealSelected = (mealName: string) => {
    setQueriedMealName(mealName)
    // Here, you would typically trigger fetching meal details (ingredients, nutrients)
    console.log(`HomePage: Meal selected - ${mealName}`)
  }
  return (
    <>
      <MetaTags
        title="21menus - Meal Planner"
        description="Plan your weekly meals with 21menus"
      />

      <div className="container mx-auto p-4">
        <MealSearchBar onMealSelect={handleMealSelected} />
        {/* Other sections will go here */}
        <MealDisplayCard
          selectedMealName={queriedMealName} // Pass context's queriedMealName
          // The following props will need to be re-evaluated based on MealDisplayCard's new role with context
          // For now, we pass what's available. MealDisplayCard will be updated next.
          mealIngredients={mealIngredients} // from context
          setMealIngredients={setMealIngredients} // from context
          selectedIngredients={selectedIngredients} // from context
          setSelectedIngredients={setSelectedIngredients} // from context
          toggleIngredientSelection={toggleIngredientSelection} // from context
          pantryItemNames={pantryItemNames}
          pantryLoading={pantryLoading}
          pantryError={pantryError}
        />
      </div>
    </>
  )
}

// Define the main HomePage component that includes the Provider
const HomePage = () => {
  return (
    <MealQueryProvider>
      <HomePageContent />
    </MealQueryProvider>
  )
}

export default HomePage
