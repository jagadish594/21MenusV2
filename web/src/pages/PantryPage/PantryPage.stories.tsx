import type { Meta, StoryObj } from '@storybook/react'

import PantryPage from './PantryPage'

const meta: Meta<typeof PantryPage> = {
  component: PantryPage,
}

export default meta

type Story = StoryObj<typeof PantryPage>

export const Primary: Story = {}
