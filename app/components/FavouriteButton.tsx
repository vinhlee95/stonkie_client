'use client'
import { Star } from 'lucide-react'
import { useFavourites } from './hooks/useFavourites'
import { Company } from '@/app/CompanyList'

interface FavouriteButtonProps {
  company: Company
  className?: string
}

export default function FavouriteButton({ company, className = '' }: FavouriteButtonProps) {
  const { isFavourite, toggleFavourite, isInitialized } = useFavourites()
  const isFav = isFavourite(company.ticker)

  if (!isInitialized) {
    return null
  }

  return (
    <button
      onClick={() => toggleFavourite(company)}
      className={`p-2 rounded-full transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
      title={isFav ? 'Remove from favourites' : 'Add to favourites'}
    >
      <Star
        className={`w-5 h-5 transition-colors duration-200 ${
          isFav
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-400 dark:text-gray-500 hover:text-yellow-400'
        }`}
      />
    </button>
  )
}
