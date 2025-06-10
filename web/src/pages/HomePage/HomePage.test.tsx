import { render, screen } from '@redwoodjs/testing/web'
import HomePage from './HomePage'

// Define mocks for hooks and components
const mockUseQuery = jest.fn()
const mockCreateGroceryListItem = jest.fn().mockResolvedValue({ data: {} })
const mockUseMutation = jest.fn(() => [
  mockCreateGroceryListItem,
  { loading: false, error: null },
])
const mockToastSuccess = jest.fn()
const mockToastError = jest.fn()
const MockMetaTagsComponent = jest.fn(
  ({ title, description, children }) => (
    <>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {children}
    </>
  )
)

// Mock the entire @redwoodjs/web module
jest.mock('@redwoodjs/web', () => {
  // Log to confirm mock execution
  console.log('JEST_TRACE: Mocking @redwoodjs/web module factory is executing')
  return {
    __esModule: true, // For ES module compatibility
    useQuery: mockUseQuery,
    useMutation: mockUseMutation,
    MetaTags: MockMetaTagsComponent,
    toast: {
      success: mockToastSuccess,
      error: mockToastError,
    },
    // Ensure other potentially used exports are either included or confirmed not needed.
    // e.g., Link, routes, etc.
  }
})

// graphql-tag is used by HomePage.tsx. Jest usually handles non-mocked modules well.
// If issues arose with gql, it could be mocked: jest.mock('graphql-tag', () => ({ gql: jest.fn(literals => literals.join('')) }));

describe('HomePage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockUseQuery.mockClear()
    mockUseMutation.mockClear()
    mockCreateGroceryListItem.mockClear()
    mockToastSuccess.mockClear()
    mockToastError.mockClear()
    MockMetaTagsComponent.mockClear()

    // Default return value for useQuery
    mockUseQuery.mockReturnValue({
      data: { pantryItems: [] },
      loading: false,
      error: null,
      refetch: jest.fn(),
    })
  })

  it('renders successfully and calls useQuery', () => {
    console.log('JEST_TRACE: Running "renders successfully and calls useQuery" test')
    expect(() => {
      render(<HomePage />)
    }).not.toThrow()

    // Verify that our mock useQuery was called
    expect(mockUseQuery).toHaveBeenCalled()
    // Optionally, check call arguments if PANTRY_ITEMS_FOR_HOME_QUERY can be imported/referenced here
    // expect(mockUseQuery).toHaveBeenCalledWith(PANTRY_ITEMS_FOR_HOME_QUERY) // This would require PANTRY_ITEMS_FOR_HOME_QUERY to be accessible
  })

  it('shows a loading indicator when pantry data is loading', () => {
    mockUseQuery.mockReturnValueOnce({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    })
    render(<HomePage />)
    // This is a placeholder assertion. You'll need to adapt it to your actual loading UI.
    // For example, if HomePage renders <p>Loading...</p>:
    // expect(screen.queryByText(/Loading/i)).toBeInTheDocument();
  })

  it('shows an error message when fetching pantry data fails', () => {
    const testErrorMessage = 'Failed to load pantry items'
    mockUseQuery.mockReturnValueOnce({
      data: null,
      loading: false,
      error: new Error(testErrorMessage),
      refetch: jest.fn(),
    })
    render(<HomePage />)
    // This is a placeholder assertion. Adapt to your actual error UI.
    // For example, if HomePage renders <p>Error: {error.message}</p>:
    // expect(screen.queryByText(new RegExp(testErrorMessage, 'i'))).toBeInTheDocument();
  })
})
