'use client'

// Admin subscription management. No payment gateway yet -- the platform operator
// sets trial / paid / suspended state and expiry dates by hand here. Enforcement
// is in Postgres (is_restaurant_published + the restaurants public-read policies);
// this tab only writes the subscription_* columns via the restaurants_admin_all
// RLS policy.

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CreditCard, ChevronDown, ChevronUp } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getSubscriptionState,
  daysUntil,
  extendExpiry,
  freshTrialExpiry,
  latestSubscriptionAction,
  TRIAL_DAYS,
  DUE_SOON_DAYS,
} from '@/lib/subscription'

const FILTERS = ['all', 'trial', 'active', 'grace', 'expired', 'suspended', 'requested']
const PAYMENT_METHODS = ['bankTransfer', 'stcPay', 'cash', 'other']

const BADGE_CLASS = {
  trial: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  active: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
  unlimited: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
  grace: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
  expired: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
  suspended: 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
}

function sortByExpiry(list) {
  return [...list].sort((a, b) => {
    const ax = a.subscription_expires_at ? new Date(a.subscription_expires_at).getTime() : Infinity
    const bx = b.subscription_expires_at ? new Date(b.subscription_expires_at).getTime() : Infinity
    return ax - bx
  })
}

function matchesFilter(restaurant, filter, pendingRenewalIds) {
  if (filter === 'all') return true
  if (filter === 'requested') return pendingRenewalIds.has(restaurant.id)
  const state = getSubscriptionState(restaurant)
  if (filter === 'active') return state === 'active' || state === 'unlimited'
  return state === filter
}

