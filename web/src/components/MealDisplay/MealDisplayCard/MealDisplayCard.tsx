// c:\myProjects\windsurf-test\21menus\web\src\components\MealDisplay\MealDisplayCard.tsx
import React, { useState, useEffect } from 'react';
import { navigate, routes } from '@redwoodjs/router';

interface NutrientInfo {
  calories: string;
  protein: string;
  carbohydrates: string;
  fat: string;
}

interface MealDetails {
  mealName: string;
  ingredients: string[];
  nutrients: NutrientInfo;
}

interface MealDisplayCardProps {
  mealName: string | null;
}

const MealDisplayCard: React.FC<MealDisplayCardProps> = ({ mealName }) => {
  const [details, setDetails] = useState<MealDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mealName) {
      setDetails(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const fetchMealDetails = async () => {
      setIsLoading(true);
      setError(null);
      setDetails(null);
      try {
        const response = await fetch(`/api/getMealDetails?mealName=${encodeURIComponent(mealName)}`);
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
          } else {
            const errorText = await response.text();
            console.error('Server returned non-JSON error:', errorText);
            throw new Error(`Server error: ${response.status}. Check console for details.`);
          }
        }
        const data: MealDetails = await response.json();
        setDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch meal details');
        console.error(err);
      }
      setIsLoading(false);
    };

    fetchMealDetails();
  }, [mealName]);

  const handleAddToPlannerClick = () => {
    if (details?.mealName) {
      navigate(routes.planner({ addMeal: details.mealName }));
    }
  };
  if (!mealName) {
    return (
      <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow text-center text-gray-500">
        Select a meal from the search bar to see its details.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow text-center text-gray-500">
        Loading meal details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-6 border border-red-300 bg-red-50 rounded-lg shadow text-center text-red-700">
        Error: {error}
      </div>
    );
  }

  if (!details) {
    // This case is mostly covered by the initial !mealName check, 
    // but good for robustness if details somehow become null after loading without error.
    return null; 
  }

  return (
    <div className="mt-8 p-6 border border-gray-300 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">{details.mealName}</h2>
      <div>
        <h3 className="text-xl font-medium mb-2">Ingredients:</h3>
        {details.ingredients && details.ingredients.length > 0 ? (
          <ul className="list-disc list-inside text-gray-700">
            {details.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700">No ingredients listed.</p>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-xl font-medium mb-2">Nutrient Content:</h3>
        {details.nutrients ? (
          <ul className="text-gray-700">
            <li><strong>Calories:</strong> {details.nutrients.calories}</li>
            <li><strong>Protein:</strong> {details.nutrients.protein}</li>
            <li><strong>Carbohydrates:</strong> {details.nutrients.carbohydrates}</li>
            <li><strong>Fat:</strong> {details.nutrients.fat}</li>
          </ul>
        ) : (
          <p className="text-gray-700">No nutrient information available.</p>
        )}
      </div>
      <div className="mt-6 text-center">
        <button
          onClick={handleAddToPlannerClick}
          className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors duration-150 ease-in-out"
        >
          Add to Planner
        </button>
      </div>
    </div>
  );
}

export default MealDisplayCard
