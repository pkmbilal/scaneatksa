'use client'

import Link from 'next/link'
import { Store } from 'lucide-react'

export default function RequestOwnerCard() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800 md:flex-row md:items-center md:justify-between md:gap-3">
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">Quick action</p>
        <p className="font-semibold text-gray-800 dark:text-white/90">Own a Restaurant?</p>
        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
          Create your digital menu and manage orders easily.
        </p>
      </div>

      <Link
        href="/dashboard/customer/request-restaurant"
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 md:w-fit"
      >
        <Store className="h-4 w-4" />
        Request Owner
      </Link>
    </div>
  )
}
