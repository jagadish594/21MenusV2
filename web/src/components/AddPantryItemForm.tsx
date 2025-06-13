import { useState, useEffect } from 'react'

import type {
  CreatePantryItemInput,
  CategoriesQuery,
  CategoriesQueryVariables,
  CreateCategoryMutation,
  CreateCategoryMutationVariables,
} from 'types/graphql'

import {
  Form,
  TextField,
  TextAreaField,
  SelectField,
  Submit,
  Label,
  FieldError,
} from '@redwoodjs/forms'
import { useMutation, useQuery, type TypedDocumentNode } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { QUERY as PANTRY_ITEMS_QUERY } from 'src/components/PantryItemsCell/PantryItemsCell'
import { GET_GROCERY_LIST_ITEMS_QUERY } from 'src/pages/GroceryListPage/GroceryListPage'

const GET_CATEGORIES_QUERY: TypedDocumentNode<
  CategoriesQuery,
  CategoriesQueryVariables
> = gql`
  query CategoriesQuery {
    categories {
      id
      name
    }
  }
`

const CREATE_CATEGORY_MUTATION: TypedDocumentNode<
  CreateCategoryMutation,
  CreateCategoryMutationVariables
> = gql`
  mutation CreateCategoryMutation($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
    }
  }
`

const CREATE_PANTRY_ITEM_MUTATION = gql`
  mutation CreatePantryItemMutation($input: CreatePantryItemInput!) {
    createPantryItem(input: $input) {
      id # Minimal needed for cache updates, full item refetched by PANTRY_ITEMS_QUERY
    }
  }
`

interface AddPantryItemFormProps {
  onSuccess?: () => void
}

const AddPantryItemForm = ({ onSuccess }: AddPantryItemFormProps) => {
  const { data: categoriesData, loading: categoriesLoading, refetch: refetchCategories } = useQuery(GET_CATEGORIES_QUERY)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
    undefined
  )
  const [newCategoryName, setNewCategoryName] = useState('')

  useEffect(() => {
    // Pre-select the first category if available and none is selected
    if (categoriesData?.categories?.length && selectedCategoryId === undefined) {
      setSelectedCategoryId(categoriesData.categories[0].id)
    }
  }, [categoriesData, selectedCategoryId])

  const [
    createPantryItem,
    { loading: createItemLoading, error: createItemError },
  ] = useMutation<
    { createPantryItem: { id: number } },
    { input: CreatePantryItemInput }
  >(CREATE_PANTRY_ITEM_MUTATION, {
    onCompleted: () => {
      toast.success('Pantry item added!')
      if (onSuccess) {
        onSuccess()
      }
      // Form fields are typically reset by Redwood Form's onSubmit handling or manually if needed
    },
    onError: (error) => {
      toast.error(`Error adding item: ${error.message}`)
    },
    refetchQueries: [
      { query: PANTRY_ITEMS_QUERY }, // Refetches pantry items on current page
      { query: GET_GROCERY_LIST_ITEMS_QUERY }, // Refetches grocery list items
    ],
    // Optimistic updates or direct cache manipulation could be added here for smoother UX
  })

  const [
    createCategory,
    { loading: createCategoryLoading, error: createCategoryError },
  ] = useMutation(CREATE_CATEGORY_MUTATION, {
    onCompleted: (data) => {
      toast.success(`Category "${data.createCategory.name}" created!`)
      refetchCategories() // Refetch categories to update the dropdown
      setSelectedCategoryId(data.createCategory.id) // Auto-select the new category
      setNewCategoryName('') // Clear the input field
    },
    onError: (error) => {
      // The backend throws UserInputError for duplicates, which is caught here.
      toast.error(`Error creating category: ${error.message}`)
    },
  })

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name.')
      return
    }
    createCategory({ variables: { input: { name: newCategoryName.trim() } } })
  }

  const onSubmitPantryItem = (data: {
    name: string
    quantity?: string
    notes?: string
  }) => {
    if (selectedCategoryId === undefined) {
      toast.error('Please select a category.')
      return
    }
    const input: CreatePantryItemInput = {
      name: data.name,
      categoryId: selectedCategoryId,
      quantity: data.quantity || null,
      notes: data.notes || null,
    }
    createPantryItem({ variables: { input } })
  }

  return (
    <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold text-gray-700">
        Add New Pantry Item
      </h2>
      <Form onSubmit={onSubmitPantryItem} className="space-y-4" error={createItemError}>
        <div>
          <Label
            name="name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Item Name
          </Label>
          <TextField
            name="name"
            className="rw-input mt-1"
            validation={{ required: true }}
          />
          <FieldError name="name" className="rw-field-error mt-1" />
        </div>

        <div>
          <Label
            name="category"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Category
          </Label>
          <div className="flex items-center space-x-2">
            <SelectField
              name="categoryId"
              value={selectedCategoryId?.toString() ?? ''}
              onChange={(e) => setSelectedCategoryId(parseInt(e.target.value))}
              className="rw-input mt-1 flex-grow"
              disabled={categoriesLoading}
              validation={{ valueAsNumber: true, required: true }}
            >
              {categoriesLoading && <option>Loading categories...</option>}
              {categoriesData?.categories?.map((cat) => (
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </option>
              ))}
            </SelectField>
          </div>
          <FieldError name="categoryId" className="rw-field-error mt-1" />
        </div>

        <div className="mt-2 space-y-2 rounded-md border border-gray-200 p-3">
          <Label
            name="newCategoryName"
            className="mb-1 block text-sm font-medium text-gray-500"
          >
            Or Add New Category
          </Label>
          <div className="flex items-center space-x-2">
            <TextField
              name="newCategoryName"
              placeholder="Enter new category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="rw-input mt-1 flex-grow"
              disabled={createCategoryLoading}
            />
            <button
              type="button" // Important to prevent form submission
              onClick={handleAddNewCategory}
              disabled={createCategoryLoading || !newCategoryName.trim()}
              className="rw-button rw-button-small rw-button-green mt-1 whitespace-nowrap"
            >
              {createCategoryLoading ? 'Adding...' : 'Add Category'}
            </button>
          </div>
          {createCategoryError && (
            <p className="rw-field-error mt-1">
              {createCategoryError.message}
            </p>
          )}
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
            className="rw-input mt-1"
          />
          <FieldError name="quantity" className="rw-field-error mt-1" />
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
            className="rw-input mt-1"
            rows={3}
          />
          <FieldError name="notes" className="rw-field-error mt-1" />
        </div>

        <Submit
          disabled={createItemLoading || createCategoryLoading}
          className="rw-button rw-button-blue w-full sm:w-auto"
        >
          {createItemLoading ? 'Adding Item...' : 'Add Pantry Item'}
        </Submit>
        {createItemError &&
          !createItemError.graphQLErrors?.some(
            (err) => err.extensions?.code === 'BAD_USER_INPUT'
          ) && (
            <p className="rw-field-error mt-2">Error: {createItemError.message}</p>
          )}
      </Form>
    </div>
  )
}

export default AddPantryItemForm
