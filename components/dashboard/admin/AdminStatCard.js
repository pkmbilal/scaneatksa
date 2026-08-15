// Metric/KPI card, styled after TailAdmin's components/ecommerce/EcommerceMetrics.tsx.

export default function AdminStatCard({ icon: Icon, label, value, tint = 'gray' }) {
  const tints = {
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400',
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    success: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400',
    error: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400',
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${tints[tint] || tints.gray}`}>
        <Icon className="size-6" />
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{value}</h4>
      </div>
    </div>
  )
}
