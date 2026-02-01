'use client'
import { Star } from 'lucide-react'
import { useFavourites } from './hooks/useFavourites'
import { ETFListItem } from '@/app/components/ETFList'

interface ETFFavouriteButtonProps {
  etf: ETFListItem
  className?: string
}

export default function ETFFavouriteButton({ etf, className = '' }: ETFFavouriteButtonProps) {
  const { isFavourite, toggleFavourite, isInitialized } =
    useFavourites<ETFListItem>('stonkie_favourites_etf')
  const isFav = isFavourite(etf.ticker)

  if (!isInitialized) {
    return null
  }

  return (
    <button
      onClick={() => toggleFavourite(etf)}
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
