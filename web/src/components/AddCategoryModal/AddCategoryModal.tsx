import { useState, useEffect } from 'react'

import type {
  CreateCategoryInput,
  CreateCategoryMutation,
  CreateCategoryMutationVariables,
  // We need CategoriesQuery for refetching, but not its variables directly in this component
  // However, the refetchQueries array expects the query document itself.
} from 'types/graphql'

import { Form, TextField, Submit, Label, FieldError } from '@redwoodjs/forms'
import { useMutation, type TypedDocumentNode } from '@redwoodjs/web'
import gql from 'graphql-tag'
import { toast } from '@redwoodjs/web/toast'

import Modal from 'src/components/Modal/Modal' // Assuming Modal.tsx is in src/components/Modal/

// Query to refetch categories after a new one is added
// This should be the same query used by other components displaying categories
const GET_CATEGORIES_QUERY: TypedDocumentNode<any, any> = gql`
  query CategoriesQuery_AddCategoryModal {
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
  mutation CreateCategoryMutation_AddCategoryModal($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
    }
  }
`

interface AddCategoryModalProps {
  isOpen: boolean
  onClose: () => void
}

const AddCategoryModal = ({ isOpen, onClose }: AddCategoryModalProps) => {
  const [newCategoryName, setNewCategoryName] = useState('')

  const [createCategory, { loading, error }] = useMutation(
    CREATE_CATEGORY_MUTATION,
    {
      onCompleted: (data) => {
        toast.success(`Category "${data.createCategory.name}" created!`)
        setNewCategoryName('') // Clear input
        onClose() // Close modal
      },
      onError: (error) => {
        toast.error(`Error creating category: ${error.message}`)
      },
      refetchQueries: [{ query: GET_CATEGORIES_QUERY }],
    }
  )

  const onSubmit = () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name.')
      return
    }
    createCategory({ variables: { input: { name: newCategoryName.trim() } } })
  }

  // Reset form when modal closes to ensure clean state
  useEffect(() => {
    if (!isOpen) {
      setNewCategoryName('')
      // Potentially clear errors as well if the form has error display states tied to component state
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Category">
      <Form onSubmit={onSubmit} error={error} className="space-y-4">
        <div>
          <Label
            name="newCategoryName"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Category Name
          </Label>
          <TextField
            name="newCategoryName"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="rw-input mt-1"
            validation={{ required: true }}
            disabled={loading}
          />
          <FieldError name="newCategoryName" className="rw-field-error mt-1" />
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rw-button rw-button-gray"
          >
            Cancel
          </button>
          <Submit disabled={loading} className="rw-button rw-button-green">
            {loading ? 'Saving...' : 'Save Category'}
          </Submit>
        </div>
        {error && (
          <p className="rw-field-error mt-2 text-center">{error.message}</p>
        )}
      </Form>
    </Modal>
  )
}

export default AddCategoryModal
