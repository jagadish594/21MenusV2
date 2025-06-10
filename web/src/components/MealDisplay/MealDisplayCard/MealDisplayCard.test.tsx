// Mock the actual mutation function returned by useMutation
const mockCreateGroceryListItem = jest.fn().mockResolvedValue({ data: {} })

jest.mock('@redwoodjs/web', () => ({
  // Import and retain default behavior for other @redwoodjs/web exports
  ...jest.requireActual('@redwoodjs/web'),
  // Mock useMutation
  useMutation: () => [
    mockCreateGroceryListItem, // The mock mutation function itself
    { loading: false, error: null }, // The state object returned by useMutation
  ],
  // Mock toast
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

import { render, screen } from '@redwoodjs/testing/web'

import MealDisplayCard from './MealDisplayCard'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('MealDisplayCard', () => {
  // Clear mocks before each test to ensure test isolation
  beforeEach(() => {
    mockCreateGroceryListItem.mockClear()
    ;(jest.requireMock('@redwoodjs/web').toast.success as jest.Mock).mockClear()
    ;(jest.requireMock('@redwoodjs/web').toast.error as jest.Mock).mockClear()
  })

  it('renders successfully with default props', () => {
    expect(() => {
      render(<MealDisplayCard pantryItemNames={[]} />)
    }).not.toThrow()
  })

  it('renders successfully with a meal name', () => {
    expect(() => {
      render(<MealDisplayCard mealName="Test Meal" pantryItemNames={[]} />)
    }).not.toThrow()
    expect(screen.getByText('Ingredients for Test Meal:')).toBeInTheDocument()
  })

  // Add more tests here, for example:
  // - Test that ingredients are displayed
  // - Test that selecting an ingredient works
  // - Test that clicking "Add Ingredients to Grocery List" calls the mutation
})
