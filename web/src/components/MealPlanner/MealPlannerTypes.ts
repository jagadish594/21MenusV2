export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface PlannedMeal {
  id: string; // Unique identifier for the planned meal instance
  date: string; // ISO date string (e.g., '2024-06-04')
  mealType: MealType;
  mealName: string;
  // Optional: You might want to store more details, like the full MealDetails object
  // mealDetails?: import('../MealDisplay/MealDisplayCard/MealDisplayCard').MealDetails; // If you want to link to the full details type
}

export interface WeeklyPlan {
  // Key is an ISO date string (e.g., '2024-06-04')
  [date: string]: {
    // Key is a MealType
    [key in MealType]?: PlannedMeal[]; // Allows multiple meals per slot
  };
}
