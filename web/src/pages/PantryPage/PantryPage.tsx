import { useState } from 'react'
import { Metadata } from '@redwoodjs/web'
import Modal from 'src/components/Modal/Modal'
import AddPantryItemForm from 'src/components/AddPantryItemForm'
import PantryItemsCell from 'src/components/PantryItemsCell'

const PantryPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <Metadata title="Pantry" description="Pantry page" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">What’s in your pantry?</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Add New Pantry Item
        </button>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Pantry Item">
        <AddPantryItemForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
      <PantryItemsCell />
    </>
  )
}

export default PantryPage
