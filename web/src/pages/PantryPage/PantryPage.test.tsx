import { render } from '@redwoodjs/testing/web'

import PantryPage from './PantryPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('PantryPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<PantryPage />)
    }).not.toThrow()
  })
})
