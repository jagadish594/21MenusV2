import type { Meta, StoryObj } from '@storybook/react'

import PlannerPage from './PlannerPage'

const meta: Meta<typeof PlannerPage> = {
  component: PlannerPage,
}

export default meta

type Story = StoryObj<typeof PlannerPage>

export const Primary: Story = {}
