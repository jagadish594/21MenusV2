// import { Link, routes } from '@redwoodjs/router'
import { useState } from 'react'
import { Metadata } from '@redwoodjs/web'
//import MealSearchBar from 'src/components/MealSearchBar/MealSearchBar'
import MealSearchBar from 'src/components/MealSearchBar/MealSearchBar'
import MealDisplayCard from 'src/components/MealDisplay/MealDisplayCard/MealDisplayCard'

const HomePage = () => {
  const [selectedMealName, setSelectedMealName] = useState<string | null>(null);

  const handleMealSelected = (mealName: string) => {
    setSelectedMealName(mealName);
    // Here, you would typically trigger fetching meal details (ingredients, nutrients)
    console.log(`HomePage: Meal selected - ${mealName}`);
  };
  return (
    <>
      <Metadata title="21menus - Meal Planner" description="Plan your weekly meals with 21menus" />

      <div className="container mx-auto p-4">
        <MealSearchBar onMealSelect={handleMealSelected} />
        {/* Other sections will go here */}
        <MealDisplayCard mealName={selectedMealName} />
      </div>
    </>
  )
}

export default HomePage
