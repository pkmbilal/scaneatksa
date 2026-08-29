'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getCurrentUser,
  getUserProfile,
  getUserFavorites,
  getUserRequests,
  getUserOrders,
  getUserReviews,
} from '@/lib/auth/client'
import { supabaseBrowser } from '@/lib/supabase/client'
import { useOrderAlerts } from '@/components/dashboard/shared/hooks/useOrderAlerts'
import { classifyOrderEvent } from '@/lib/orderNotifications'

export function useCustomerDashboardData() {
  const router = useRouter()

  const orderAlerts = useOrderAlerts()
  // Kept in a ref so the realtime effect below doesn't re-subscribe when the
  // hook re-renders.
  const orderAlertsPushRef = useRef(orderAlerts.push)
  useEffect(() => {
    orderAlertsPushRef.current = orderAlerts.push
  })

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [requests, setRequests] = useState([])
  const [orders, setOrders] = useState([])
  const [reviews, setReviews] = useState([])
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

  const refreshReviews = useCallback(
    async (uid) => {
      const userId = uid || user?.id
      if (!userId) return

      const { data, error } = await getUserReviews(userId)
      if (error) {
        console.error('getUserReviews error:', error)
        return
      }
      setReviews(Array.isArray(data) ? data : [])
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

      const [{ data: userFavorites }, { data: userRequests }, { data: userOrders }, { data: userReviews }] =
        await Promise.all([
          getUserFavorites(currentUser.id),
          getUserRequests(currentUser.id),
          getUserOrders(currentUser.id),
          getUserReviews(currentUser.id),
        ])

      if (!mounted) return
      setFavorites(Array.isArray(userFavorites) ? userFavorites : [])
      setRequests(Array.isArray(userRequests) ? userRequests : [])
      setOrders(Array.isArray(userOrders) ? userOrders : [])
      setReviews(Array.isArray(userReviews) ? userReviews : [])
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
      refreshReviews()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshFavorites, refreshRequests, refreshOrders, refreshReviews])

  // ✅ live order status updates (kitchen/waiter/owner changing `orders.status`)
  // via Supabase Realtime, so the progress line updates without a refocus/refresh.
  useEffect(() => {
    if (!user?.id) return

    const supabase = supabaseBrowser()
    const channel = supabase
      .channel(`orders-user-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
            )
            orderAlertsPushRef.current(
              classifyOrderEvent({
                role: 'customer',
                eventType: 'UPDATE',
                next: payload.new,
                prev: payload.old,
              })
            )
          } else {
            // INSERT/DELETE need the joined restaurant/table/item data getUserOrders
            // provides, which the realtime payload doesn't include — just refetch.
            refreshOrders()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, refreshOrders])

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

  // ✅ refresh when a review is submitted/edited (OrdersTab dispatches it,
  // mirroring how FavoriteButton dispatches favorites:changed)
  useEffect(() => {
    const onChanged = (e) => {
      const eventUserId = e?.detail?.userId
      if (eventUserId && user?.id && eventUserId !== user.id) return
      refreshReviews()
    }

    window.addEventListener('reviews:changed', onChanged)
    return () => window.removeEventListener('reviews:changed', onChanged)
  }, [refreshReviews, user?.id])

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
    reviews,
    setReviews,
    refreshReviews, // ✅ exported if you want manual refresh
    loading,
    orderAlerts, // toast/chime + header-bell notifications for live order updates
  }
}