import { useState, useEffect } from 'react'

import type {
  PantryItem,
  UpdatePantryItemInput,
  PantryItemStatus,
} from 'types/graphql'

import {
  Form,
  Label,
  TextField,
  SelectField,
  TextAreaField,
  Submit,
  FieldError,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { CATEGORIES_WITH_IDS } from 'src/lib/categories'

const PANTRY_ITEM_STATUSES: PantryItemStatus[] = ['InStock', 'OutOfStock']

const UPDATE_PANTRY_ITEM_MUTATION = gql`
  mutation UpdatePantryItemMutation($id: Int!, $input: UpdatePantryItemInput!) {
    updatePantryItem(id: $id, input: $input) {
      id
      name
      category {
        id
        name
      }
      quantity
      notes
      status
      createdAt
      updatedAt
    }
  }
`

interface EditPantryItemFormProps {
  pantryItem: PantryItem
  onSave: () => void
  onCancel: () => void
}

const EditPantryItemForm = ({
  pantryItem,
  onSave,
  onCancel,
}: EditPantryItemFormProps) => {
  const [updatePantryItem, { loading, error }] = useMutation(
    UPDATE_PANTRY_ITEM_MUTATION,
    {
      onCompleted: () => {
        toast.success('Pantry item updated')
        onSave()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  // const onSubmit = (data: UpdatePantryItemInput) => {
  //   // Ensure quantity is a number if provided, otherwise Prisma might complain
  //   const inputData: UpdatePantryItemInput = {
  //     ...data,
  //     quantity: (data.quantity === null || data.quantity === undefined) ? null : String(data.quantity),
  //     status: data.status as PantryItemStatus, // Ensure status is correctly typed
  //   }
  //   updatePantryItem({ variables: { id: pantryItem.id, input: inputData } })
  // }
  const onSubmit = (data: {
    name: string
    categoryId: string
    quantity: string
    status: PantryItemStatus
    notes: string
  }) => {
    const input: UpdatePantryItemInput = {
      name: data.name,
      notes: data.notes,
      status: data.status,
      quantity: data.quantity ? String(data.quantity) : null,
      categoryId: data.categoryId ? parseInt(data.categoryId, 10) : null,
    }

    // If parsing results in NaN (e.g., empty string for categoryId), set to null
    if (isNaN(input.categoryId)) {
      input.categoryId = null
    }

    updatePantryItem({
      variables: { id: pantryItem.id, input },
    })
  }

  return (
    <div className="rw-form-wrapper rounded-lg bg-gray-100 p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Edit Pantry Item</h2>
      <Form onSubmit={onSubmit} error={error} className="space-y-4">
        <div>
          <Label
            name="name"
            className="rw-label"
            errorClassName="rw-label rw-label-error"
          >
            Name
          </Label>
          <TextField
            name="name"
            defaultValue={pantryItem.name}
            className="rw-input"
            errorClassName="rw-input rw-input-error"
            required={true}
          />
          <FieldError name="name" className="rw-field-error" />
        </div>

        <div>
          <Label
            name="categoryId"
            className="rw-label"
            errorClassName="rw-label rw-label-error"
          >
            Category
          </Label>
          <SelectField
            name="categoryId"
            defaultValue={pantryItem.category?.id}
            className="rw-input"
            errorClassName="rw-input rw-input-error"
          >
            <option value="">Select a category</option>
            {CATEGORIES_WITH_IDS.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </SelectField>
          <FieldError name="categoryId" className="rw-field-error" />
        </div>

        <div>
          <Label
            name="quantity"
            className="rw-label"
            errorClassName="rw-label rw-label-error"
          >
            Quantity (e.g., 1, 2.5, 500g)
          </Label>
          <TextField
            name="quantity"
            defaultValue={pantryItem.quantity ?? ''}
            className="rw-input"
            errorClassName="rw-input rw-input-error"
          />
          <FieldError name="quantity" className="rw-field-error" />
        </div>

        <div>
          <Label
            name="status"
            className="rw-label"
            errorClassName="rw-label rw-label-error"
          >
            Status
          </Label>
          <SelectField
            name="status"
            defaultValue={pantryItem.status}
            className="rw-input"
            errorClassName="rw-input rw-input-error"
            required={true}
          >
            {PANTRY_ITEM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectField>
          <FieldError name="status" className="rw-field-error" />
        </div>

        <div>
          <Label
            name="notes"
            className="rw-label"
            errorClassName="rw-label rw-label-error"
          >
            Notes
          </Label>
          <TextAreaField
            name="notes"
            defaultValue={pantryItem.notes ?? ''}
            className="rw-input"
            errorClassName="rw-input rw-input-error"
            rows={3}
          />
          <FieldError name="notes" className="rw-field-error" />
        </div>

        <div className="rw-button-group flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="rw-button rw-button-gray"
            disabled={loading}
          >
            Cancel
          </button>
          <Submit className="rw-button rw-button-blue" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Submit>
        </div>
      </Form>
    </div>
  )
}

export default EditPantryItemForm
