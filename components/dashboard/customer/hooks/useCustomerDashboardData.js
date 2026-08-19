'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getCurrentUser,
  getUserProfile,
  getUserFavorites,
  getUserRequests,
  getUserOrders,
} from '@/lib/auth/client'

export function useCustomerDashboardData() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [requests, setRequests] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const refreshFavorites = useCallback(
    async (uid) => {
      const userId = uid || user?.id
      if (!userId) return

      const { data, error } = await getUserFavorites(userId)
      if (error) {
        console.error('getUserFavorites error:', error)
        return
      }
      setFavorites(Array.isArray(data) ? data : [])
    },
    [user?.id]
  )

  const refreshRequests = useCallback(
    async (uid) => {
      const userId = uid || user?.id
      if (!userId) return

      const { data, error } = await getUserRequests(userId)
      if (error) {
        console.error('getUserRequests error:', error)
        return
      }
      setRequests(Array.isArray(data) ? data : [])
    },
    [user?.id]
  )

  const refreshOrders = useCallback(
    async (uid) => {
      const userId = uid || user?.id
      if (!userId) return

      const { data, error } = await getUserOrders(userId)
      if (error) {
        console.error('getUserOrders error:', error)
        return
      }
      setOrders(Array.isArray(data) ? data : [])
    },
    [user?.id]
  )

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)

      const { user: currentUser, error: userError } = await getCurrentUser()

      if (userError || !currentUser) {
        router.push('/auth/login')
        return
      }

      if (!mounted) return
      setUser(currentUser)

      const { data: userProfile } = await getUserProfile(currentUser.id)

      if (!mounted) return
      setProfile(userProfile)

      if (userProfile && userProfile.role !== 'customer') {
        router.push(`/dashboard/${userProfile.role}`)
        return
      }

      const [{ data: userFavorites }, { data: userRequests }, { data: userOrders }] = await Promise.all([
        getUserFavorites(currentUser.id),
        getUserRequests(currentUser.id),
        getUserOrders(currentUser.id),
      ])

      if (!mounted) return
      setFavorites(Array.isArray(userFavorites) ? userFavorites : [])
      setRequests(Array.isArray(userRequests) ? userRequests : [])
      setOrders(Array.isArray(userOrders) ? userOrders : [])
      setLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [router])

  // ✅ refresh when user returns to the tab (very common)
  useEffect(() => {
    const onFocus = () => {
      refreshFavorites()
      refreshRequests()
      refreshOrders()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshFavorites, refreshRequests, refreshOrders])

  // ✅ refresh when FavoriteButton broadcasts changes
  useEffect(() => {
    const onChanged = (e) => {
      const eventUserId = e?.detail?.userId
      if (eventUserId && user?.id && eventUserId !== user.id) return
      refreshFavorites()
    }

    window.addEventListener('favorites:changed', onChanged)
    return () => window.removeEventListener('favorites:changed', onChanged)
  }, [refreshFavorites, user?.id])

  return {
    user,
    profile,
    favorites,
    setFavorites,
    refreshFavorites, // ✅ exported if you want manual refresh
    requests,
    setRequests,
    refreshRequests, // ✅ exported if you want manual refresh
    orders,
    setOrders,
    refreshOrders, // ✅ exported if you want manual refresh
    loading,
  }
}