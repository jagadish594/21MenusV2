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

  const llmApiUrl = process.env.LLM_API_URL // IMPORTANT: Set this in your .env file!
  // Example: LLM_API_URL=http://localhost:5000/generate-meal-details
  // Or your actual LLM provider's endpoint

  if (!llmApiUrl) {
    console.error(
      '[getMealDetails Service] LLM_API_URL is not set in environment variables.'
    )
    // Return a structured error string, or throw an error
    // Depending on how your frontend handles GraphQL errors from string fields
    return JSON.stringify({
      error: 'LLM service is not configured.',
      mealName: mealName,
      ingredients: [],
      // ... other fields to make it parsable by frontend if it expects structure
    })
  }

  // Construct the full URL with query parameters
  // Adjust if your LLM API expects mealName differently (e.g., in body for POST)
  const url = new URL(llmApiUrl)
  url.searchParams.append('mealName', mealName)

  console.log(`[getMealDetails Service] Calling LLM API: ${url.toString()}`)

  try {
    // IMPORTANT: Add any necessary headers, like Authorization for API keys
    // const response = await fetch(url.toString(), {
    //   method: 'GET', // or 'POST' if required
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.LLM_API_KEY}` // Example API Key
    //   },
    //   // body: JSON.stringify({ mealName: mealName }) // If it's a POST request
    // });
    const response = await fetch(url.toString()) // Assuming simple GET for now

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(
        `[getMealDetails Service] LLM API request failed with status ${response.status}: ${errorBody}`
      )
      // Again, return a structured error string
      return JSON.stringify({
        error: `LLM API request failed: ${response.statusText}`,
        mealName: mealName,
        ingredients: [],
      })
    }

    // Assuming the LLM returns a JSON object directly with the meal details
    const mealDetailsFromLLM: MealDetailsFromLLM = await response.json()

    console.log(
      `[getMealDetails Service] Successfully received details from LLM for: ${mealName}`
    )
    // The GraphQL schema expects a String, so we stringify the JSON object
    return JSON.stringify(mealDetailsFromLLM)
  } catch (error) {
    console.error(
      `[getMealDetails Service] Error calling LLM or processing response: ${error.message}`,
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
