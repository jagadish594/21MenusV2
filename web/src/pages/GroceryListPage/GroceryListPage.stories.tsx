import type { Meta, StoryObj } from '@storybook/react'

import GroceryListPage from './GroceryListPage'

const meta: Meta<typeof GroceryListPage> = {
  component: GroceryListPage,
}

export default meta

type Story = StoryObj<typeof GroceryListPage>

export const Primary: Story = {}
