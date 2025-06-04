import React, { useState, useEffect } from 'react' // Added useState, useEffect here

import { startOfWeek, addWeeks, subWeeks, format, addDays } from 'date-fns'

import { Link, routes, useLocation } from '@redwoodjs/router' // Added useLocation
import { MetaTags } from '@redwoodjs/web'

import AddMealModal from 'src/components/MealPlanner/AddMealModal' // <-- Import AddMealModal
import type {
  WeeklyPlan,
  MealType,
  PlannedMeal,
} from 'src/components/MealPlanner/MealPlannerTypes'
import WeeklyCalendarView from 'src/components/MealPlanner/WeeklyCalendarView'

const PlannerPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  // Get today's date and a couple of other dates for sample data
  const today = new Date()
  const tomorrow = addDays(today, 1)
  const dayAfterTomorrow = addDays(today, 2)

  const initialWeeklyPlan: WeeklyPlan = {
    [format(today, 'yyyy-MM-dd')]: {
      breakfast: [
        {
          id: '1',
          date: format(today, 'yyyy-MM-dd'),
          mealType: 'breakfast',
          mealName: 'Oatmeal with Berries',
        },
      ],
      lunch: [
        {
          id: '2',
          date: format(today, 'yyyy-MM-dd'),
          mealType: 'lunch',
          mealName: 'Chicken Salad Sandwich',
        },
      ],
    },
    [format(tomorrow, 'yyyy-MM-dd')]: {
      dinner: [
        {
          id: '3',
          date: format(tomorrow, 'yyyy-MM-dd'),
          mealType: 'dinner',
          mealName: 'Spaghetti Carbonara',
        },
      ],
    },
    [format(dayAfterTomorrow, 'yyyy-MM-dd')]: {
      breakfast: [
        {
          id: '4',
          date: format(dayAfterTomorrow, 'yyyy-MM-dd'),
          mealType: 'breakfast',
          mealName: 'Scrambled Eggs',
        },
      ],
      snack: [
        {
          id: '5',
          date: format(dayAfterTomorrow, 'yyyy-MM-dd'),
          mealType: 'snack',
          mealName: 'Apple Slices',
        },
      ],
    },
  }

  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(initialWeeklyPlan)

  // State for AddMealModal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTargetDate, setModalTargetDate] = useState<string | null>(null)
  const [modalTargetMealType, setModalTargetMealType] =
    useState<MealType | null>(null)
  const [pendingMealNameFromUrl, setPendingMealNameFromUrl] = useState<
    string | null
  >(null)

  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const mealNameToAdd = params.get('addMeal')
    if (mealNameToAdd && !isModalOpen) {
      // Only set if not already in a modal interaction from URL
      setPendingMealNameFromUrl(mealNameToAdd)
      // Optional: Clean the URL query param after reading it, to prevent re-triggering on refresh if not desired
      // This ensures if the user navigates away and back, or refreshes, it doesn't persist the prompt unless the URL still has it.
      // window.history.replaceState({}, document.title, routes.planner());
    }
  }, [location.search, isModalOpen])

  const currentWeekStartDate = startOfWeek(currentDate, { weekStartsOn: 1 }) // Assuming week starts on Monday

  const handlePreviousWeek = () => {
    setCurrentDate((prevDate) => subWeeks(prevDate, 1))
  }

  const handleNextWeek = () => {
    setCurrentDate((prevDate) => addWeeks(prevDate, 1))
  }

  const handlePrint = () => {
    window.print()
  }

  const getMealTimesForIcs = (
    mealType: MealType
  ): { startHour: number; endHour: number } => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return { startHour: 8, endHour: 9 }
      case 'lunch':
        return { startHour: 12, endHour: 13 }
      case 'dinner':
        return { startHour: 18, endHour: 19 }
      case 'snack':
        return { startHour: 15, endHour: 16 }
      default:
        return { startHour: 10, endHour: 11 } // Default for other/unspecified meal types
    }
  }

  const handleExportToIcs = () => {
    const icsEvents = []
    const prodId = '-//MyMealPlanner//WebApp//EN'
    const calScale = 'GREGORIAN'
    const method = 'PUBLISH'

    Object.keys(weeklyPlan).forEach((dateString) => {
      const dayPlan = weeklyPlan[dateString]
      const icsDate = dateString.replace(/-/g, '') // YYYYMMDD

      Object.keys(dayPlan).forEach((mealTypeKey) => {
        const mealType = mealTypeKey as MealType
        const meals = dayPlan[mealType]
        if (meals) {
          meals.forEach((meal) => {
            const mealTimes = getMealTimesForIcs(meal.mealType)
            const dtStamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'")
            const uid = `${meal.id}-${icsDate}@mymealplanner.com`

            const startTime = `${String(mealTimes.startHour).padStart(2, '0')}0000`
            const endTime = `${String(mealTimes.endHour).padStart(2, '0')}0000`
            const dtStart = `${icsDate}T${startTime}`
            const dtEnd = `${icsDate}T${endTime}`

            const event = [
              'BEGIN:VEVENT',
              `DTSTAMP:${dtStamp}`,
              `UID:${uid}`,
              `DTSTART:${dtStart}`,
              `DTEND:${dtEnd}`,
              `SUMMARY:${meal.mealName}`,
              `DESCRIPTION:Meal Type: ${meal.mealType}`,
              'END:VEVENT',
            ].join('\r\n')
            icsEvents.push(event)
          })
        }
      })
    })

    const icsCalendar = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:${prodId}`,
      `CALSCALE:${calScale}`,
      `METHOD:${method}`,
      ...icsEvents,
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsCalendar], {
      type: 'text/calendar;charset=utf-8;',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'meal-plan.ics')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href) // Clean up
  }

  const handleDeleteMeal = (
    mealId: string,
    date: string,
    mealType: MealType
  ) => {
    setWeeklyPlan((prevPlan) => {
      const newPlan = { ...prevPlan }
      const dayPlan = { ...(newPlan[date] || {}) }

      // Filter out the meal to be deleted
      const updatedMealTypePlan = (dayPlan[mealType] || []).filter(
        (meal) => meal.id !== mealId
      )

      if (updatedMealTypePlan.length > 0) {
        // If meals of this type remain, update the meal type array
        dayPlan[mealType] = updatedMealTypePlan
      } else {
        // If no meals of this type remain, delete the meal type array for that day
        delete dayPlan[mealType]
      }

      // If the day plan is now empty (no meal types left for that day), delete the day from the plan
      if (Object.keys(dayPlan).length === 0) {
        delete newPlan[date]
      } else {
        newPlan[date] = dayPlan
      }
      return newPlan
    })
  }

  const handleAddMeal = (date: string, mealType: MealType) => {
    setModalTargetDate(date)
    setModalTargetMealType(mealType)
    // If there's a meal pending from URL, pass it to the modal as initialMealName
    // Otherwise, initialMealName will be null, and modal behaves as normal search
    // The 'initialMealNameToOpenModalWith' prop in the modal will receive this.
    // We use pendingMealNameFromUrl directly here for the modal's initial name.
    setIsModalOpen(true)
    // No need to set 'initialMealNameToOpenModalWith' state here, it's passed directly as a prop if pendingMealNameFromUrl exists.
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setModalTargetDate(null)
    setModalTargetMealType(null)
    // If the modal was closed and it was an attempt to place a meal from URL, clear the pending state.
    if (pendingMealNameFromUrl) {
      setPendingMealNameFromUrl(null)
    }
  }

  const handleConfirmAddMealToPlan = (
    mealName: string,
    date: string,
    mealType: MealType
  ) => {
    const newMeal: PlannedMeal = {
      id: Date.now().toString(), // Simple unique ID for now
      date: date,
      mealType: mealType,
      mealName: mealName,
      // We could add more details here if fetched, e.g., ingredients, nutrients
    }

    setWeeklyPlan((prevPlan) => {
      const dayPlan = { ...(prevPlan[date] || {}) } // Ensure we're working with a copy
      const mealTypePlan = [...(dayPlan[mealType] || [])] // Ensure we're working with a copy
      return {
        ...prevPlan,
        [date]: {
          ...dayPlan,
          [mealType]: [...mealTypePlan, newMeal],
        },
      }
    })
    setPendingMealNameFromUrl(null) // Clear pending meal from URL after successful addition
    handleCloseModal() // Close modal after adding
  }

  return (
    <>
      <MetaTags title="Meal Planner" description="Weekly Meal Planner page" />

      <div className="mb-4">
        <Link
          to={routes.home()}
          className="text-blue-500 hover:text-blue-700 hover:underline"
        >
          &larr; Back to Home
        </Link>
      </div>

      <div className="container mx-auto p-4">
        <MetaTags title="Meal Planner" description="Plan your weekly meals" />

        <h1 className="my-6 text-center text-3xl font-bold text-gray-800">
          Weekly Meal Planner
        </h1>

        {/* Prompt for adding meal from URL */}
        {pendingMealNameFromUrl && !isModalOpen && (
          <div className="mb-4 rounded-md border border-blue-300 bg-blue-100 p-3 text-center text-blue-700">
            <p>
              Adding meal: <strong>{pendingMealNameFromUrl}</strong>. Click on
              any "+ Add Meal" button in a calendar slot to place it.
            </p>
          </div>
        )}

        {/* Week Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handlePreviousWeek}
            className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            &larr; Previous Week
          </button>
          <button
            onClick={handleNextWeek}
            className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Next Week &rarr;
          </button>
        </div>

        {/* Action Buttons: Print and Download */}
        <div className="my-6 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handlePrint}
            className="rounded bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
          >
            Print Plan
          </button>
          <button
            onClick={handleExportToIcs}
            className="rounded bg-teal-500 px-4 py-2 text-white transition-colors hover:bg-teal-600"
          >
            Export to Calendar (.ics)
          </button>
        </div>

        <WeeklyCalendarView
          currentWeekStartDate={currentWeekStartDate}
          weeklyPlan={weeklyPlan} // Pass the plan
          onAddMeal={handleAddMeal} // Pass the handler
          onDeleteMeal={handleDeleteMeal} // Pass the delete handler
        />

        {/* Add Meal Modal */}
        <AddMealModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onMealSelected={handleConfirmAddMealToPlan}
          targetDate={modalTargetDate}
          targetMealType={modalTargetMealType}
          initialMealName={pendingMealNameFromUrl} // Pass the pending name here
        />

        {/* Debugging: Display current week and plan */}
        {/* <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Debug Info:</h3>
          <p>Current Week Starts: {format(currentWeekStartDate, 'yyyy-MM-dd')}</p>
          <pre>{JSON.stringify(weeklyPlan, null, 2)}</pre>
        </div> */}
      </div>
    </>
  )
}

export default PlannerPage
