import React, { useState } from 'react';
import { format, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import type { WeeklyPlan, MealType, PlannedMeal } from './MealPlannerTypes';
import PlannedMealCard from './PlannedMealCard';

interface WeeklyCalendarViewProps {
  currentWeekStartDate: Date;
  weeklyPlan: WeeklyPlan;
  onAddMeal: (date: string, mealType: MealType) => void;
  onDeleteMeal: (mealId: string, date: string, mealType: MealType) => void;
  // onMealClick?: (meal: PlannedMeal) => void;
}

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({ 
  currentWeekStartDate,
  weeklyPlan,
  onAddMeal,
  onDeleteMeal
}) => {
  
  const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStartDate, i));

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow">
      <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">
        Week of {format(currentWeekStartDate, 'MMMM do, yyyy')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-4">
        {days.map(day => (
          <div key={day.toISOString()} className="bg-white p-3 rounded shadow-sm border border-gray-200">
            <h3 className="font-semibold text-center text-sm md:text-base text-gray-600">
              {format(day, 'EEE')} {/* Mon, Tue, etc. */}
            </h3>
            <p className="text-center text-xs text-gray-500 mb-3">
              {format(day, 'MMM d')} {/* Jun 3, etc. */}
            </p>
            <div className="space-y-3 mt-2">
              {mealTypes.map(mealType => {
                const formattedDate = format(day, 'yyyy-MM-dd');
                const mealsForSlot = weeklyPlan[formattedDate]?.[mealType] || [];
                return (
                  <div key={mealType} className="meal-slot border-t border-gray-200 pt-2">
                    <h4 className="text-xs font-medium text-gray-500 capitalize mb-1">
                      {mealType}
                    </h4>
                    <div className="space-y-1">
                      {mealsForSlot.map(plannedMeal => (
                        <PlannedMealCard key={plannedMeal.id} plannedMeal={plannedMeal} onDeleteMeal={onDeleteMeal} />
                      ))}
                      {mealsForSlot.length === 0 && (
                        <p className="text-xs text-gray-400 italic">No meals planned.</p>
                      )}
                    </div>
                    <button 
                      onClick={() => onAddMeal(formattedDate, mealType)}
                      className="mt-1 w-full text-xs text-center py-1 px-2 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
                    >
                      + Add Meal
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {/* TODO: Add navigation for previous/next week */}
      {/* TODO: Display actual meals from weeklyPlan */}
      {/* TODO: Implement onAddMeal functionality */}
    </div>
  );
};

export default WeeklyCalendarView;
