'use client'
import { useFavourites } from './hooks/useFavourites'
import CompanyList from '@/app/CompanyList'

export default function FavouritesList() {
  const { favourites, isInitialized } = useFavourites()

  if (!isInitialized || favourites.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold mb-6">Favourite Companies</h1>
      <CompanyList companies={favourites} />
    </div>
  )
}
