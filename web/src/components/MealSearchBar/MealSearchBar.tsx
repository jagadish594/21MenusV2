
import React, { useState, useEffect, useRef } from 'react'

// Sample meal data - replace with API call later
const allMeals: string[] = [
  'Dosa',
  'Masala Dosa',
  'Idli',
  'Sambar',
  'Vada',
  'Chicken Biryani',
  'Mutton Curry',
  'Fish Fry',
  'Paneer Tikka',
  'Dal Makhani',
  'Aloo Gobi',
  'Vegetable Korma',
  'Chicken Salad',
  'Caesar Salad',
  'Spaghetti Carbonara',
  'Lasagna',
  'Sushi Platter',
  'Ramen',
]

interface MealSearchBarProps {
  onMealSelect?: (mealName: string) => void;
  initialQuery?: string; // New prop
}

const MealSearchBar: React.FC<MealSearchBarProps> = ({ onMealSelect, initialQuery }) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery || '')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchTerm) {
      const filteredSuggestions = allMeals.filter((meal) =>
        meal.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setSuggestions(filteredSuggestions)
      setShowSuggestions(filteredSuggestions.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchTerm])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    setShowSuggestions(false)
    // Optionally, trigger search submission here
    console.log('Selected:', suggestion);
    if (onMealSelect) {
      onMealSelect(suggestion);
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowSuggestions(false)
    console.log('Searching for:', searchTerm);
    if (searchTerm.trim() !== '' && onMealSelect) {
      onMealSelect(searchTerm.trim());
    }
    // Actual search/data fetching logic will go here
  }

  return (
    <div className="relative" ref={searchBarRef}>
      <form onSubmit={handleSubmit} className="mb-1">
        <input
          type="text"
          placeholder="Search for a meal (e.g., Dosa, Chicken Salad)"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(searchTerm.length > 0 && suggestions.length > 0)}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-autocomplete="list"
          aria-controls="autocomplete-suggestions"
        />
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <ul
          id="autocomplete-suggestions"
          className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="p-3 hover:bg-gray-100 cursor-pointer"
              role="option"
              aria-selected={false} // Can be enhanced with keyboard navigation
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MealSearchBar
