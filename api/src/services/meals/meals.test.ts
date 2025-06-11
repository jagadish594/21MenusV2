import { getMealDetails } from './meals'

// Generated boilerplate tests do not account for all circumstances
// and can fail without adjustments, e.g. Float and DateTime types.
//           Please refer to the RedwoodJS Testing Docs:
//        https://redwoodjs.com/docs/testing#testing-services
// https://redwoodjs.com/docs/testing#jest-expect-type-considerations

describe('getMealDetails', () => {
  it('returns mock meal details as a JSON string', async () => {
    const mealName = 'Test Meal'
    const result = await getMealDetails({ mealName })

    expect(typeof result).toBe('string')
    const parsedResult = JSON.parse(result)

    expect(parsedResult).toHaveProperty('mealName', mealName)
    expect(parsedResult).toHaveProperty('description')
    expect(parsedResult).toHaveProperty('ingredients')
    expect(parsedResult).toHaveProperty('instructions')
    expect(parsedResult).toHaveProperty('nutrients')
    expect(Array.isArray(parsedResult.ingredients)).toBe(true)
  })

  // Example of a more specific test if you know the exact mock structure
  it('returns specific mock data for a known meal', async () => {
    const mealName = 'Pizza'
    const result = await getMealDetails({ mealName })
    const parsedResult = JSON.parse(result)

    expect(parsedResult.mealName).toEqual('Pizza')
    expect(parsedResult.ingredients.length).toBeGreaterThanOrEqual(1) // Assuming mock provides at least one ingredient
  })
})
