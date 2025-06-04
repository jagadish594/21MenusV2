import React from 'react';
import type { PlannedMeal, MealType } from './MealPlannerTypes';

interface PlannedMealCardProps {
  plannedMeal: PlannedMeal;
  onDeleteMeal: (mealId: string, date: string, mealType: MealType) => void;
  // onClick?: (meal: PlannedMeal) => void; // Optional: to view details or edit
}

const PlannedMealCard: React.FC<PlannedMealCardProps> = ({ plannedMeal, onDeleteMeal }) => {
  return (
    <div className="relative p-2 pr-8 bg-white border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 hover:bg-gray-50">
      <span className="cursor-pointer" onClick={() => console.log('Meal clicked (for future edit/view):', plannedMeal)}>
        {plannedMeal.mealName}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent click on card itself
          onDeleteMeal(plannedMeal.id, plannedMeal.date, plannedMeal.mealType);
        }}
        className="absolute top-1 right-1 p-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full leading-none"
        aria-label="Delete meal"
      >
        &#x2715; {/* HTML entity for X */}
      </button>
      {/* TODO: Add a small 'x' button for removal if onRemove is provided - This is now implemented */}
    </div>
  );
};

export default PlannedMealCard;
