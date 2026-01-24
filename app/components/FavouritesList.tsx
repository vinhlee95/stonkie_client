'use client'
import { useFavourites } from './hooks/useFavourites'
import CompanyList from '@/app/CompanyList'

function FavouritesSkeleton() {
  return (
    <div className="mb-6">
      <div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 flex items-center animate-pulse"
          >
            <div className="w-12 h-12 mr-4 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FavouritesList() {
  const { favourites, isInitialized } = useFavourites()

  // Show skeleton while loading to prevent layout shift
  if (!isInitialized) {
    return <FavouritesSkeleton />
  }

  // Hide completely if no favourites
  if (favourites.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold mb-6">Favourite Companies</h1>
      <CompanyList companies={favourites} />
    </div>
  )
}
