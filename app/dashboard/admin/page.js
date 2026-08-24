'use client'
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Inbox, ListChecks, Users as UsersIcon, Store, MapPin, UtensilsCrossed, TriangleAlert, CheckCircle } from 'lucide-react'
import { getCurrentUser, getUserProfile } from '@/lib/auth/client'
import LoadingScreen from '@/components/common/LoadingScreen'

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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { DashboardSidebarProvider } from '@/context/DashboardSidebarContext'
import DashboardSidebar from '@/components/dashboard/shared/DashboardSidebar'
import DashboardHeader from '@/components/dashboard/shared/DashboardHeader'
import DashboardBackdrop from '@/components/dashboard/shared/DashboardBackdrop'
import DashboardMain from '@/components/dashboard/shared/DashboardMain'
import StatCard from '@/components/dashboard/shared/StatCard'
import TabSectionHeader from '@/components/dashboard/shared/TabSectionHeader'
import PendingRequestsTab from '@/components/dashboard/admin/tabs/PendingRequestsTab'
import AllRequestsTab from '@/components/dashboard/admin/tabs/AllRequestsTab'
import UsersTab from '@/components/dashboard/admin/tabs/UsersTab'
import RestaurantsTab from '@/components/dashboard/admin/tabs/RestaurantsTab'
import CitiesTab from '@/components/dashboard/admin/tabs/CitiesTab'
import CuisinesTab from '@/components/dashboard/admin/tabs/CuisinesTab'

