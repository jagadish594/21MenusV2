import { useState } from 'react'

import { Metadata } from '@redwoodjs/web'

import AddPantryItemForm from 'src/components/AddPantryItemForm'
import AddCategoryModal from 'src/components/AddCategoryModal/AddCategoryModal'
import Modal from 'src/components/Modal/Modal'
import PantryItemsCell from 'src/components/PantryItemsCell'

const PantryPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false)
  return (
    <>
      <Metadata title="Pantry" description="Pantry page" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          What’s in your pantry?
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsAddCategoryModalOpen(true)}
            className="rounded bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
          >
            Add New Category
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Add New Pantry Item
          </button>
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Pantry Item"
      >
        <AddPantryItemForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
      <PantryItemsCell />

      {/* Modal for adding a new category */}
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
      />
    </>
  )
}

export default PantryPage
