import { RedwoodGraphQLError } from '@redwoodjs/graphql-server'

export const suggestMealsFromPantry = async ({
  itemNames,
}: {
  itemNames: string[]
}) => {
  console.log(
    `[suggestMealsFromPantry Service] Received request for items: ${itemNames.join(', ')}`
  )

  const llmApiUrlBase = process.env.LLM_API_URL
  // Assuming the suggestion endpoint is at a path like '/suggest-meals'
  // And it expects a POST request with itemNames in the body.
  // Ensure no trailing slash from env var before appending specific path
  const llmOpenAIEndpoint = llmApiUrlBase
    ? `${llmApiUrlBase.replace(/\/$/, '')}/chat/completions` // OpenAI chat completions endpoint
    : null

  if (!llmOpenAIEndpoint) {
    console.error(
      '[suggestMealsFromPantry Service] LLM_API_URL not set in environment. Cannot suggest meals.'
    )
    throw new RedwoodGraphQLError(
      'LLM service is not configured. Please set LLM_API_URL.'
    )
  }

  // More specific prompt instructing JSON array output
  const prompt = `Given these pantry items: ${itemNames.join(', ')}, suggest 3-5 simple meals that can be made. For each meal, briefly list the key pantry items used from the provided list. Return ONLY a JSON array of strings, where each string is a meal suggestion. For example: ["Spaghetti with meatballs using ground beef, pasta, tomato sauce", "Chicken stir-fry using chicken breast, soy sauce, broccoli"]. Do not include any other text or explanation outside of this JSON array.`

  console.log(
    `[suggestMealsFromPantry Service] Calling LLM API: ${llmOpenAIEndpoint}`
  )
  console.log(`[suggestMealsFromPantry Service] Prompt: ${prompt}`)

  try {
    const response = await fetch(llmOpenAIEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Use OPENAI_API_KEY
      },
      // The body structure depends on what the LLM endpoint expects.
      // Sending both 'items' and the detailed 'prompt' might be redundant if the LLM uses the prompt directly.
      // Let's assume the LLM endpoint is designed to take a 'prompt' field.
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Or your preferred OpenAI model
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that suggests meals based on pantry items. '
              + 'Return ONLY a JSON array of strings, where each string is a meal suggestion. '
              + 'For example: ["Spaghetti with meatballs using ground beef, pasta, tomato sauce", "Chicken stir-fry using chicken breast, soy sauce, broccoli"]. '
              + 'Do not include any other text or explanation outside of this JSON array.',
          },
          {
            role: 'user',
            content: prompt, // The prompt variable already contains the detailed user request
          }
        ],
        temperature: 0.7, // Optional: Adjust for creativity
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(
        `[suggestMealsFromPantry Service] LLM API request failed with status ${response.status}: ${errorBody}`
      )
      throw new RedwoodGraphQLError(
        `LLM API request failed: ${response.statusText} - ${errorBody}`
      )
    }

    const responseText = await response.text()
    let suggestions: string[]

    try {
      const openAIResponse = JSON.parse(responseText)
      if (
        openAIResponse.choices &&
        openAIResponse.choices.length > 0 &&
        openAIResponse.choices[0].message &&
        openAIResponse.choices[0].message.content
      ) {
        const messageContent = openAIResponse.choices[0].message.content
        // The LLM is instructed to return a JSON array string directly in the content.
        try {
          suggestions = JSON.parse(messageContent)
          if (
            !Array.isArray(suggestions) ||
            !suggestions.every((item) => typeof item === 'string')
          ) {
            console.error(
              '[suggestMealsFromPantry Service] LLM message content is not a valid JSON array of strings:',
              messageContent
            )
            throw new Error(
              'LLM message content is not a valid JSON array of strings.'
            )
          }
        } catch (e) {
          console.error(
            '[suggestMealsFromPantry Service] Failed to parse LLM message content as JSON array. Content was:',
            messageContent,
            'Error:',
            e
          )
          throw new Error(
            'Failed to parse LLM message content. Ensure LLM returns a JSON array string.'
          )
        }
      } else {
        console.error(
          '[suggestMealsFromPantry Service] Unexpected OpenAI API response structure. Missing choices or message content. Response:',
          responseText
        )
        throw new Error('Unexpected OpenAI API response structure.')
      }
    } catch (error) { // Catches errors from JSON.parse(responseText) or JSON.parse(messageContent)
      console.error(
        '[suggestMealsFromPantry Service] Failed to parse LLM response JSON or its content. Response text:',
        responseText, // Log the raw response text for debugging
        'Error:',
        error
      )
      throw new RedwoodGraphQLError(
        `Failed to process LLM response: ${error.message}`
      )
    }

    console.log(
      `[suggestMealsFromPantry Service] Successfully received and parsed suggestions from LLM.`
    )
    return suggestions
  } catch (error) {
    console.error(`[suggestMealsFromPantry Service] Error calling LLM or processing response: ${error.message}`, error)
    // Optionally, re-throw a more generic error or handle specific error types
    throw new RedwoodGraphQLError(`Failed to fetch meal suggestions. Please try again later. Error: ${error.message}`)
  }
}
