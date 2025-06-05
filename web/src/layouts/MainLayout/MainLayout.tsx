import { Link, routes } from '@redwoodjs/router'

type MainLayoutProps = {
  children?: React.ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-teal-600 text-white shadow-md">
        <nav className="container mx-auto flex items-center justify-between p-4">
          <Link
            to={routes.home()}
            className="text-xl font-bold hover:text-teal-200"
          >
            21Menus
          </Link>
          <ul className="flex space-x-4">
            <li>
              <Link
                to={routes.home()}
                className="transition-colors hover:text-teal-200"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to={routes.planner()}
                className="transition-colors hover:text-teal-200"
              >
                Meal Planner
              </Link>
            </li>
            <li>
              <Link
                to={routes.groceryList()}
                className="transition-colors hover:text-teal-200"
              >
                Grocery List
              </Link>
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
