'use client'

import { useTranslations } from 'next-intl'
import { STATUS_TINTS, CHANNEL_META, channelTint, pillClass } from '@/lib/orderStatus'

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
        const meta = CHANNEL_META[o.channel] || CHANNEL_META.dine_in
        const ChannelIcon = meta.icon

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
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
