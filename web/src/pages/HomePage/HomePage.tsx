import { useState } from 'react'

import { MetaTags } from '@redwoodjs/web'

import MealDisplayCard from 'src/components/MealDisplay/MealDisplayCard/MealDisplayCard'
import MealSearchBar from 'src/components/MealSearchBar/MealSearchBar'
// import { appEvents } from 'src/lib/eventEmitter' // No longer needed for diagnostics here

const HomePage = () => {
  // console.log('[HomePage] Initializing. appEvents instance:', appEvents) // Diagnostic log removed
  const [selectedMealName, setSelectedMealName] = useState<string | null>(null)

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
        <MealDisplayCard mealName={selectedMealName} />
      </div>
    </>
  )
}

export default HomePage

