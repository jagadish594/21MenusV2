import { useState } from 'react'

import type { CreatePantryItemInput } from 'types/graphql'

import {
  Form,
  TextField,
  TextAreaField,
  SelectField,
  Submit,
  Label,
  FieldError,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { QUERY as PANTRY_ITEMS_QUERY } from 'src/components/PantryItemsCell/PantryItemsCell' // Import the query for refetching
import { GET_GROCERY_LIST_ITEMS_QUERY } from 'src/pages/GroceryListPage/GroceryListPage' // Import the grocery list query
import { CATEGORIES, type Category } from 'src/lib/categories'

const CREATE_PANTRY_ITEM_MUTATION = gql`
  mutation CreatePantryItemMutation($input: CreatePantryItemInput!) {
    createPantryItem(input: $input) {
      id
      name
      category
      quantity
      notes
      createdAt
      updatedAt
    }
  }
`

interface AddPantryItemFormProps {
  onSuccess?: () => void
}

const AddPantryItemForm = ({ onSuccess }: AddPantryItemFormProps) => {
  const [createPantryItem, { loading, error }] = useMutation<
    { createPantryItem: { id: number } }, // More specific type for mutation result
    { input: CreatePantryItemInput }
  >(CREATE_PANTRY_ITEM_MUTATION, {
    onCompleted: (data) => {
      toast.success('Pantry item added!')
      if (onSuccess) {
        onSuccess()
      }
      // Optionally, reset form fields here if not using Redwood Form's built-in reset
    },
    onError: (error) => {
      toast.error(`Error adding item: ${error.message}`)
    },
    refetchQueries: [
      { query: PANTRY_ITEMS_QUERY },
      { query: GET_GROCERY_LIST_ITEMS_QUERY },
    ],
  })

  const [category, setCategory] = useState<Category>(CATEGORIES[0])

  const onSubmit = (data: {
    name: string
    quantity?: string
    notes?: string
  }) => {
    // Combine form data with the controlled category state
    const input: CreatePantryItemInput = {
      name: data.name,
      category: category,
      quantity: data.quantity || null, // Ensure optional fields are null if empty
      notes: data.notes || null,
    }
    createPantryItem({ variables: { input } })
  }

  return (
    <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold text-gray-700">
        Add New Pantry Item
      </h2>
      <Form onSubmit={onSubmit} className="space-y-4" error={error}>
        <div>
          <Label
            name="name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Item Name
          </Label>
          <TextField
            name="name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            validation={{ required: true }}
          />
          <FieldError name="name" className="mt-1 text-xs text-red-600" />
        </div>

        <div>
          <Label
            name="category"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Category
          </Label>
          <SelectField
            name="category"
            value={category} // Controlled component
            onChange={(e) => setCategory(e.target.value as Category)}
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </SelectField>
          {/* FieldError for category is not strictly needed as it's a controlled select with a default */}
        </div>

        <div>
          <Label
            name="quantity"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Quantity (e.g., 1, 2 lbs, 500g)
          </Label>
          <TextField
            name="quantity"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
          />
          <FieldError name="quantity" className="mt-1 text-xs text-red-600" />
        </div>

        <div>
          <Label
            name="notes"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Notes
          </Label>
          <TextAreaField
            name="notes"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            rows={3}
          />
          <FieldError name="notes" className="mt-1 text-xs text-red-600" />
        </div>

        <Submit
          disabled={loading}
          className="w-full rounded-md bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:w-auto"
        >
          {loading ? 'Adding...' : 'Add Item'}
        </Submit>
        {/* Display a general form error if the mutation error is not field-specific */}
        {error &&
          !error.graphQLErrors?.some(
            (err) => err.extensions?.code === 'BAD_USER_INPUT'
          ) && (
            <p className="mt-2 text-xs text-red-600">Error: {error.message}</p>
          )}
      </Form>
    </div>
  )
}

export default AddPantryItemForm
