import { getMealDetails } from './meals'

// Mock the global fetch function to avoid actual network calls in tests.
global.fetch = jest.fn()

describe('getMealDetails', () => {
  const originalApiUrl = process.env.API_URL
  const mockApiUrl = 'http://localhost:8912' // Use the dev url for consistency

  // The getMealDetails service relies on an environment variable to build its request URL.
  // We set it here to ensure the function doesn't exit early before calling fetch.
  beforeAll(() => {
    // In a test env, NODE_ENV is 'test', so API_URL is used.
    process.env.API_URL = mockApiUrl
  })

  afterAll(() => {
    // Restore original environment variable
    process.env.API_URL = originalApiUrl
  })

  // Reset the fetch mock before each test to ensure isolation.
  beforeEach(() => {
    ;(fetch as jest.Mock).mockClear()
  })

  it('returns mock meal details as a JSON string', async () => {
    const mealName = 'Test Meal'
    const mockMealDetails = {
      mealName,
      description: 'A delicious test meal.',
      ingredients: [{ name: 'Test Ingredient', quantity: '1' }],
      instructions: ['Step 1: Cook the test meal.'],
      nutrients: { calories: '300' },
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMealDetails),
    })

    const result = await getMealDetails({ mealName })
    const parsedResult = JSON.parse(result)

    expect(parsedResult).toEqual(mockMealDetails)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      `${mockApiUrl}/getMealDetails?mealName=${encodeURIComponent(mealName)}`
    )
  })

  it('returns specific mock data for a known meal', async () => {
    const mealName = 'Pizza'
    const mockPizzaDetails = {
      mealName: 'Pizza',
      description: 'A classic cheese pizza.',
      ingredients: [{ name: 'Dough', quantity: '1 ball' }],
      instructions: ['1. Bake it.'],
      nutrients: { calories: '800' },
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPizzaDetails),
    })

    const result = await getMealDetails({ mealName })
    const parsedResult = JSON.parse(result)

    expect(parsedResult.mealName).toEqual('Pizza')
    expect(parsedResult.ingredients.length).toBeGreaterThanOrEqual(1)
  })

  it('handles fetch network errors gracefully', async () => {
    const mealName = 'Error Meal'
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'))

    const result = await getMealDetails({ mealName })
    const parsedResult = JSON.parse(result)

    expect(parsedResult.error).toContain(
      'Failed to get meal details: Network failure'
    )
  })

  it('handles non-ok HTTP responses gracefully', async () => {
    const mealName = 'Failed Meal'
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('Server is down'),
    })

    const result = await getMealDetails({ mealName })
    const parsedResult = JSON.parse(result)

    expect(parsedResult.error).toContain(
      'Internal function call failed: Internal Server Error'
    )
  })
})

