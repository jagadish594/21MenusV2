import { requireAuth as _requireAuth } from 'src/lib/auth'
// We can re-use or define types similar to what the frontend expects,
// to guide what the LLM should return.
interface Ingredient {
  name: string
  quantity?: string | number
  unit?: string
  calories?: string | number
}

interface NutrientInfo {
  calories: string
  protein: string
  carbs: string
  fat: string
}

interface MealDetailsFromLLM {
  mealName: string
  description: string
  ingredients: Ingredient[]
  instructions: string[]
  preparationTime: string
  cookingTime: string
  servings: string
  nutrients: NutrientInfo
}

export const getMealDetails = async ({ mealName }: { mealName: string }) => {
  console.log(`[getMealDetails Service] Received request for meal: ${mealName}`)

  // Temporarily hardcoding for local development as process.env.REDWOOD_API_URL was undefined.
  // API port is 8912. Functions are served relative to the API server root.
  const functionEndpoint = 'http://localhost:8912/getMealDetails'
  const url = new URL(functionEndpoint)
  url.searchParams.append('mealName', mealName)

  console.log(`[getMealDetails Service] Calling internal function: ${url.toString()}`)

  try {
    // This is an internal call to another Redwood function, so no special LLM API keys are needed here.
    // The target function (/api/getMealDetails) will handle its own OpenAI authentication.
    const response = await fetch(url.toString())

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(
        `[getMealDetails Service] Internal function call failed with status ${response.status}: ${errorBody}`
      )
      return JSON.stringify({
        error: `Internal function call failed: ${response.statusText}`,
        mealName: mealName,
        ingredients: [],
      })
    }

    // Assuming the LLM returns a JSON object directly with the meal details
    const mealDetailsFromLLM: MealDetailsFromLLM = await response.json()

    console.log(
      `[getMealDetails Service] Successfully received details from internal function for: ${mealName}`
    )
    // The GraphQL schema expects a String, so we stringify the JSON object
    return JSON.stringify(mealDetailsFromLLM)
  } catch (error) {
    console.error(
      `[getMealDetails Service] Error calling internal function or processing response: ${error.message}`,
      error
    )
    // Return a structured error string
    return JSON.stringify({
      error: `Failed to get meal details: ${error.message}`,
      mealName: mealName,
      ingredients: [],
    })
  }
}
