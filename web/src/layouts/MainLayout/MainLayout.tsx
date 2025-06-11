import { Link, routes, navigate } from '@redwoodjs/router'
import { Toaster } from '@redwoodjs/web/toast'

type MainLayoutProps = {
  children?: React.ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster toastOptions={{ className: 'rw-toast', duration: 6000 }} />
      <header className="bg-teal-600 text-white shadow-md">
        <nav className="container mx-auto flex items-center justify-between p-4">
          <button
            onClick={() => navigate(routes.home())}
            className="cursor-pointer border-none bg-transparent p-0 text-xl font-bold hover:text-teal-200"
          >
            21Menus
          </button>
          <ul className="flex space-x-4">
            <li>
              <button
                onClick={() => navigate(routes.home())}
                className="transition-colors hover:text-teal-200"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate(routes.planner())}
                className="transition-colors hover:text-teal-200"
              >
                Meal Planner
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate(routes.groceryList())}
                className="transition-colors hover:text-teal-200"
              >
                Grocery List
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate(routes.pantry())}
                className="transition-colors hover:text-teal-200"
              >
                Pantry
              </button>
            </li>
          </ul>
        </nav>
      </header>
      <main className="container mx-auto p-4">{children}</main>
      {/* You could add a footer here if needed */}
    </div>
  )
}

export default MainLayout