export default function AdminDashboard() {
  const t = useTranslations('dashboard.admin')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  const [pendingRequests, setPendingRequests] = useState([])
  const [allRequests, setAllRequests] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [allRestaurants, setAllRestaurants] = useState([])

  // Cities
  const [cities, setCities] = useState([])
  const [cityName, setCityName] = useState('')
  const [cityLoading, setCityLoading] = useState(false)
  const [cityError, setCityError] = useState('')

  // Cuisines
  const [cuisines, setCuisines] = useState([])
  const [cuisineName, setCuisineName] = useState('')
  const [cuisineLoading, setCuisineLoading] = useState(false)
  const [cuisineError, setCuisineError] = useState('')

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending') // pending, all, users, restaurants, cities, cuisines
  const router = useRouter()

  // Dialog States
  const [infoDialog, setInfoDialog] = useState({ open: false, title: '', description: '', isError: false })
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', description: '', action: null })
  const [inputDialog, setInputDialog] = useState({
    open: false,
    title: '',
    description: '',
    value: '',
    placeholder: '',
    confirmText: t('dialogs.confirm'),
    matchValue: null,
    action: null,
  })
  const [rejectDialog, setRejectDialog] = useState({ open: false, request: null, reason: '' })

  useEffect(() => {
    loadAdminData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  async function loadAdminData() {
    setLoading(true)

    const { user: currentUser, error: userError } = await getCurrentUser()
    if (userError || !currentUser) {
      router.push('/auth/login')
      return
    }
    setUser(currentUser)

    const { data: userProfile } = await getUserProfile(currentUser.id)
    setProfile(userProfile)

    if (userProfile && userProfile.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    await Promise.all([
      loadRequests(),
      loadUsers(),
      loadRestaurants(),
      loadCities(),
      loadCuisines(),
    ])

    setLoading(false)
  }

  async function loadRequests() {
    const { data: requests, error } = await supabase
      .from('restaurant_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading requests:', error)
      setAllRequests([])
      setPendingRequests([])
      return
    }

    if (requests) {
      const requestsWithUsers = await Promise.all(
        requests.map(async (request) => {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', request.user_id)
            .single()

          return { ...request, user_profiles: userProfile }
        })
      )

      setAllRequests(requestsWithUsers)
      setPendingRequests(requestsWithUsers.filter((req) => req.status === 'pending'))
    } else {
      setAllRequests([])
      setPendingRequests([])
    }
  }

  async function loadUsers() {
    const { data } = await supabase.from('user_profiles').select('*').order('created_at', {
      ascending: false,
    })
    setAllUsers(data || [])
  }

  async function loadRestaurants() {
    const { data } = await supabase.from('restaurants').select('*').order('created_at', {
      ascending: false,
    })
    setAllRestaurants(data || [])
  }

  async function loadCities() {
    const { data, error } = await supabase.from('cities').select('*').order('name', {
      ascending: true,
    })

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
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error loading cuisines:', error)
      setCuisines([])
      return
    }

    setCuisines(data || [])
  }

  /* ---------------- Users actions ---------------- */
  const handleChangeRole = async (userId, newRole) => {
    const roleLabel = t.has(`roles.${newRole}`) ? t(`roles.${newRole}`) : newRole
    setConfirmDialog({
      open: true,
      title: t('dialogs.changeRoleTitle'),
      description: t('dialogs.changeRoleDescription', { role: roleLabel }),
      action: async () => {
        const { error } = await supabase.from('user_profiles').update({ role: newRole }).eq('id', userId)
        if (error) {
          setInfoDialog({ open: true, title: t('dialogs.errorTitle'), description: error.message, isError: true })
        } else {
          setInfoDialog({ open: true, title: t('dialogs.successTitle'), description: t('dialogs.userRoleChanged', { role: roleLabel }), isError: false })
          loadUsers()
        }
      },
    })
  }

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const disabling = !!currentStatus
    setConfirmDialog({
      open: true,
      title: disabling ? t('dialogs.disableUserTitle') : t('dialogs.enableUserTitle'),
      description: disabling ? t('dialogs.disableUserDescription') : t('dialogs.enableUserDescription'),
      action: async () => {
        const { error } = await supabase
          .from('user_profiles')
          .update({ is_active: !currentStatus })
          .eq('id', userId)

        if (error) {
          setInfoDialog({ open: true, title: t('dialogs.errorTitle'), description: error.message, isError: true })
        } else {
          setInfoDialog({ open: true, title: t('dialogs.successTitle'), description: disabling ? t('dialogs.userDisabled') : t('dialogs.userEnabled'), isError: false })
          loadUsers()
        }
      },
    })
  }

  const handleDeleteUser = async (userId, userName) => {
    const deleteKeyword = t('dialogs.deleteKeyword')
    setInputDialog({
      open: true,
      title: t('dialogs.deleteUserTitle'),
      description: t('dialogs.deleteUserDescription', { name: userName || deleteKeyword }),
      placeholder: userName || deleteKeyword,
      matchValue: userName || deleteKeyword,
      confirmText: t('dialogs.deleteUserConfirm'),
      action: async () => {
        const { error } = await supabase.from('user_profiles').delete().eq('id', userId)
        if (error) {
          setInfoDialog({ open: true, title: t('dialogs.errorTitle'), description: error.message, isError: true })
        } else {
          setInfoDialog({ open: true, title: t('dialogs.successTitle'), description: t('dialogs.userDeleted'), isError: false })
          loadUsers()
        }
      },
    })
  }

  /* ---------------- Requests actions ---------------- */
  const handleApprove = async (request) => {
    setConfirmDialog({
      open: true,
      title: t('dialogs.approveRequestTitle'),
      description: t('dialogs.approveRequestDescription', { name: request.restaurant_name }),
      action: async () => {
        try {
          const slug = request.restaurant_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

          const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .insert([
              {
                name: request.restaurant_name,
                slug,
                phone: request.phone,
                address: request.address,
                owner_id: request.user_id,
                owner_email: request.user_profiles?.email,
                is_active: true,
                approved_at: new Date().toISOString(),
              },
            ])
            .select()
            .single()

          if (restaurantError) throw new Error(t('dialogs.errorCreatingRestaurant', { message: restaurantError.message }))
          if (!restaurant) throw new Error(t('dialogs.errorCreatingRestaurantGeneric'))

          const { error: roleError } = await supabase
            .from('user_profiles')
            .update({ role: 'owner' })
            .eq('id', request.user_id)

          if (roleError) throw new Error(t('dialogs.errorUpdatingRole', { message: roleError.message }))

          const { error: requestError } = await supabase
            .from('restaurant_requests')
            .update({
              status: 'approved',
              reviewed_at: new Date().toISOString(),
              reviewed_by: user.id,
            })
            .eq('id', request.id)

          if (requestError) throw new Error(t('dialogs.errorUpdatingRequest', { message: requestError.message }))

          setInfoDialog({ open: true, title: t('dialogs.successTitle'), description: t('dialogs.requestApproved'), isError: false })
          loadAdminData()
        } catch (err) {
          setInfoDialog({ open: true, title: t('dialogs.errorTitle'), description: err.message, isError: true })
        }
      },
    })
  }

  const handleReject = (request) => {
    setRejectDialog({ open: true, request, reason: '' })
  }

  const confirmReject = async () => {
    if (!rejectDialog.reason) return
    const { request, reason } = rejectDialog

    const { error } = await supabase
      .from('restaurant_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        rejection_reason: reason,
      })
      .eq('id', request.id)

    if (error) {
      setInfoDialog({ open: true, title: t('dialogs.errorTitle'), description: error.message, isError: true })
    } else {
      setInfoDialog({ open: true, title: t('dialogs.successTitle'), description: t('dialogs.requestRejected'), isError: false })
      loadAdminData()
    }
    setRejectDialog({ open: false, request: null, reason: '' })
  }

  /* ---------------- Cities actions ---------------- */
  const handleAddCity = async (e) => {
    e.preventDefault()
    setCityError('')

    const clean = cityName.trim()
    if (!clean) return setCityError(t('citiesTab.nameEmptyError'))

    setCityLoading(true)

    const { error } = await supabase.from('cities').insert([{ name: clean }])

    if (error) {
      const msg = error.message?.toLowerCase().includes('duplicate')
        ? t('citiesTab.duplicateError')
        : error.message
      setCityError(msg)
      setCityLoading(false)
      return
    }

    setCityName('')
    setCityLoading(false)
    loadCities()
  }

  const handleRenameCity = async (cityId, newName) => {
    const clean = newName.trim()
    if (!clean) return { ok: false, message: t('pill.renameEmptyError') }

    const { error } = await supabase.from('cities').update({ name: clean }).eq('id', cityId)

    if (error) {
      const msg = error.message?.toLowerCase().includes('duplicate')
        ? t('citiesTab.duplicateError')
        : error.message
      return { ok: false, message: msg }
    }

    await loadCities()
    return { ok: true }
  }

  const handleToggleCity = async (city) => {
    const disabling = !!city.is_active
    setConfirmDialog({
      open: true,
      title: disabling ? t('citiesTab.disableTitle') : t('citiesTab.enableTitle'),
      description: disabling
        ? t('citiesTab.disableDescription', { name: city.name })
        : t('citiesTab.enableDescription', { name: city.name }),
      action: async () => {
        const { error } = await supabase
          .from('cities')
          .update({ is_active: !city.is_active })
          .eq('id', city.id)

        if (error) {
          setInfoDialog({ open: true, title: t('dialogs.errorTitle'), description: error.message, isError: true })
        } else {
          loadCities()
        }
      },
    })
  }

  const handleDeleteCity = async (city) => {
    setInputDialog({
      open: true,
      title: t('citiesTab.deleteTitle'),
      description: t('citiesTab.deleteDescription', { name: city.name }),
      placeholder: city.name,
      matchValue: city.name,
      confirmText: t('citiesTab.deleteConfirm'),
      action: async () => {
        const { error } = await supabase.from('cities').delete().eq('id', city.id)
        if (error) {
          setInfoDialog({ open: true, title: t('dialogs.errorTitle'), description: error.message, isError: true })
        } else {
          loadCities()
        }
      },
    })
  }

  /* ---------------- Cuisines actions ---------------- */
  const handleAddCuisine = async (e) => {
    e.preventDefault()
    setCuisineError('')

    const clean = cuisineName.trim()
    if (!clean) return setCuisineError(t('cuisinesTab.nameEmptyError'))

    setCuisineLoading(true)

    const { error } = await supabase.from('cuisines').insert([{ name: clean }])

    if (error) {
      const msg = error.message?.toLowerCase().includes('duplicate')
        ? t('cuisinesTab.duplicateError')
        : error.message
      setCuisineError(msg)
      setCuisineLoading(false)
      return
    }

    setCuisineName('')
    setCuisineLoading(false)
    loadCuisines()
  }

  const handleRenameCuisine = async (cuisineId, newName) => {
    const clean = newName.trim()
    if (!clean) return { ok: false, message: t('pill.renameEmptyError') }

    const { error } = await supabase.from('cuisines').update({ name: clean }).eq('id', cuisineId)

    if (error) {
      const msg = error.message?.toLowerCase().includes('duplicate')
        ? t('cuisinesTab.duplicateError')
        : error.message
      return { ok: false, message: msg }
    }

    await loadCuisines()
    return { ok: true }
  }

  const handleToggleCuisine = async (cuisine) => {
    const disabling = !!cuisine.is_active
    setConfirmDialog({
      open: true,
      title: disabling ? t('cuisinesTab.disableTitle') : t('cuisinesTab.enableTitle'),
      description: disabling
        ? t('cuisinesTab.disableDescription', { name: cuisine.name })
        : t('cuisinesTab.enableDescription', { name: cuisine.name }),
      action: async () => {
        const { error } = await supabase
          .from('cuisines')
          .update({ is_active: !cuisine.is_active })
          .eq('id', cuisine.id)

        if (error) {
          setInfoDialog({ open: true, title: t('dialogs.errorTitle'), description: error.message, isError: true })
        } else {
          loadCuisines()
        }
      },
    })
  }

  const handleDeleteCuisine = async (cuisine) => {
    setInputDialog({
      open: true,
      title: t('cuisinesTab.deleteTitle'),
      description: t('cuisinesTab.deleteDescription', { name: cuisine.name }),
      placeholder: cuisine.name,
      matchValue: cuisine.name,
      confirmText: t('cuisinesTab.deleteConfirm'),
      action: async () => {
        const { error } = await supabase.from('cuisines').delete().eq('id', cuisine.id)
        if (error) {
          setInfoDialog({ open: true, title: t('dialogs.errorTitle'), description: error.message, isError: true })
        } else {
          loadCuisines()
        }
      },
    })
  }

  /* ---------------- Restaurant Actions ---------------- */
  const handleToggleRestaurant = async (restaurant) => {
    const disabling = !!restaurant.is_active
    setConfirmDialog({
      open: true,
      title: disabling ? t('restaurantsTab.disableTitle') : t('restaurantsTab.enableTitle'),
      description: disabling
        ? t('restaurantsTab.disableDescription', { name: restaurant.name })
        : t('restaurantsTab.enableDescription', { name: restaurant.name }),
      action: async () => {
        const { error } = await supabase
          .from('restaurants')
          .update({ is_active: !restaurant.is_active })
          .eq('id', restaurant.id)

        if (error) {
          setInfoDialog({ open: true, title: t('dialogs.errorTitle'), description: error.message, isError: true })
        } else {
          setInfoDialog({ open: true, title: t('dialogs.successTitle'), description: disabling ? t('restaurantsTab.disabledSuccess') : t('restaurantsTab.enabledSuccess'), isError: false })
          loadRestaurants()
        }
      },
    })
  }

  const handleDeleteRestaurant = async (restaurant) => {
    setInputDialog({
      open: true,
      title: t('restaurantsTab.deleteTitle'),
      description: t('restaurantsTab.deleteDescription', { name: restaurant.name }),
      placeholder: restaurant.name,
      matchValue: restaurant.name,
      confirmText: t('restaurantsTab.deleteConfirm'),
      action: async () => {
        const { error } = await supabase.from('restaurants').delete().eq('id', restaurant.id)
        if (error) {
          setInfoDialog({ open: true, title: t('dialogs.errorTitle'), description: error.message, isError: true })
        } else {
          setInfoDialog({ open: true, title: t('dialogs.successTitle'), description: t('restaurantsTab.deletedSuccess'), isError: false })
          loadRestaurants()
        }
      },
    })
  }

  if (loading) {
    return <LoadingScreen message={t('page.loading')} />
  }

  const navItems = [
    { key: 'pending', label: t('nav.pending'), icon: Inbox, count: pendingRequests.length },
    { key: 'all', label: t('nav.all'), icon: ListChecks },
    { key: 'users', label: t('nav.users'), icon: UsersIcon },
    { key: 'restaurants', label: t('nav.restaurants'), icon: Store },
    { key: 'cities', label: t('nav.cities'), icon: MapPin },
    { key: 'cuisines', label: t('nav.cuisines'), icon: UtensilsCrossed },
  ]

  const tabTitles = {
    pending: t('tabs.pending.title'),
    all: t('tabs.all.title'),
    users: t('tabs.users.title'),
    restaurants: t('tabs.restaurants.title'),
    cities: t('tabs.cities.title'),
    cuisines: t('tabs.cuisines.title'),
  }

  const tabDescriptions = {
    pending: t('tabs.pending.description'),
    all: t('tabs.all.description'),
    users: t('tabs.users.description'),
    restaurants: t('tabs.restaurants.description'),
    cities: t('tabs.cities.description'),
    cuisines: t('tabs.cuisines.description'),
  }

  return (
    <DashboardSidebarProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 lg:flex">
        <DashboardSidebar
          navItems={navItems}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          user={user}
          profile={profile}
          homeLabel={t('page.homeLabel')}
          editProfileHref="/dashboard/admin/edit-profile"
        />
        <DashboardBackdrop />

        <DashboardMain
          header={
            <DashboardHeader
              user={user}
              profile={profile}
              homeHref="/dashboard/admin"
              homeLabel={t('page.homeLabel')}
              editProfileHref="/dashboard/admin/edit-profile"
              notifications={{
                items: pendingRequests,
                title: t('page.notificationsTitle'),
                emptyText: t('page.notificationsEmpty'),
                viewAllLabel: t('page.viewAllRequests'),
                onViewAll: () => setActiveTab('pending'),
              }}
            />
          }
        >
          {activeTab === 'pending' && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 xl:grid-cols-6 mb-6">
              <StatCard icon={Inbox} label={t('stats.pending')} value={pendingRequests.length} tint="warning" />
              <StatCard icon={UsersIcon} label={t('stats.users')} value={allUsers.length} tint="brand" />
              <StatCard icon={Store} label={t('stats.restaurants')} value={allRestaurants.length} tint="success" />
              <StatCard icon={ListChecks} label={t('stats.requests')} value={allRequests.length} tint="gray" />
              <StatCard icon={MapPin} label={t('stats.cities')} value={cities.length} tint="gray" />
              <StatCard icon={UtensilsCrossed} label={t('stats.cuisines')} value={cuisines.length} tint="gray" />
            </div>
          )}

          <TabSectionHeader title={tabTitles[activeTab]} description={tabDescriptions[activeTab]} />

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="p-6">
              {activeTab === 'pending' && (
                <PendingRequestsTab
                  pendingRequests={pendingRequests}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              )}

              {activeTab === 'all' && <AllRequestsTab allRequests={allRequests} />}

              {activeTab === 'users' && (
                <UsersTab
                  allUsers={allUsers}
                  currentUserId={user?.id}
                  onChangeRole={handleChangeRole}
                  onToggleStatus={handleToggleUserStatus}
                  onDeleteUser={handleDeleteUser}
                />
              )}

              {activeTab === 'restaurants' && (
                <RestaurantsTab
                  allRestaurants={allRestaurants}
                  onToggle={handleToggleRestaurant}
                  onDelete={handleDeleteRestaurant}
                />
              )}

              {activeTab === 'cities' && (
                <CitiesTab
                  cities={cities}
                  cityName={cityName}
                  setCityName={setCityName}
                  cityLoading={cityLoading}
                  cityError={cityError}
                  onAddCity={handleAddCity}
                  onRename={handleRenameCity}
                  onToggle={handleToggleCity}
                  onDelete={handleDeleteCity}
                />
              )}

              {activeTab === 'cuisines' && (
                <CuisinesTab
                  cuisines={cuisines}
                  cuisineName={cuisineName}
                  setCuisineName={setCuisineName}
                  cuisineLoading={cuisineLoading}
                  cuisineError={cuisineError}
                  onAddCuisine={handleAddCuisine}
                  onRename={handleRenameCuisine}
                  onToggle={handleToggleCuisine}
                  onDelete={handleDeleteCuisine}
                />
              )}
            </div>
          </div>
        </DashboardMain>
      </div>

      {/* Generic Info/Error Dialog */}
      <AlertDialog open={infoDialog.open} onOpenChange={(open) => setInfoDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={`flex items-center gap-2 ${infoDialog.isError ? 'text-destructive' : 'text-success-600'}`}>
              {infoDialog.isError ? <TriangleAlert className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
              {infoDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{infoDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setInfoDialog({ ...infoDialog, open: false })}>
              {t('dialogs.okay')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generic Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialogs.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-brand-500 hover:bg-brand-600"
              onClick={() => {
                if (confirmDialog.action) confirmDialog.action()
                setConfirmDialog({ ...confirmDialog, open: false })
              }}
            >
              {t('dialogs.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generic Input Dialog (for delete confirmations) */}
      <Dialog open={inputDialog.open} onOpenChange={(open) => setInputDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="h-5 w-5" />
              {inputDialog.title}
            </DialogTitle>
            <DialogDescription>{inputDialog.description}</DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Input
              value={inputDialog.value}
              placeholder={inputDialog.placeholder}
              onChange={(e) => setInputDialog({ ...inputDialog, value: e.target.value })}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setInputDialog({ ...inputDialog, open: false })}>
              {t('dialogs.cancel')}
            </Button>
            <Button
              className="bg-destructive hover:bg-destructive/90"
              disabled={inputDialog.matchValue && inputDialog.value !== inputDialog.matchValue}
              onClick={() => {
                if (inputDialog.action) inputDialog.action()
                setInputDialog({ ...inputDialog, open: false })
              }}
            >
              {inputDialog.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Request Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">{t('dialogs.rejectRequestTitle')}</DialogTitle>
            <DialogDescription>
              {t('dialogs.rejectRequestDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
              placeholder={t('dialogs.rejectReasonPlaceholder')}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectDialog({ ...rejectDialog, open: false })}>
              {t('dialogs.cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectDialog.reason.trim()}
              onClick={confirmReject}
            >
              {t('dialogs.rejectConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardSidebarProvider>
  )
}
