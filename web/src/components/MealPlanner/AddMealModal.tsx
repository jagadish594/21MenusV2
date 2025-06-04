import React, { useState } from 'react';
import { MealType } from './MealPlannerTypes';
import MealSearchBar from 'src/components/MealSearchBar/MealSearchBar';
// We might need a simplified MealDisplayCard or similar for search results here
// import MealDisplayCard from 'src/components/MealDisplayCard/MealDisplayCard';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMealSelected: (mealName: string, date: string, mealType: MealType) => void;
  targetDate: string | null;
  targetMealType: MealType | null;
  initialMealName?: string | null; // New prop
}

const AddMealModal: React.FC<AddMealModalProps> = ({
  isOpen,
  onClose,
  onMealSelected,
  targetDate,
  targetMealType,
  initialMealName,
}) => {
  const [selectedMealName, setSelectedMealName] = useState<string | null>(initialMealName || null);

  // Update selectedMealName if initialMealName changes and modal is opened with it
  React.useEffect(() => {
    if (isOpen && initialMealName) {
      setSelectedMealName(initialMealName);
    } else if (!isOpen) {
      // Optionally reset when modal closes if not handled by parent
      // setSelectedMealName(null); 
    }
  }, [isOpen, initialMealName]);

  const handleSelectMealSearchResult = (mealName: string) => {
    // This would be triggered when a user clicks a meal from search results
    // For now, let's assume MealSearchBar gives us the meal name directly
    // Or we might have a list of results and user clicks one
    setSelectedMealName(mealName);
    // In a more complex scenario, MealSearchBar might have its own state
    // and we'd fetch details here or just pass the name
  };

  const handleConfirmAddMeal = () => {
    if (selectedMealName && targetDate && targetMealType) {
      onMealSelected(selectedMealName, targetDate, targetMealType);
      setSelectedMealName(null); // Reset for next time
      onClose(); // Close the modal
    }
  };

  if (!isOpen || !targetDate || !targetMealType) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          Add Meal to {targetMealType && targetMealType.charAt(0).toUpperCase() + targetMealType.slice(1)} on {targetDate}
        </h2>
        
        {/* Meal Search Bar */}
        <div className="mb-4">
          <label htmlFor="meal-search" className="block text-sm font-medium text-gray-700 mb-1">Search for a meal:</label>
          {/* We'll integrate MealSearchBar here. For now, a placeholder or simple input */}
          <MealSearchBar onMealSelect={handleSelectMealSearchResult} initialQuery={initialMealName || ''} />
          {/* <input 
            type="text"
            placeholder="e.g., Chicken Soup"
            className="w-full p-2 border border-gray-300 rounded-md"
            onChange={(e) => setSelectedMealName(e.target.value)} // Temporary direct input
          /> */}
        </div>

        {/* Display selected meal or search results (placeholder) */}
        {selectedMealName && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">Selected: <strong>{selectedMealName}</strong></p>
            {/* Here we could show more details if MealDisplayCard was used */}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmAddMeal}
            disabled={!selectedMealName}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:bg-gray-300"
          >
            Add Meal
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMealModal;
