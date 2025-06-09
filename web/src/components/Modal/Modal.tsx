/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useEffect } from 'react' // Import useEffect

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Effect for handling Escape key to close the modal
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleGlobalKeyDown)
      // Optional: Focus the dialog or first focusable element within it upon opening.
      // For example, you could get a ref to the dialog div and call .focus().
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isOpen, onClose]) // Re-run effect if isOpen or onClose changes

  if (!isOpen) {
    return null
  }

  // Handles keyboard events (Enter/Space) for the overlay acting as a button
  const handleOverlayKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      event.currentTarget === event.target &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close on overlay click
      onKeyDown={handleOverlayKeyDown} // For Enter/Space on overlay "button"
      role="button"
      tabIndex={0}
      aria-label="Close modal by clicking backdrop" // Changed label for clarity
    >
      <div
        className="animate-modalShow relative w-full max-w-lg transform rounded-lg bg-white p-6 shadow-xl"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
        // onKeyDown is removed from here; Escape is handled by the useEffect hook
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1} // Allows programmatic focus (e.g., for screen readers or managing focus on open)
      >
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          {title && (
            <h3
              id="modal-title"
              className="text-xl font-semibold text-gray-800"
            >
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Close" // Specific label for the 'X' button
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export default Modal
