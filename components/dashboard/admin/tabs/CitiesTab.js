'use client'

// Cities CRUD. Same data/handlers as the original page.js.

import { useEffect, useState } from 'react'
import { Pencil, Trash2, Ban, CheckCircle, X } from 'lucide-react'

export default function CitiesTab({
  cities,
  cityName,
  setCityName,
  cityLoading,
  cityError,
  onAddCity,
  onRename,
  onToggle,
  onDelete,
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-3">Add City</h3>

        <form onSubmit={onAddCity} className="flex flex-col sm:flex-row gap-3">
          <input
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            placeholder="e.g., Riyadh"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300"
          />

          <button
            type="submit"
            disabled={cityLoading}
            className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-400"
          >
            {cityLoading ? 'Adding...' : 'Add'}
          </button>
        </form>

        {cityError && (
          <div className="mt-3 bg-error-50 border border-error-200 text-error-700 dark:bg-error-500/10 dark:border-error-800 dark:text-error-400 px-4 py-3 rounded-lg">
            {cityError}
          </div>
        )}
      </div>

      {cities.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">No cities yet. Add your first one.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <Pill key={c.id} item={c} onRename={onRename} onToggle={onToggle} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Pill({ item, onRename, onToggle, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => setName(item.name), [item.name])

  const save = async () => {
    setError('')
    setSaving(true)

    const res = await onRename(item.id, name)

    setSaving(false)
    if (!res?.ok) {
      setError(res?.message || 'Failed to rename')
      return
    }
    setEditing(false)
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
        item.is_active
          ? 'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
          : 'bg-error-50 border-error-200 dark:bg-error-500/10 dark:border-error-800'
      }`}
    >
      {!editing ? (
        <>
          <span
            className={`text-sm font-semibold ${
              item.is_active ? 'text-gray-800 dark:text-gray-200' : 'text-error-700 dark:text-error-400'
            }`}
          >
            {item.name}
          </span>

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="p-1 rounded-full text-gray-500 hover:text-gray-800 hover:bg-white/70 dark:hover:bg-white/10 transition cursor-pointer"
            title="Rename"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onToggle(item)}
            className={`p-1 rounded-full transition cursor-pointer ${
              item.is_active
                ? 'text-warning-600 hover:text-warning-700 hover:bg-white/70 dark:hover:bg-white/10'
                : 'text-success-600 hover:text-success-700 hover:bg-white/70 dark:hover:bg-white/10'
            }`}
            title={item.is_active ? 'Disable' : 'Enable'}
          >
            {item.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => onDelete(item)}
            className="p-1 rounded-full text-error-600 hover:text-error-700 hover:bg-white/70 dark:hover:bg-white/10 transition cursor-pointer"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-32 text-sm px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 bg-white dark:bg-gray-900 dark:text-white"
            autoFocus
          />

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="p-1 rounded-full text-success-600 hover:text-success-700 hover:bg-white/70 dark:hover:bg-white/10 transition disabled:opacity-50"
            title="Save"
          >
            <CheckCircle className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setName(item.name)
              setError('')
            }}
            className="p-1 rounded-full text-gray-500 hover:text-gray-800 hover:bg-white/70 dark:hover:bg-white/10 transition"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}

      {error && <span className="text-xs text-error-600 dark:text-error-400 ml-1">{error}</span>}
    </div>
  )
}
