import React from 'react'

import { format, addDays } from 'date-fns'

import type { WeeklyPlan, MealType, PlannedMeal } from './MealPlannerTypes'
import PlannedMealCard from './PlannedMealCard'

interface WeeklyCalendarViewProps {
  currentWeekStartDate: Date
  weeklyPlan: WeeklyPlan
  onAddMeal: (date: string, mealType: MealType) => void
  onDeleteMeal: (mealId: string, date: string, mealType: MealType) => void
  // onMealClick?: (meal: PlannedMeal) => void;
}

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({
  currentWeekStartDate,
  weeklyPlan,
  onAddMeal,
  onDeleteMeal,
}) => {
  const days = Array.from({ length: 7 }).map((_, i) =>
    addDays(currentWeekStartDate, i)
  )

  return (
    <div className="rounded-lg bg-gray-50 p-4 shadow">
      <h2 className="mb-6 text-center text-2xl font-semibold text-gray-700">
        Week of {format(currentWeekStartDate, 'MMMM do, yyyy')}
      </h2>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-7 md:gap-4">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="rounded border border-gray-200 bg-white p-3 shadow-sm"
          >
            <h3 className="text-center text-sm font-semibold text-gray-600 md:text-base">
              {format(day, 'EEE')} {/* Mon, Tue, etc. */}
            </h3>
            <p className="mb-3 text-center text-xs text-gray-500">
              {format(day, 'MMM d')} {/* Jun 3, etc. */}
            </p>
            <div className="mt-2 space-y-3">
              {mealTypes.map((mealType) => {
                const formattedDate = format(day, 'yyyy-MM-dd')
                const mealsForSlot = weeklyPlan[formattedDate]?.[mealType] || []
                return (
                  <div
                    key={mealType}
                    className="meal-slot border-t border-gray-200 pt-2"
                  >
                    <h4 className="mb-1 text-xs font-medium capitalize text-gray-500">
                      {mealType}
                    </h4>
                    <div className="space-y-1">
                      {mealsForSlot.map((plannedMeal) => (
                        <PlannedMealCard
                          key={plannedMeal.id}
                          plannedMeal={plannedMeal}
                          onDeleteMeal={onDeleteMeal}
                        />
                      ))}
                      {mealsForSlot.length === 0 && (
                        <p className="text-xs italic text-gray-400">
                          No meals planned.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onAddMeal(formattedDate, mealType)}
                      className="mt-1 w-full rounded bg-green-100 px-2 py-1 text-center text-xs text-green-700 transition-colors hover:bg-green-200"
                    >
                      + Add Meal
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {/* TODO: Add navigation for previous/next week */}
      {/* TODO: Display actual meals from weeklyPlan */}
      {/* TODO: Implement onAddMeal functionality */}
    </div>
  )
}

export default WeeklyCalendarView
