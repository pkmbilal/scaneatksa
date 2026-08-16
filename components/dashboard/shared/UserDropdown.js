'use client'

// Ported from TailAdmin's components/header/UserDropdown.tsx, wired to the
// real signed-in user (profile/sign-out) instead of demo data. Reuses the
// project's existing Avatar component (same initials pattern as Navbar.js).
// Shared by all role dashboards — `homeHref`/`homeLabel` point back at the
// caller's own dashboard route.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ChevronDown } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { signOut } from '@/lib/auth/client'
import { Dropdown } from './ui/Dropdown'
import { DropdownItem } from './ui/DropdownItem'

export default function UserDropdown({
  user,
  profile,
  homeHref = '/dashboard',
  homeLabel = 'Dashboard',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const toggleDropdown = (e) => {
    e.stopPropagation()
    setIsOpen((prev) => !prev)
  }
  const closeDropdown = () => setIsOpen(false)

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const handleSignOut = async () => {
    closeDropdown()
    await signOut()
    router.push('/')
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400"
      >
        <Avatar className="mr-3 h-11 w-11">
          <AvatarFallback className="bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/15 dark:text-brand-400">
            {getInitials()}
          </AvatarFallback>
        </Avatar>

        <span className="hidden sm:block mr-1 font-medium text-theme-sm">
          {profile?.full_name || homeLabel}
        </span>

        <ChevronDown
          className={`size-4 stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {profile?.full_name || homeLabel}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {user?.email}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href={homeHref}
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              {homeLabel}
            </DropdownItem>
          </li>
        </ul>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <LogOut className="size-5 stroke-gray-500 group-hover:stroke-gray-700 dark:group-hover:stroke-gray-300" />
          Sign out
        </button>
      </Dropdown>
    </div>
  )
}
