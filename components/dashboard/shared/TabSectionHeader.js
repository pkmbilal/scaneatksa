// Shared section header card used at the top of every dashboard tab
// (Owner/Admin/Customer): title + optional description on the left, an
// optional right-aligned action button (e.g. "Add Item", "Add Category").

export default function TabSectionHeader({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">{title}</h2>
          {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
