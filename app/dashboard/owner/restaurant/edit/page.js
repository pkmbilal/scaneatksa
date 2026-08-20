'use client'
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { getCurrentUser, getUserProfile, getUserRestaurant } from '@/lib/auth/client'
import { Switch } from '@/components/ui/switch'

const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white'

export default function EditRestaurantPage() {
  const t = useTranslations('dashboard.owner')
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState(null)

  // ✅ Cities list
  const [cities, setCities] = useState([])

  // ✅ Cuisines list + selected cuisines
  const [cuisines, setCuisines] = useState([])
  const [selectedCuisineIds, setSelectedCuisineIds] = useState([])

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    image_url: '',
    city_id: '',
    is_active: true,

    // ✅ NEW (matches your schema)
    delivery_available: false,
    pickup_available: true,
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadCities() {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error loading cities:', error)
      setCities([])
      return
    }

    setCities(data || [])
  }

  async function loadCuisines() {
    const { data, error } = await supabase
      .from('cuisines')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error loading cuisines:', error)
      setCuisines([])
      return
    }

    setCuisines(data || [])
  }

  async function loadSelectedCuisines(restaurantId) {
    const { data, error } = await supabase
      .from('restaurant_cuisines')
      .select('cuisine_id')
      .eq('restaurant_id', restaurantId)

    if (error) {
      console.error('Error loading selected cuisines:', error)
      setSelectedCuisineIds([])
      return
    }

    setSelectedCuisineIds((data || []).map((x) => x.cuisine_id))
  }

  async function loadData() {
    setLoading(true)

    const { user: currentUser, error: userError } = await getCurrentUser()
    if (userError || !currentUser) {
      router.push('/auth/login')
      return
    }

    const { data: userProfile } = await getUserProfile(currentUser.id)
    if (!userProfile || userProfile.role !== 'owner') {
      router.push('/dashboard')
      return
    }

    // ✅ load cities + cuisines first (for dropdowns)
    await Promise.all([loadCities(), loadCuisines()])

    const { data: userRestaurant, error: restaurantError } = await getUserRestaurant(currentUser.id)
    if (restaurantError || !userRestaurant) {
      setError(t('editRestaurantPage.errors.noRestaurant'))
      setLoading(false)
      return
    }

    setRestaurant(userRestaurant)

    setFormData({
      name: userRestaurant.name || '',
      phone: userRestaurant.phone || '',
      address: userRestaurant.address || '',
      image_url: userRestaurant.image_url || '',
      city_id: userRestaurant.city_id || '',
      is_active: userRestaurant.is_active ?? true,

      // ✅ map from your DB columns
      delivery_available: userRestaurant.delivery_available ?? false,
      pickup_available: userRestaurant.pickup_available ?? true,
    })

    // ✅ load selected cuisines for this restaurant
    await loadSelectedCuisines(userRestaurant.id)

    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!restaurant) return

    setSaving(true)
    setError('')
    setSuccess('')

    // Optional: at least one option must be enabled
    if (!formData.delivery_available && !formData.pickup_available) {
      setError(t('editRestaurantPage.errors.needServiceOption'))
      setSaving(false)
      return
    }

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      image_url: formData.image_url.trim(),
      city_id: formData.city_id || null,
      is_active: formData.is_active,

      // ✅ save to your schema fields
      delivery_available: !!formData.delivery_available,
      pickup_available: !!formData.pickup_available,
    }

    const { error: dbError } = await supabase
      .from('restaurants')
      .update(payload)
      .eq('id', restaurant.id)

    if (dbError) {
      setError(t('editRestaurantPage.errors.updateFailed', { message: dbError.message }))
      setSaving(false)
      return
    }

    // ✅ Save cuisines mapping (replace all)
    const { error: delError } = await supabase
      .from('restaurant_cuisines')
      .delete()
      .eq('restaurant_id', restaurant.id)

    if (delError) {
      setError(t('editRestaurantPage.errors.cuisinesUpdateFailed', { message: delError.message }))
      setSaving(false)
      return
    }

    if (selectedCuisineIds.length > 0) {
      const rows = selectedCuisineIds.map((cid) => ({
        restaurant_id: restaurant.id,
        cuisine_id: cid,
      }))

      const { error: insError } = await supabase.from('restaurant_cuisines').insert(rows)

      if (insError) {
        setError(t('editRestaurantPage.errors.cuisinesUpdateFailed', { message: insError.message }))
        setSaving(false)
        return
      }
    }

    setSuccess(t('editRestaurantPage.success.saved'))
    setSaving(false)

    setTimeout(() => {
      router.push('/dashboard/owner')
    }, 700)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('editRestaurantPage.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90">{t('editRestaurantPage.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('editRestaurantPage.subtitle')}</p>
          </div>

          <Link
            href="/dashboard/owner"
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 font-semibold dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/5"
          >
            {t('editRestaurantPage.back')}
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('editRestaurantPage.nameLabel')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                required
              />
            </div>

            {/* City dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('editRestaurantPage.cityLabel')}</label>
              <select
                value={formData.city_id}
                onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                className={inputClass}
                required
              >
                <option value="" disabled>
                  {t('editRestaurantPage.selectCity')}
                </option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {cities.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('editRestaurantPage.noCitiesHint')}
                </p>
              )}
            </div>

            {/* ✅ Delivery / Pickup */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('editRestaurantPage.serviceOptionsLabel')}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between gap-3 p-3 border border-gray-200 rounded-xl dark:border-gray-800">
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-white/90">{t('editRestaurantPage.deliveryTitle')}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('editRestaurantPage.deliveryHint')}</div>
                  </div>
                  <Switch
                    checked={formData.delivery_available}
                    onCheckedChange={(v) => setFormData({ ...formData, delivery_available: v })}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 p-3 border border-gray-200 rounded-xl dark:border-gray-800">
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-white/90">{t('editRestaurantPage.pickupTitle')}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t('editRestaurantPage.pickupHint')}</div>
                  </div>
                  <Switch
                    checked={formData.pickup_available}
                    onCheckedChange={(v) => setFormData({ ...formData, pickup_available: v })}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('editRestaurantPage.serviceOptionsTip')}
              </p>
            </div>

            {/* ✅ Cuisines multi-select */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('editRestaurantPage.cuisinesLabel')}</label>

              <select
                multiple
                value={selectedCuisineIds}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map((o) => o.value)
                  setSelectedCuisineIds(values)
                }}
                className={`min-h-[120px] ${inputClass}`}
              >
                {cuisines.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {cuisines.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('editRestaurantPage.noCuisinesHint')}</p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('editRestaurantPage.cuisinesTip')}
                </p>
              )}

              {selectedCuisineIds.length > 0 && cuisines.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCuisineIds.map((id) => {
                    const c = cuisines.find((x) => x.id === id)
                    if (!c) return null
                    return (
                      <span
                        key={id}
                        className="text-xs px-2 py-1 rounded-full font-semibold bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
                      >
                        {c.name}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('editRestaurantPage.phoneLabel')}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('editRestaurantPage.phonePlaceholder')}
                className={inputClass}
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('editRestaurantPage.addressLabel')}</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('editRestaurantPage.imageUrlLabel')}
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder={t('editRestaurantPage.imageUrlPlaceholder')}
                className={inputClass}
              />

              {!!formData.image_url?.trim() && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('editRestaurantPage.imagePreviewLabel')}</p>
                  <img
                    src={formData.image_url}
                    alt={t('editRestaurantPage.imagePreviewAlt')}
                    className="w-full h-44 object-cover rounded-lg border border-gray-200 dark:border-gray-800"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <label htmlFor="is_active" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('editRestaurantPage.activeLabel')}
              </label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
            </div>

            {/* Error / Success */}
            {error && (
              <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-success-700 dark:border-success-800 dark:bg-success-500/10 dark:text-success-400">
                {success}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving || cities.length === 0}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold disabled:bg-gray-400 transition-colors"
              >
                {saving ? t('editRestaurantPage.saving') : t('editRestaurantPage.save')}
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard/owner')}
                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-colors dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                {t('editRestaurantPage.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
