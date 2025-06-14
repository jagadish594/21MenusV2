import { routes, navigate } from '@redwoodjs/router'
import { Toaster } from '@redwoodjs/web/toast'

import { useAuth } from 'src/auth'

type MainLayoutProps = {
  children?: React.ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isAuthenticated, currentUser, logOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster toastOptions={{ className: 'rw-toast', duration: 6000 }} />
      <header className="bg-teal-600 text-white shadow-md">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => navigate(routes.home())}
              className="cursor-pointer border-none bg-transparent p-0 text-xl font-bold hover:text-teal-200"
            >
              Feast Daily
            </button>
            <nav>
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
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm">
                  Logged in as {currentUser?.email}
                </span>
                <button
                  type="button"
                  onClick={logOut}
                  className="rounded bg-teal-700 px-3 py-1 text-sm transition-colors hover:bg-teal-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate(routes.login())}
                  className="transition-colors hover:text-teal-200"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate(routes.signup())}
                  className="transition-colors hover:text-teal-200"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4">{children}</main>
      {/* You could add a footer here if needed */}
    </div>
  )
}

export default MainLayout