export default function SubscriptionsTab({ restaurants, events, onUpdate }) {
  const t = useTranslations('dashboard.admin')
  const [filter, setFilter] = useState('all')
  const [dateDialog, setDateDialog] = useState({ open: false, restaurant: null, value: '' })
  const [notesDialog, setNotesDialog] = useState({ open: false, restaurant: null, value: '' })
  const [restartTrialDialog, setRestartTrialDialog] = useState({ open: false, restaurant: null })
  const [paymentDialog, setPaymentDialog] = useState({
    open: false,
    restaurant: null,
    amount: '',
    method: 'bankTransfer',
    reference: '',
  })

  const pendingRenewalIds = new Set(
    (restaurants || [])
      .filter((r) => latestSubscriptionAction(events, r.id) === 'renewalRequested')
      .map((r) => r.id)
  )

  const visible = sortByExpiry(restaurants || []).filter((r) =>
    matchesFilter(r, filter, pendingRenewalIds)
  )

  const startTrial = (restaurant) => {
    const patch = {
      subscription_status: 'trial',
      subscription_started_at: new Date().toISOString(),
      subscription_expires_at: freshTrialExpiry(),
      trial_used: true,
    }
    if (restaurant.trial_used) {
      setRestartTrialDialog({ open: true, restaurant })
      return
    }
    onUpdate(restaurant, patch, 'trialStarted', { messageParams: { days: TRIAL_DAYS } })
  }

  const confirmRestartTrial = () => {
    const { restaurant } = restartTrialDialog
    if (!restaurant) return
    onUpdate(
      restaurant,
      {
        subscription_status: 'trial',
        subscription_started_at: new Date().toISOString(),
        subscription_expires_at: freshTrialExpiry(),
        trial_used: true,
      },
      'trialStarted',
      { messageParams: { days: TRIAL_DAYS } }
    )
    setRestartTrialDialog({ open: false, restaurant: null })
  }

  const submitPayment = () => {
    const { restaurant, amount, method, reference } = paymentDialog
    if (!restaurant) return
    onUpdate(restaurant, { subscription_status: 'active' }, 'activated', {
      eventDetails: {
        amount: amount.trim() || null,
        method,
        reference: reference.trim() || null,
      },
    })
    setPaymentDialog({ open: false, restaurant: null, amount: '', method: 'bankTransfer', reference: '' })
  }

  const submitDate = () => {
    const { restaurant, value } = dateDialog
    if (!restaurant || !value) return
    onUpdate(
      restaurant,
      {
        subscription_expires_at: new Date(`${value}T23:59:59`).toISOString(),
        subscription_status: 'active',
      },
      'expirySet'
    )
    setDateDialog({ open: false, restaurant: null, value: '' })
  }

  const submitNotes = () => {
    const { restaurant, value } = notesDialog
    if (!restaurant) return
    onUpdate(restaurant, { subscription_notes: value.trim() || null }, 'notesSaved')
    setNotesDialog({ open: false, restaurant: null, value: '' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              filter === key
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {t(`subscriptionsTab.filters.${key}`)}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="py-12 text-center">
          <CreditCard className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">{t('subscriptionsTab.emptyState')}</p>
        </div>
      ) : (
        visible.map((restaurant) => (
          <SubscriptionCard
            key={restaurant.id}
            restaurant={restaurant}
            events={(events || []).filter((e) => e.restaurant_id === restaurant.id)}
            isPendingRenewal={pendingRenewalIds.has(restaurant.id)}
            onUpdate={onUpdate}
            onStartTrial={() => startTrial(restaurant)}
            onOpenPayment={() =>
              setPaymentDialog({
                open: true,
                restaurant,
                amount: '',
                method: 'bankTransfer',
                reference: '',
              })
            }
            onOpenDate={() =>
              setDateDialog({
                open: true,
                restaurant,
                value: restaurant.subscription_expires_at
                  ? new Date(restaurant.subscription_expires_at).toISOString().slice(0, 10)
                  : '',
              })
            }
            onOpenNotes={() =>
              setNotesDialog({
                open: true,
                restaurant,
                value: restaurant.subscription_notes || '',
              })
            }
          />
        ))
      )}

      {/* Set exact expiry date */}
      <Dialog
        open={dateDialog.open}
        onOpenChange={(open) => setDateDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('subscriptionsTab.dateDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('subscriptionsTab.dateDialog.description', {
                name: dateDialog.restaurant?.name || '',
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              type="date"
              value={dateDialog.value}
              onChange={(e) => setDateDialog({ ...dateDialog, value: e.target.value })}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDateDialog({ ...dateDialog, open: false })}>
              {t('dialogs.cancel')}
            </Button>
            <Button
              className="bg-brand-500 hover:bg-brand-600"
              disabled={!dateDialog.value}
              onClick={submitDate}
            >
              {t('dialogs.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit subscription notes */}
      <Dialog
        open={notesDialog.open}
        onOpenChange={(open) => setNotesDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('subscriptionsTab.notesDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('subscriptionsTab.notesDialog.description', {
                name: notesDialog.restaurant?.name || '',
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              value={notesDialog.value}
              onChange={(e) => setNotesDialog({ ...notesDialog, value: e.target.value })}
              placeholder={t('subscriptionsTab.notesDialog.placeholder')}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setNotesDialog({ ...notesDialog, open: false })}>
              {t('dialogs.cancel')}
            </Button>
            <Button className="bg-brand-500 hover:bg-brand-600" onClick={submitNotes}>
              {t('dialogs.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm restarting an already-used trial */}
      <Dialog
        open={restartTrialDialog.open}
        onOpenChange={(open) => setRestartTrialDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('subscriptionsTab.restartTrialDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('subscriptionsTab.restartTrialDialog.description', {
                name: restartTrialDialog.restaurant?.name || '',
                days: TRIAL_DAYS,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRestartTrialDialog({ open: false, restaurant: null })}
            >
              {t('dialogs.cancel')}
            </Button>
            <Button className="bg-brand-500 hover:bg-brand-600" onClick={confirmRestartTrial}>
              {t('dialogs.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record a manual payment when marking a restaurant paid */}
      <Dialog
        open={paymentDialog.open}
        onOpenChange={(open) => setPaymentDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('subscriptionsTab.paymentDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('subscriptionsTab.paymentDialog.description', {
                name: paymentDialog.restaurant?.name || '',
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                {t('subscriptionsTab.paymentDialog.amountLabel')}
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={paymentDialog.amount}
                onChange={(e) => setPaymentDialog({ ...paymentDialog, amount: e.target.value })}
                placeholder={t('subscriptionsTab.paymentDialog.amountPlaceholder')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                {t('subscriptionsTab.paymentDialog.methodLabel')}
              </label>
              <Select
                value={paymentDialog.method}
                onValueChange={(value) => setPaymentDialog({ ...paymentDialog, method: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {t(`subscriptionsTab.paymentDialog.methods.${method}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                {t('subscriptionsTab.paymentDialog.referenceLabel')}
              </label>
              <Input
                type="text"
                value={paymentDialog.reference}
                onChange={(e) => setPaymentDialog({ ...paymentDialog, reference: e.target.value })}
                placeholder={t('subscriptionsTab.paymentDialog.referencePlaceholder')}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPaymentDialog({ ...paymentDialog, open: false })}
            >
              {t('dialogs.cancel')}
            </Button>
            <Button className="bg-brand-500 hover:bg-brand-600" onClick={submitPayment}>
              {t('dialogs.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SubscriptionCard({
  restaurant,
  events,
  isPendingRenewal,
  onUpdate,
  onStartTrial,
  onOpenPayment,
  onOpenDate,
  onOpenNotes,
}) {
  const t = useTranslations('dashboard.admin')
  const [historyOpen, setHistoryOpen] = useState(false)
  const state = getSubscriptionState(restaurant)
  const days = daysUntil(restaurant.subscription_expires_at)
  const expiresAt = restaurant.subscription_expires_at

  const quickExtend = (amount, unit) =>
    onUpdate(
      restaurant,
      { subscription_expires_at: extendExpiry(expiresAt, amount, unit) },
      'extended'
    )

  return (
    <div className="rounded-2xl border border-gray-200 p-6 transition-colors hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">{restaurant.name}</h3>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${BADGE_CLASS[state] || BADGE_CLASS.active}`}
        >
          {t(`subscriptionsTab.state.${state}`)}
        </span>
        {isPendingRenewal && (
          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
            {t('subscriptionsTab.renewalRequestedBadge')}
          </span>
        )}
        <Link
          href={`/menu/${restaurant.slug}`}
          target="_blank"
          className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          {t('restaurantsTab.viewLink')}
        </Link>
      </div>

      <div className="mb-4 space-y-1 text-sm text-gray-500 dark:text-gray-400">
        {restaurant.owner_email && (
          <p>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {t('restaurantsTab.ownerLabel')}
            </span>{' '}
            {restaurant.owner_email}
          </p>
        )}
        <p>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {t('subscriptionsTab.expiryLabel')}
          </span>{' '}
          {expiresAt ? (
            <>
              {new Date(expiresAt).toLocaleDateString()}{' '}
              <span className={days != null && days <= DUE_SOON_DAYS ? 'text-warning-600 dark:text-warning-400' : ''}>
                (
                {days != null && days < 0
                  ? t('subscriptionsTab.daysAgo', { count: Math.abs(days) })
                  : t('subscriptionsTab.daysLeft', { count: days ?? 0 })}
                )
              </span>
            </>
          ) : (
            t('subscriptionsTab.unlimited')
          )}
        </p>
        {restaurant.trial_used && (
          <p className="text-xs">{t('subscriptionsTab.trialUsedHint')}</p>
        )}
        {restaurant.subscription_notes && (
          <p className="text-xs italic">
            <span className="font-semibold not-italic text-gray-700 dark:text-gray-300">
              {t('subscriptionsTab.notesLabel')}
            </span>{' '}
            {restaurant.subscription_notes}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <ActionButton onClick={() => quickExtend(7, 'day')}>
          {t('subscriptionsTab.actions.plus7d')}
        </ActionButton>
        <ActionButton onClick={() => quickExtend(1, 'month')}>
          {t('subscriptionsTab.actions.plus1m')}
        </ActionButton>
        <ActionButton onClick={() => quickExtend(3, 'month')}>
          {t('subscriptionsTab.actions.plus3m')}
        </ActionButton>
        <ActionButton onClick={() => quickExtend(1, 'year')}>
          {t('subscriptionsTab.actions.plus1y')}
        </ActionButton>
        <ActionButton onClick={onOpenDate}>{t('subscriptionsTab.actions.setDate')}</ActionButton>

        <ActionButton tone="success" onClick={onOpenPayment}>
          {t('subscriptionsTab.actions.markPaid')}
        </ActionButton>
        <ActionButton onClick={onStartTrial}>
          {t('subscriptionsTab.actions.startTrial')}
        </ActionButton>
        <ActionButton
          onClick={() =>
            onUpdate(
              restaurant,
              { subscription_expires_at: null, subscription_status: 'active' },
              'unlimitedGranted'
            )
          }
        >
          {t('subscriptionsTab.actions.grantUnlimited')}
        </ActionButton>
        <ActionButton onClick={onOpenNotes}>{t('subscriptionsTab.actions.editNotes')}</ActionButton>

        {state === 'suspended' ? (
          <ActionButton
            tone="success"
            onClick={() => onUpdate(restaurant, { subscription_status: 'active' }, 'unsuspended')}
          >
            {t('subscriptionsTab.actions.unsuspend')}
          </ActionButton>
        ) : (
          <ActionButton
            tone="error"
            onClick={() => onUpdate(restaurant, { subscription_status: 'suspended' }, 'suspended')}
          >
            {t('subscriptionsTab.actions.suspend')}
          </ActionButton>
        )}
      </div>

      {events && events.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {historyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {historyOpen
              ? t('subscriptionsTab.history.hide')
              : t('subscriptionsTab.history.show', { count: events.length })}
          </button>
          {historyOpen && (
            <ul className="mt-2 space-y-1.5">
              {events.map((event) => (
                <HistoryEntry key={event.id} event={event} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function HistoryEntry({ event }) {
  const t = useTranslations('dashboard.admin')
  const actionLabel = t.has(`subscriptionsTab.history.actions.${event.action}`)
    ? t(`subscriptionsTab.history.actions.${event.action}`)
    : event.action
  const details = event.details || {}
  const bits = []
  if (details.amount) bits.push(t('subscriptionsTab.history.amountBit', { amount: details.amount }))
  if (details.method) {
    bits.push(
      t.has(`subscriptionsTab.paymentDialog.methods.${details.method}`)
        ? t(`subscriptionsTab.paymentDialog.methods.${details.method}`)
        : details.method
    )
  }
  if (details.reference) {
    bits.push(t('subscriptionsTab.history.referenceBit', { reference: details.reference }))
  }

  return (
    <li className="text-xs text-gray-500 dark:text-gray-400">
      <span className="font-semibold text-gray-700 dark:text-gray-300">{actionLabel}</span>
      {bits.length > 0 && <span> — {bits.join(' · ')}</span>}
      <span className="block text-[11px] text-gray-400 dark:text-gray-500">
        {new Date(event.created_at).toLocaleString()}
        {event.actor_email ? ` · ${event.actor_email}` : ''}
      </span>
    </li>
  )
}

function ActionButton({ children, onClick, tone = 'neutral' }) {
  const toneClass = {
    neutral:
      'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
    success:
      'bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400',
    error:
      'bg-error-50 text-error-700 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400',
  }[tone]

  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${toneClass}`}
    >
      {children}
    </button>
  )
}
