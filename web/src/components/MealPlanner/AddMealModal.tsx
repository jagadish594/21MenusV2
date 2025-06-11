import React, { useState } from 'react'

import MealSearchBar from 'src/components/MealSearchBar/MealSearchBar'

import { MealType } from './MealPlannerTypes'
// We might need a simplified MealDisplayCard or similar for search results here
// import MealDisplayCard from 'src/components/MealDisplayCard/MealDisplayCard';

interface AddMealModalProps {
  isOpen: boolean
  onClose: () => void
  onMealSelected: (mealName: string, date: string, mealType: MealType) => void
  targetDate: string | null
  targetMealType: MealType | null
  initialMealName?: string | null // New prop
}

const AddMealModal: React.FC<AddMealModalProps> = ({
  isOpen,
  onClose,
  onMealSelected,
  targetDate,
  targetMealType,
  initialMealName,
}) => {
  const [selectedMealName, setSelectedMealName] = useState<string | null>(
    initialMealName || null
  )

  // Update selectedMealName if initialMealName changes and modal is opened with it
  React.useEffect(() => {
    if (isOpen && initialMealName) {
      setSelectedMealName(initialMealName)
    } else if (!isOpen) {
      // Optionally reset when modal closes if not handled by parent
      // setSelectedMealName(null);
    }
  }, [isOpen, initialMealName])

  const handleSelectMealSearchResult = (mealName: string) => {
    // This would be triggered when a user clicks a meal from search results
    // For now, let's assume MealSearchBar gives us the meal name directly
    // Or we might have a list of results and user clicks one
    setSelectedMealName(mealName)
    // In a more complex scenario, MealSearchBar might have its own state
    // and we'd fetch details here or just pass the name
  }

  const handleConfirmAddMeal = () => {
    if (selectedMealName && targetDate && targetMealType) {
      onMealSelected(selectedMealName, targetDate, targetMealType)
      setSelectedMealName(null) // Reset for next time
      onClose() // Close the modal
    }
  }

  if (!isOpen || !targetDate || !targetMealType) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">
          Add Meal to{' '}
          {targetMealType &&
            targetMealType.charAt(0).toUpperCase() +
              targetMealType.slice(1)}{' '}
          on {targetDate}
        </h2>

        {/* Meal Search Bar */}
        <div className="mb-4">
          <label
            htmlFor="meal-search"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Search for a meal:
          </label>
          {/* We'll integrate MealSearchBar here. For now, a placeholder or simple input */}
          <MealSearchBar
            onMealSelect={handleSelectMealSearchResult}
            initialQuery={initialMealName || ''}
          />
          {/* <input 
            type="text"
            placeholder="e.g., Chicken Soup"
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={(e) => setSelectedMealName(e.target.value)} // Temporary direct input
          /> */}
        </div>

        {/* Display selected meal or search results (placeholder) */}
        {selectedMealName && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-700">
              Selected: <strong>{selectedMealName}</strong>
            </p>
            {/* Here we could show more details if MealDisplayCard was used */}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmAddMeal}
            disabled={!selectedMealName}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-300"
          >
            Add Meal
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddMealModal
