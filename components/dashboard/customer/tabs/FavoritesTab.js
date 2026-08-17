'use client'

// Favorites tab content for the customer dashboard's sidebar+tabs layout.
// Reuses FavoritesCard.js unchanged.

import FavoritesCard from '@/components/dashboard/customer/FavoritesCard'

export default function FavoritesTab({ favorites, onRemove }) {
  return <FavoritesCard favorites={favorites} onRemove={onRemove} />
}
