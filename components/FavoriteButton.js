"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getCurrentUser,
  addToFavorites,
  removeFromFavorites,
  isFavorited,
} from "@/lib/auth/client"

export default function FavoriteButton({ restaurantId }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  const checkIfFavorited = useCallback(async () => {
    if (!restaurantId) return
    setChecking(true)

    try {
      const { user: currentUser } = await getCurrentUser()
      if (!currentUser) {
        setUser(null)
        setIsFavorite(false)
        return
      }

      setUser(currentUser)

      const { isFavorited: favorited } = await isFavorited(
        currentUser.id,
        restaurantId
      )
      setIsFavorite(!!favorited)
    } catch (err) {
      console.error("Check favorite error:", err)
      setIsFavorite(false)
    } finally {
      setChecking(false)
    }
  }, [restaurantId])

  useEffect(() => {
    checkIfFavorited()
    const onFocus = () => checkIfFavorited()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [checkIfFavorited])

  const handleToggleFavorite = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      if (confirm("Please login to save favorites. Go to login page?")) {
        router.push("/auth/login")
      }
      return
    }

    setLoading(true)

    try {
      let changed = false

      if (isFavorite) {
        // Takes only the restaurant id -- the user comes from the session.
        const { error } = await removeFromFavorites(restaurantId)
        if (error) {
          alert("Error removing favorite: " + error.message)
        } else {
          setIsFavorite(false)
          changed = true
        }
      } else {
        const { error } = await addToFavorites(restaurantId)
        if (error) {
          if (error.code === "23505") setIsFavorite(true)
          else alert("Error adding favorite: " + error.message)
        } else {
          setIsFavorite(true)
          changed = true
        }
      }

      if (changed) {
        window.dispatchEvent(
          new CustomEvent("favorites:changed", {
            detail: { userId: user.id, restaurantId },
          })
        )
      }
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="h-10 w-10 rounded-full bg-muted animate-pulse grid place-items-center">
        <Heart className="h-5 w-5 text-muted-foreground/40" />
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={handleToggleFavorite}
      disabled={loading}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className={[
        "h-10 w-10 rounded-full shadow-md backdrop-blur-sm transition",
        "hover:scale-110 active:scale-95",
        loading ? "opacity-60" : "",
        isFavorite ? "bg-red-100 hover:bg-red-200" : "bg-white/90 hover:bg-white",
      ].join(" ")}
    >
      <Heart
        className={[
          "h-5 w-5 transition",
          isFavorite ? "fill-red-500 text-red-500" : "text-gray-600",
        ].join(" ")}
      />
    </Button>
  )
}