'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { TriangleAlert, Store, ShoppingCart } from 'lucide-react'

const CartContext = createContext()
const CART_STORAGE_KEY = 'scaneat:cart:v1'

function getRestaurantKey(r) {
  if (!r) return null
  return r.id ?? r.slug ?? null
}

function normalizeRestaurant(r) {
  if (!r) return null
  return {
    id: r.id ?? null,
    slug: r.slug ?? null,
    name: r.name ?? null,
    phone: r.phone ?? null,

    // ✅ include these so cart page can enable buttons correctly
    pickup_available: r.pickup_available === true,
    delivery_available: r.delivery_available === true,
  }
}

export function CartProvider({ children }) {
  const t = useTranslations('cart')
  const router = useRouter()

  const [cartItems, setCartItems] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const [cartReady, setCartReady] = useState(false)

  // Dialog state (custom shadcn popup)
  const [conflictOpen, setConflictOpen] = useState(false)
  const [conflictInfo, setConflictInfo] = useState(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        const savedItems = Array.isArray(parsed?.cartItems)
          ? parsed.cartItems.filter(
              (item) =>
                item?.id &&
                Number.isFinite(Number(item?.price)) &&
                Number.isInteger(Number(item?.quantity)) &&
                Number(item.quantity) > 0
            )
          : []

        if (savedItems.length > 0 && parsed?.restaurant) {
          setCartItems(savedItems)
          setRestaurant(normalizeRestaurant(parsed.restaurant))
        }
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY)
    } finally {
      setCartReady(true)
    }
  }, [])

  useEffect(() => {
    if (!cartReady) return

    if (cartItems.length === 0 || !restaurant) {
      window.localStorage.removeItem(CART_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ cartItems, restaurant })
    )
  }, [cartItems, restaurant, cartReady])

  // Add item to cart (✅ single restaurant enforcement)
  const addToCart = (item, restaurantInfo) => {
    if (item?.is_available === false || item?.is_sold_out === true) {
      return { ok: false, reason: 'ITEM_UNAVAILABLE' }
    }

    const incomingRestaurant = normalizeRestaurant(restaurantInfo)
    const incomingKey = getRestaurantKey(incomingRestaurant)
    const currentKey = getRestaurantKey(restaurant)

    // If restaurant info missing, show dialog too (optional safety)
    if (!incomingKey) {
      setConflictInfo({
        type: 'MISSING_RESTAURANT',
        currentRestaurant: restaurant,
        incomingRestaurant: null,
      })
      setConflictOpen(true)
      return { ok: false, reason: 'MISSING_RESTAURANT' }
    }

    // 🚫 Different restaurant -> show dialog, do NOT add
    if (currentKey && currentKey !== incomingKey) {
      setConflictInfo({
        type: 'DIFFERENT_RESTAURANT',
        currentRestaurant: restaurant,
        incomingRestaurant,
      })
      setConflictOpen(true)
      return { ok: false, reason: 'DIFFERENT_RESTAURANT' }
    }

    // ✅ Always refresh restaurant info (so pickup/delivery flags stay updated)
    setRestaurant((prev) => ({
      ...(prev || {}),
      ...incomingRestaurant,
    }))

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id)

      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }

      return [...prevItems, { ...item, quantity: 1 }]
    })

    return { ok: true }
  }

  const removeFromCart = (itemId) => {
    setCartItems((prevItems) => {
      const next = prevItems.filter((i) => i.id !== itemId)
      if (next.length === 0) setRestaurant(null)
      return next
    })
  }

  const updateQuantity = (itemId, newQuantity) => {
    setCartItems((prevItems) => {
      const next =
        newQuantity <= 0
          ? prevItems.filter((i) => i.id !== itemId)
          : prevItems.map((i) =>
              i.id === itemId ? { ...i, quantity: newQuantity } : i
            )

      if (next.length === 0) setRestaurant(null)
      return next
    })
  }

  const clearCart = () => {
    setCartItems([])
    setRestaurant(null)
  }

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  )

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  )

  const goToCart = () => {
    setConflictOpen(false)
    router.push('/cart')
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        restaurant,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems,
        cartReady,
      }}
    >
      {children}

      {/* ✅ Custom shadcn popup (global) */}
      <AlertDialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <AlertDialogContent className="sm:max-w-[460px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-destructive" />
              {t('conflict.title')}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm">
              {conflictInfo?.type === 'DIFFERENT_RESTAURANT' ? (
                <>
                  {t('conflict.differentRestaurant')}
                  <br />
                  {t('conflict.differentRestaurantHint')}
                </>
              ) : (
                <>{t('conflict.missingRestaurant')}</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {conflictInfo?.type === 'DIFFERENT_RESTAURANT' && (
            <div className="mt-2 space-y-3">
              <Separator />

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{t('conflict.currentCart')}</span>
                  <Badge variant="secondary" className="gap-1">
                    <Store className="h-3.5 w-3.5" />
                    {conflictInfo?.currentRestaurant?.name ?? t('conflict.restaurantFallback')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{t('conflict.triedToAdd')}</span>
                  <Badge variant="outline" className="gap-1">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {conflictInfo?.incomingRestaurant?.name ?? t('conflict.restaurantFallback')}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>{t('conflict.close')}</AlertDialogCancel>
            <AlertDialogAction onClick={goToCart}>{t('conflict.goToCart')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
