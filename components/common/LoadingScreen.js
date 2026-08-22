'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const FOOD_ICONS = [
  { src: '/loading/hamburger.png', alt: 'Hamburger' },
  { src: '/loading/pizza.png', alt: 'Pizza' },
  { src: '/loading/sushi.png', alt: 'Sushi' },
  { src: '/loading/taco.png', alt: 'Taco' },
  { src: '/loading/fries.png', alt: 'French fries' },
  { src: '/loading/ice_cream.png', alt: 'Ice cream' },
]

const CYCLE_MS = 220

/**
 * Full-viewport premium loading screen: a spinning brand-green ring around
 * a stage of 3D-rendered food icons cycling rapidly through each other.
 */
export default function LoadingScreen({ message = 'Loading...' }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % FOOD_ICONS.length)
    }, CYCLE_MS)
    return () => clearInterval(id)
  }, [])

  const icon = FOOD_ICONS[index]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="relative mx-auto mb-4 h-24 w-24">
          <div
            className="absolute inset-0 rounded-full animate-spin [animation-duration:1.1s]"
            style={{
              background:
                'conic-gradient(from 0deg, #00c951 0deg, transparent 300deg, #00c951 360deg)',
              maskImage: 'radial-gradient(circle, transparent 60%, black 61%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 60%, black 61%)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              key={icon.src}
              src={icon.src}
              alt={icon.alt}
              width={56}
              height={56}
              priority
              className="animate-in fade-in zoom-in-75 duration-150 drop-shadow-md"
            />
          </div>
        </div>
        <p className="loading-text-shimmer text-base font-medium tracking-wide">{message}</p>
      </div>
    </div>
  )
}
