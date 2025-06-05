import { render } from '@redwoodjs/testing/web'

import GroceryListPage from './GroceryListPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('GroceryListPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<GroceryListPage />)
    }).not.toThrow()
  })
})
