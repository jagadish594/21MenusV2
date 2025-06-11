import { useState } from 'react'

import { Metadata } from '@redwoodjs/web'

import AddPantryItemForm from 'src/components/AddPantryItemForm'
import Modal from 'src/components/Modal/Modal'
import PantryItemsCell from 'src/components/PantryItemsCell'

const PantryPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  return (
    <>
      <Metadata title="Pantry" description="Pantry page" />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          What’s in your pantry?
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
        >
          Add New Pantry Item
        </button>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Pantry Item"
      >
        <AddPantryItemForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
      <PantryItemsCell />
    </>
  )
}

export default PantryPage
