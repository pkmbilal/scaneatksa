'use client'
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inbox, ListChecks, Users as UsersIcon, Store, MapPin, UtensilsCrossed, TriangleAlert, CheckCircle } from 'lucide-react'
import { getCurrentUser, getUserProfile } from '@/lib/auth/client'

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
import PendingRequestsTab from '@/components/dashboard/admin/tabs/PendingRequestsTab'
import AllRequestsTab from '@/components/dashboard/admin/tabs/AllRequestsTab'
import UsersTab from '@/components/dashboard/admin/tabs/UsersTab'
import RestaurantsTab from '@/components/dashboard/admin/tabs/RestaurantsTab'
import CitiesTab from '@/components/dashboard/admin/tabs/CitiesTab'
import CuisinesTab from '@/components/dashboard/admin/tabs/CuisinesTab'

export default function AdminDashboard() {
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
    confirmText: 'Confirm',
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
    setConfirmDialog({
      open: true,
      title: 'Change User Role',
      description: `Are you sure you want to change this user's role to ${newRole}?`,
      action: async () => {
        const { error } = await supabase.from('user_profiles').update({ role: newRole }).eq('id', userId)
        if (error) {
          setInfoDialog({ open: true, title: 'Error', description: error.message, isError: true })
        } else {
          setInfoDialog({ open: true, title: 'Success', description: `User role changed to ${newRole}`, isError: false })
          loadUsers()
        }
      },
    })
  }

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'disable' : 'enable'
    setConfirmDialog({
      open: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      description: `Are you sure you want to ${action} this user?`,
      action: async () => {
        const { error } = await supabase
          .from('user_profiles')
          .update({ is_active: !currentStatus })
          .eq('id', userId)

        if (error) {
          setInfoDialog({ open: true, title: 'Error', description: error.message, isError: true })
        } else {
          setInfoDialog({ open: true, title: 'Success', description: `User ${action}d successfully`, isError: false })
          loadUsers()
        }
      },
    })
  }

  const handleDeleteUser = async (userId, userName) => {
    setInputDialog({
      open: true,
      title: 'Delete User',
      description: `This will permanently delete the user and all their data. Type "${userName || 'DELETE'}" to confirm.`,
      placeholder: userName || 'DELETE',
      matchValue: userName || 'DELETE',
      confirmText: 'Delete User',
      action: async () => {
        const { error } = await supabase.from('user_profiles').delete().eq('id', userId)
        if (error) {
          setInfoDialog({ open: true, title: 'Error', description: error.message, isError: true })
        } else {
          setInfoDialog({ open: true, title: 'Success', description: 'User deleted successfully', isError: false })
          loadUsers()
        }
      },
    })
  }

  /* ---------------- Requests actions ---------------- */
  const handleApprove = async (request) => {
    setConfirmDialog({
      open: true,
      title: 'Approve Request',
      description: `Approve ${request.restaurant_name}? This will create the restaurant and promote the user to Owner.`,
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

          if (restaurantError) throw new Error('Error creating restaurant: ' + restaurantError.message)
          if (!restaurant) throw new Error('Failed to create restaurant')

          const { error: roleError } = await supabase
            .from('user_profiles')
            .update({ role: 'owner' })
            .eq('id', request.user_id)

          if (roleError) throw new Error('Error updating user role: ' + roleError.message)

          const { error: requestError } = await supabase
            .from('restaurant_requests')
            .update({
              status: 'approved',
              reviewed_at: new Date().toISOString(),
              reviewed_by: user.id,
            })
            .eq('id', request.id)

          if (requestError) throw new Error('Error updating request: ' + requestError.message)

          setInfoDialog({ open: true, title: 'Success', description: 'Request approved! Restaurant created.', isError: false })
          loadAdminData()
        } catch (err) {
          setInfoDialog({ open: true, title: 'Error', description: err.message, isError: true })
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
      setInfoDialog({ open: true, title: 'Error', description: error.message, isError: true })
    } else {
      setInfoDialog({ open: true, title: 'Success', description: 'Request rejected.', isError: false })
      loadAdminData()
    }
    setRejectDialog({ open: false, request: null, reason: '' })
  }

  /* ---------------- Cities actions ---------------- */
  const handleAddCity = async (e) => {
    e.preventDefault()
    setCityError('')

    const clean = cityName.trim()
    if (!clean) return setCityError('City name cannot be empty')

    setCityLoading(true)

    const { error } = await supabase.from('cities').insert([{ name: clean }])

    if (error) {
      const msg = error.message?.toLowerCase().includes('duplicate')
        ? 'City already exists.'
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
    if (!clean) return { ok: false, message: 'Name cannot be empty' }

    const { error } = await supabase.from('cities').update({ name: clean }).eq('id', cityId)

    if (error) {
      const msg = error.message?.toLowerCase().includes('duplicate')
        ? 'City already exists.'
        : error.message
      return { ok: false, message: msg }
    }

    await loadCities()
    return { ok: true }
  }

  const handleToggleCity = async (city) => {
    const action = city.is_active ? 'disable' : 'enable'
    setConfirmDialog({
      open: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} City`,
      description: `Are you sure you want to ${action} ${city.name}?`,
      action: async () => {
        const { error } = await supabase
          .from('cities')
          .update({ is_active: !city.is_active })
          .eq('id', city.id)

        if (error) {
          setInfoDialog({ open: true, title: 'Error', description: error.message, isError: true })
        } else {
          loadCities()
        }
      },
    })
  }

  const handleDeleteCity = async (city) => {
    setInputDialog({
      open: true,
      title: 'Delete City',
      description: `Type "${city.name}" to delete this city:`,
      placeholder: city.name,
      matchValue: city.name,
      confirmText: 'Delete',
      action: async () => {
        const { error } = await supabase.from('cities').delete().eq('id', city.id)
        if (error) {
          setInfoDialog({ open: true, title: 'Error', description: error.message, isError: true })
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
    if (!clean) return setCuisineError('Cuisine name cannot be empty')

    setCuisineLoading(true)

    const { error } = await supabase.from('cuisines').insert([{ name: clean }])

    if (error) {
      const msg = error.message?.toLowerCase().includes('duplicate')
        ? 'Cuisine already exists.'
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
    if (!clean) return { ok: false, message: 'Name cannot be empty' }

    const { error } = await supabase.from('cuisines').update({ name: clean }).eq('id', cuisineId)

    if (error) {
      const msg = error.message?.toLowerCase().includes('duplicate')
        ? 'Cuisine already exists.'
        : error.message
      return { ok: false, message: msg }
    }

    await loadCuisines()
    return { ok: true }
  }

  const handleToggleCuisine = async (cuisine) => {
    const action = cuisine.is_active ? 'disable' : 'enable'
    setConfirmDialog({
      open: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Cuisine`,
      description: `Are you sure you want to ${action} ${cuisine.name}?`,
      action: async () => {
        const { error } = await supabase
          .from('cuisines')
          .update({ is_active: !cuisine.is_active })
          .eq('id', cuisine.id)

        if (error) {
          setInfoDialog({ open: true, title: 'Error', description: error.message, isError: true })
        } else {
          loadCuisines()
        }
      },
    })
  }

  const handleDeleteCuisine = async (cuisine) => {
    setInputDialog({
      open: true,
      title: 'Delete Cuisine',
      description: `Type "${cuisine.name}" to delete this cuisine:`,
      placeholder: cuisine.name,
      matchValue: cuisine.name,
      confirmText: 'Delete',
      action: async () => {
        const { error } = await supabase.from('cuisines').delete().eq('id', cuisine.id)
        if (error) {
          setInfoDialog({ open: true, title: 'Error', description: error.message, isError: true })
        } else {
          loadCuisines()
        }
      },
    })
  }

  /* ---------------- Restaurant Actions ---------------- */
  const handleToggleRestaurant = async (restaurant) => {
    const action = restaurant.is_active ? 'disable' : 'enable'
    setConfirmDialog({
      open: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Restaurant`,
      description: `Are you sure you want to ${action} ${restaurant.name}?`,
      action: async () => {
        const { error } = await supabase
          .from('restaurants')
          .update({ is_active: !restaurant.is_active })
          .eq('id', restaurant.id)

        if (error) {
          setInfoDialog({ open: true, title: 'Error', description: error.message, isError: true })
        } else {
          setInfoDialog({ open: true, title: 'Success', description: `Restaurant ${action}d successfully`, isError: false })
          loadRestaurants()
        }
      },
    })
  }

  const handleDeleteRestaurant = async (restaurant) => {
    setInputDialog({
      open: true,
      title: 'Delete Restaurant',
      description: `This will permanently delete "${restaurant.name}" and all its menu items! Type "${restaurant.name}" to confirm:`,
      placeholder: restaurant.name,
      matchValue: restaurant.name,
      confirmText: 'Delete',
      action: async () => {
        const { error } = await supabase.from('restaurants').delete().eq('id', restaurant.id)
        if (error) {
          setInfoDialog({ open: true, title: 'Error', description: error.message, isError: true })
        } else {
          setInfoDialog({ open: true, title: 'Success', description: 'Restaurant deleted successfully', isError: false })
          loadRestaurants()
        }
      },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { key: 'pending', label: 'Pending Requests', icon: Inbox, count: pendingRequests.length },
    { key: 'all', label: 'All Requests', icon: ListChecks },
    { key: 'users', label: 'Users', icon: UsersIcon },
    { key: 'restaurants', label: 'Restaurants', icon: Store },
    { key: 'cities', label: 'Cities', icon: MapPin },
    { key: 'cuisines', label: 'Cuisines', icon: UtensilsCrossed },
  ]

  const tabTitles = {
    pending: 'Pending Requests',
    all: 'All Requests',
    users: 'Users',
    restaurants: 'Restaurants',
    cities: 'Cities',
    cuisines: 'Cuisines',
  }

  return (
    <DashboardSidebarProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 lg:flex">
        <DashboardSidebar navItems={navItems} activeTab={activeTab} onSelectTab={setActiveTab} />
        <DashboardBackdrop />

        <DashboardMain
          header={
            <DashboardHeader
              user={user}
              profile={profile}
              homeHref="/dashboard/admin"
              homeLabel="Admin Dashboard"
              notifications={{
                items: pendingRequests,
                title: 'Pending Requests',
                emptyText: 'No pending restaurant requests.',
                viewAllLabel: 'View All Requests',
                onViewAll: () => setActiveTab('pending'),
              }}
            />
          }
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 xl:grid-cols-6 mb-6">
            <StatCard icon={Inbox} label="Pending" value={pendingRequests.length} tint="warning" />
            <StatCard icon={UsersIcon} label="Users" value={allUsers.length} tint="brand" />
            <StatCard icon={Store} label="Restaurants" value={allRestaurants.length} tint="success" />
            <StatCard icon={ListChecks} label="Requests" value={allRequests.length} tint="gray" />
            <StatCard icon={MapPin} label="Cities" value={cities.length} tint="gray" />
            <StatCard icon={UtensilsCrossed} label="Cuisines" value={cuisines.length} tint="gray" />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-6">{tabTitles[activeTab]}</h2>

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
              Okay
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-brand-500 hover:bg-brand-600"
              onClick={() => {
                if (confirmDialog.action) confirmDialog.action()
                setConfirmDialog({ ...confirmDialog, open: false })
              }}
            >
              Confirm
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
              Cancel
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
            <DialogTitle className="text-destructive">Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
              placeholder="Reason for rejection..."
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectDialog({ ...rejectDialog, open: false })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectDialog.reason.trim()}
              onClick={confirmReject}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardSidebarProvider>
  )
}
