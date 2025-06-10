import { useState } from 'react'

import { gql } from 'graphql-tag'

import { MetaTags, useQuery } from '@redwoodjs/web'

import MealDisplayCard from 'src/components/MealDisplay/MealDisplayCard/MealDisplayCard'
import MealSearchBar from 'src/components/MealSearchBar/MealSearchBar'
// import { appEvents } from 'src/lib/eventEmitter' // No longer needed for diagnostics here

export const PANTRY_ITEMS_FOR_HOME_QUERY = gql`
  query PantryItemsForHomeQuery {
    pantryItems {
      id
      name
    }
  }
`

const HomePage = () => {
  // console.log('[HomePage] Initializing. appEvents instance:', appEvents) // Diagnostic log removed
  const [selectedMealName, setSelectedMealName] = useState<string | null>(null)
  const {
    data: pantryData,
    loading: pantryLoading,
    error: pantryError,
  } = useQuery(PANTRY_ITEMS_FOR_HOME_QUERY)

  const pantryItemNames =
    pantryData?.pantryItems.map((item) => item.name.toLowerCase()) || []

  const handleMealSelected = (mealName: string) => {
    setSelectedMealName(mealName)
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
          mealName={selectedMealName}
          pantryItemNames={pantryItemNames}
          pantryLoading={pantryLoading}
          pantryError={pantryError}
        />
      </div>
    </>
  )
}

export default HomePage

