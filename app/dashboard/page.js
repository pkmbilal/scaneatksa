'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getUserProfile } from '@/lib/auth/client'
import LoadingScreen from '@/components/common/LoadingScreen'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkUserAndRedirect() {
      // Get current user
      const { user, error: userError } = await getCurrentUser()

      if (userError || !user) {
        // Not logged in - redirect to login
        router.push('/auth/login')
        return
      }

      // Get user profile to check role
      const { data: profile, error: profileError } = await getUserProfile(user.id)

      if (profileError || !profile) {
        // Profile not found - something wrong
        router.push('/auth/login')
        return
      }

      // Redirect based on role
      switch (profile.role) {
        case 'admin':
          router.push('/dashboard/admin')
          break
        case 'owner':
          router.push('/dashboard/owner')
          break
        case 'kitchen':
          router.push('/dashboard/kitchen')
          break
        case 'waiter':
          router.push('/dashboard/waiter')
          break
        case 'customer':
        default:
          router.push('/dashboard/customer')
          break
      }
    }

    checkUserAndRedirect()
  }, [router])

  return <LoadingScreen message="Loading your dashboard..." />
}