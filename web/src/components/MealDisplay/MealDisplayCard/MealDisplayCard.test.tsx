import { render } from '@redwoodjs/testing/web'

import MealDisplayCard from './MealDisplayCard'

//   Improve this test with help from the Redwood Testing Doc:
//    https://redwoodjs.com/docs/testing#testing-components

describe('MealDisplayCard', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<MealDisplayCard />)
    }).not.toThrow()
  })
})
