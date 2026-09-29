'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getCurrentUser, getUserProfile, getDashboardPath } from '@/lib/auth/client'
import LoadingScreen from '@/components/common/LoadingScreen'

export default function DashboardPage() {
  const t = useTranslations('dashboard.common')
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

      // Redirect based on role (replace so Back skips this hop)
      router.replace(getDashboardPath(profile.role))
    }

    checkUserAndRedirect()
  }, [router])

  return <LoadingScreen message={t('loading')} />
}