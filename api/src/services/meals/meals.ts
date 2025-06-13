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

  let baseUrl
  if (process.env.NODE_ENV === 'development') {
    // In development, we know the API server is on port 8912 from redwood.toml
    baseUrl = 'http://localhost:8912'
  } else {
    // In production, we rely on an environment variable for the public API URL.
    // This must be set in your deployment environment (e.g., Netlify, Vercel).
    baseUrl = process.env.API_URL
  }

  if (!baseUrl) {
    const errorMessage =
      process.env.NODE_ENV === 'development'
        ? 'Could not determine base URL in development.'
        : 'API_URL environment variable is not set in production.'

    console.error(`[getMealDetails Service] ${errorMessage}`)
    return JSON.stringify({
      error: 'Internal service configuration error: API URL is not configured.',
      mealName: mealName,
      ingredients: [],
    })
  }

  // The function is served at the root of the API server, not under /api
  const functionEndpoint = `${baseUrl}/getMealDetails`
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
