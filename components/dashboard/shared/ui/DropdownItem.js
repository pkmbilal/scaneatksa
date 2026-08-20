'use client'

// Ported from TailAdmin's components/ui/dropdown/DropdownItem.tsx.

import Link from 'next/link'

export function DropdownItem({
  tag = 'button',
  href,
  onClick,
  onItemClick,
  baseClassName = 'block w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900',
  className = '',
  children,
}) {
  const combinedClasses = `${baseClassName} ${className}`.trim()

  const handleClick = (event) => {
    if (tag === 'button') event.preventDefault()
    if (onClick) onClick()
    if (onItemClick) onItemClick()
  }

  if (tag === 'a' && href) {
    return (
      <Link href={href} className={combinedClasses} onClick={handleClick}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" onClick={handleClick} className={combinedClasses}>
      {children}
    </button>
  )
}
