import type { APIGatewayEvent, Context } from 'aws-lambda'
import { logger } from 'src/lib/logger';
import OpenAI from 'openai';

// Initialize OpenAI client
// Ensure OPENAI_API_KEY is in your .env file (e.g., OPENAI_API_KEY="sk-...")
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// mockMealDatabase has been removed as we are now integrating with OpenAI.

async function getMealDetailsFromLLM(mealName: string): Promise<MealDetails | null> {
  logger.info(`[OpenAI] Attempting to fetch details for: ${mealName}`);

  if (!process.env.OPENAI_API_KEY) {
    logger.error('[OpenAI] API key is not configured. Please set OPENAI_API_KEY environment variable in your .env file.');
    // Return a specific structure indicating configuration error, consistent with MealDetails
    return {
      mealName: `OpenAI Configuration Error for ${mealName}`,
      ingredients: ['OpenAI API Key not set. Please configure it in your .env file.'],
      nutrients: { calories: 'N/A', protein: 'N/A', carbohydrates: 'N/A', fat: 'N/A' },
    };
  }

  const prompt = `
For the meal "${mealName}", provide a typical list of ingredients and estimated nutritional information (calories, protein, carbohydrates, fat).
Return the information as a single well-formed JSON object with the following exact structure:
{
  "mealName": "Name of the Meal (e.g., ${mealName})",
  "ingredients": ["ingredient1", "ingredient2", ...],
  "nutrients": {
    "calories": "X kcal",
    "protein": "Yg",
    "carbohydrates": "Zg",
    "fat": "Wg"
  }
}
If you cannot find information for "${mealName}" or it's not a valid meal, return a JSON object like this:
{
  "error": "Meal not found or invalid"
}
Ensure the entire output is only the JSON object, with no surrounding text or explanations.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125", // Model known to support JSON mode well
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }, 
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      logger.error('[OpenAI] No content received from API for meal:', mealName);
      return null;
    }

    logger.info(`[OpenAI] Raw response for ${mealName}: ${content}`);
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      logger.error('[OpenAI] Failed to parse JSON response from API for meal:', mealName, { error: parseError.message, rawContent: content });
      return null;
    }

    if (parsedResponse.error) {
      logger.warn(`[OpenAI] Meal not found or invalid for ${mealName} according to LLM: ${parsedResponse.error}`);
      return null;
    }

    if (parsedResponse.mealName && Array.isArray(parsedResponse.ingredients) && parsedResponse.nutrients &&
        typeof parsedResponse.nutrients.calories === 'string' &&
        typeof parsedResponse.nutrients.protein === 'string' &&
        typeof parsedResponse.nutrients.carbohydrates === 'string' &&
        typeof parsedResponse.nutrients.fat === 'string') {
      return parsedResponse as MealDetails;
    } else {
      logger.error('[OpenAI] Parsed response does not match expected MealDetails structure for meal:', mealName, { parsedResponse });
      return null;
    }

  } catch (error) {
    logger.error('[OpenAI] Error fetching details from OpenAI for meal:', mealName, { errorMessage: error.message, errorStatus: error.status });
    if (error.status === 401) {
        logger.error('[OpenAI] Authentication error. Please check your OPENAI_API_KEY.');
    } else if (error.status === 429) {
        logger.error('[OpenAI] Rate limit exceeded or quota reached.');
    }
    return null;
  }
}

export const handler = async (event: APIGatewayEvent, _context: Context) => {
  logger.info(`${event.httpMethod} ${event.path}: getMealDetails function invoked`);

  const mealNameQuery = event.queryStringParameters?.mealName?.toLowerCase();

  if (!mealNameQuery) {
    logger.error('Meal name parameter is missing');
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing mealName query parameter' }),
    };
  }

  logger.info(`Fetching details for meal: ${mealNameQuery}`);

  let mealDetails: MealDetails | null = null;

  try {
    mealDetails = await getMealDetailsFromLLM(mealNameQuery);
  } catch (error) {
    logger.error('Error calling getMealDetailsFromLLM:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch meal details from LLM service.' }),
    };
  }

  if (!mealDetails) {
    logger.warn(`No details found by LLM for meal: ${mealNameQuery}. Returning a default response.`);
    // Fallback to a generic response if LLM doesn't provide details
    // You might want to use a predefined 'default' meal from mockMealDatabase here if preferred
    // For now, constructing a simple default to indicate LLM failure/not found
    const defaultResponse: MealDetails = {
      mealName: `Details for '${mealNameQuery}' not found`,
      ingredients: ['N/A'],
      nutrients: {
        calories: 'N/A',
        protein: 'N/A',
        carbohydrates: 'N/A',
        fat: 'N/A',
      },
    };
    return {
      statusCode: 404, // Or 200 with a 'not found' message, depending on desired UX
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultResponse),
    };
  }

  // Ensure the mealName in the response matches the query if the LLM found it.
  // The placeholder getMealDetailsFromLLM already tries to set mealName appropriately.
  const responseDetails = mealDetails;


  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(responseDetails),
  };
};
