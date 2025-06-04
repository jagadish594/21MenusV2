import { render } from '@redwoodjs/testing/web'

import MealSearchBar from './MealSearchBar'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('MealSearchBar', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<MealSearchBar />)
    }).not.toThrow()
  })
})
