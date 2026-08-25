'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { STATUS_TINTS, CHANNEL_META, channelTint, pillClass, REVENUE_STATUSES } from '@/lib/orderStatus'
import { submitReview } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import StarRating from '@/components/reviews/StarRating'

export default function OrdersTab({ orders, reviews = [], userId }) {
  const t = useTranslations('dashboard.customer')

  const [reviewingOrderId, setReviewingOrderId] = useState(null)
  const [formRating, setFormRating] = useState(0)
  const [formComment, setFormComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return iso
    }
  }

  const openReviewForm = (order, existingReview) => {
    setReviewingOrderId(order.id)
    setFormRating(existingReview?.rating || 0)
    setFormComment(existingReview?.comment || '')
  }

  const closeReviewForm = () => setReviewingOrderId(null)

  const handleSubmitReview = async (order) => {
    if (!formRating) return
    setSubmitting(true)
    const { error } = await submitReview({
      restaurantId: order.restaurant_id,
      orderId: order.id,
      rating: formRating,
      comment: formComment,
    })
    setSubmitting(false)

    if (error) {
      toast.error(t('ordersTab.review.error'))
      return
    }

    toast.success(t('ordersTab.review.success'))
    window.dispatchEvent(
      new CustomEvent('reviews:changed', { detail: { userId, restaurantId: order.restaurant_id } })
    )
    closeReviewForm()
  }

  if (!orders?.length) {
    return <div className="py-12 text-center text-gray-500 dark:text-gray-400">{t('ordersTab.empty')}</div>
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const tableNum = o?.restaurant_tables?.table_number
        const where =
          o.channel === 'dine_in'
            ? t('ordersTab.table', { number: tableNum ?? '?' })
            : o.channel === 'delivery'
            ? t('ordersTab.delivery')
            : t('ordersTab.pickup')
        const meta = CHANNEL_META[o.channel] || CHANNEL_META.dine_in
        const ChannelIcon = meta.icon

        const canReview = REVENUE_STATUSES.includes(o.status)
        const existingReview = reviews.find((r) => r.order_id === o.id)
        const isReviewing = reviewingOrderId === o.id

        return (
          <div
            key={o.id}
            className={`flex flex-col gap-3 rounded-2xl border border-l-4 border-gray-200 bg-white p-4 shadow-theme-xs transition-all duration-200 hover:border-gray-300 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700 ${meta.accent}`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                title={where}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.badge}`}
              >
                <ChannelIcon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-800 dark:text-white/90">
                    {o.restaurants?.name || t('ordersTab.orderFallback')}
                  </p>
                  <span className={`${pillClass} ${channelTint}`}>{where}</span>
                  <span className={`${pillClass} ${STATUS_TINTS[o.status] || STATUS_TINTS.new}`}>
                    {t.has(`status.${o.status}`) ? t(`status.${o.status}`) : o.status}
                  </span>
                </div>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(o.created_at)} • {t('ordersTab.totalLabel', { amount: Number(o.total || 0).toFixed(2) })}
                </p>

                {o.order_items?.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {o.order_items.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>SAR {(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {o.notes && (
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-gray-800 dark:text-white/90">{t('ordersTab.notes')}</span> {o.notes}
                  </p>
                )}

                {canReview && (
                  <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                    {isReviewing ? (
                      <div className="space-y-2">
                        <StarRating value={formRating} mode="input" onChange={setFormRating} size="lg" />
                        <Textarea
                          value={formComment}
                          onChange={(e) => setFormComment(e.target.value)}
                          placeholder={t('ordersTab.review.commentPlaceholder')}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={submitting || !formRating}
                            onClick={() => handleSubmitReview(o)}
                          >
                            {submitting ? t('ordersTab.review.submitting') : t('ordersTab.review.submit')}
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={closeReviewForm}>
                            {t('ordersTab.review.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : existingReview ? (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <StarRating value={existingReview.rating} size="sm" />
                          {existingReview.comment && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{existingReview.comment}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openReviewForm(o, existingReview)}
                        >
                          {t('ordersTab.review.edit')}
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" size="sm" variant="outline" onClick={() => openReviewForm(o, null)}>
                        {t('ordersTab.review.rate')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
