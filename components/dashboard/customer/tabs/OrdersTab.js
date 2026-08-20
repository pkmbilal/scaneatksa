'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle2 } from 'lucide-react'
import { STATUS_TINTS, CUSTOMER_PROGRESS_STEPS } from '@/lib/orderStatus'

const pillClass = 'text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap'

function ProgressLine({ status }) {
  const t = useTranslations('dashboard.customer')
  const statusLabel = (key) => (t.has(`status.${key}`) ? t(`status.${key}`) : key)

  // Cancelled orders don't fit the linear received → preparing → delivered
  // line -- show a plain status pill instead.
  if (!CUSTOMER_PROGRESS_STEPS.includes(status)) {
    return (
      <span className={`${pillClass} ${STATUS_TINTS[status] || STATUS_TINTS.new}`}>
        {statusLabel(status)}
      </span>
    )
  }

  const currentIndex = CUSTOMER_PROGRESS_STEPS.indexOf(status)

  return (
    <div className="flex items-center gap-1.5">
      {CUSTOMER_PROGRESS_STEPS.map((step, i) => {
        const done = i <= currentIndex
        return (
          <div key={step} className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                done
                  ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
              }`}
            >
              {done && <CheckCircle2 className="h-3 w-3" />}
              {statusLabel(step)}
            </div>
            {i < CUSTOMER_PROGRESS_STEPS.length - 1 && (
              <div className={`h-px w-4 ${done ? 'bg-success-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OrdersTab({ orders }) {
  const t = useTranslations('dashboard.customer')

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return iso
    }
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

        return (
          <div key={o.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white/90">
                  {o.restaurants?.name || t('ordersTab.orderFallback')}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {where} • {formatDate(o.created_at)} • SAR {Number(o.total || 0).toFixed(2)}
                </p>
              </div>
              <ProgressLine status={o.status} />
            </div>

            {o.order_items?.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
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
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-gray-800 dark:text-white/90">{t('ordersTab.notes')}</span> {o.notes}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
