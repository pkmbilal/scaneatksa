'use client'

// CR deadline reminder for restaurants approved without a Commercial
// Registration. The owner has CR_DEADLINE_DAYS from approval to submit the CR
// number + certificate; past that, the public menu goes dark (enforced in
// is_restaurant_published + restaurants_read_published) until an admin
// verifies the submission. Like SubscriptionBanner, the owner is never locked
// out of the dashboard -- this is where they upload.

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, Clock, FileUp, Hourglass, Loader2 } from 'lucide-react'

import { supabaseBrowser } from '@/lib/supabase/client'
import { uploadDocumentToR2, UploadValidationError } from '@/lib/r2/upload'
import { CR_RE, DOC_TYPES, MAX_DOC_BYTES, getCrState, normalizeDigits } from '@/lib/restaurantVerification'

const supabase = supabaseBrowser()

const TONE = {
  error: 'border-error-200 bg-error-50 text-error-800 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200',
  warning:
    'border-warning-200 bg-warning-50 text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-200',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
}

// Within this many days of the deadline the reminder turns from info to warning.
const URGENT_DAYS = 3

function submitErrorKey(error) {
  const text = `${error?.message || ''} ${error?.details || ''}`
  if (text.includes('restaurants_cr_number_key')) return 'crAlreadyUsed'
  if (text.includes('cr_number_format')) return 'invalidCr'
  if (text.includes('invalid_document_path')) return 'uploadFailed'
  return null
}

export default function CrReminderBanner({ restaurant, onSubmitted }) {
  const t = useTranslations('dashboard.owner')
  const [crNumber, setCrNumber] = useState(restaurant?.cr_number || '')
  const [file, setFile] = useState(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')

  if (!restaurant) return null
  const cr = getCrState(restaurant)
  if (cr.state === 'none' || cr.state === 'verified') return null

  let tone
  let Icon
  let message
  if (cr.state === 'underReview') {
    tone = cr.overdue ? 'error' : 'info'
    Icon = Hourglass
    message = cr.overdue ? t('crReminder.underReviewOverdue') : t('crReminder.underReview')
  } else if (cr.state === 'overdue') {
    tone = 'error'
    Icon = AlertTriangle
    message = t('crReminder.overdue')
  } else {
    tone = cr.daysLeft <= URGENT_DAYS ? 'warning' : 'info'
    Icon = cr.daysLeft <= URGENT_DAYS ? AlertTriangle : Clock
    message = t('crReminder.due', { count: cr.daysLeft })
  }

  const fail = (key) => {
    setError(t(`crReminder.errors.${key}`))
    setSubmitting(false)
    setProgress(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const normalized = normalizeDigits(crNumber)
    if (!CR_RE.test(normalized)) return fail('invalidCr')
    if (!file) return fail('missingDocument')
    if (!DOC_TYPES.includes(file.type)) return fail('docInvalidType')
    if (file.size > MAX_DOC_BYTES) return fail('docTooLarge')

    setSubmitting(true)

    let path
    try {
      setProgress(0)
      path = await uploadDocumentToR2(file, { onProgress: setProgress })
    } catch (uploadErr) {
      if (uploadErr instanceof UploadValidationError) {
        return fail(uploadErr.message === 'tooLarge' ? 'docTooLarge' : 'docInvalidType')
      }
      console.error('CR upload failed:', uploadErr)
      return fail('uploadFailed')
    }
    setProgress(null)

    const { error: rpcError } = await supabase.rpc('owner_submit_cr', {
      p_cr_number: normalized,
      p_document_path: path,
    })
    if (rpcError) {
      const key = submitErrorKey(rpcError)
      if (key) return fail(key)
      setError(rpcError.message)
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    setFile(null)
    setFileInputKey((k) => k + 1)
    onSubmitted?.()
  }

  const showForm = cr.state !== 'underReview'
  const inputClass =
    'w-full rounded-lg border border-white/60 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 dark:border-white/10 dark:bg-gray-900 dark:text-white/90'

  return (
    <div className={`mb-6 rounded-2xl border p-4 ${TONE[tone]}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t('crReminder.title')}</p>
          <p className="mt-0.5 text-sm">{message}</p>

          {showForm && (
            <form onSubmit={handleSubmit} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="block text-xs font-semibold">
                {t('crReminder.crNumber')}
                <input
                  value={crNumber}
                  onChange={(e) => setCrNumber(e.target.value)}
                  placeholder="1010123456"
                  inputMode="numeric"
                  dir="ltr"
                  disabled={submitting}
                  className={`mt-1 ${inputClass}`}
                />
              </label>
              <label className="block text-xs font-semibold">
                {t('crReminder.document')}
                <input
                  key={fileInputKey}
                  type="file"
                  accept={DOC_TYPES.join(',')}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={submitting}
                  className={`mt-1 ${inputClass} file:me-2 file:rounded file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-xs dark:file:bg-white/10 dark:file:text-white`}
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                {submitting
                  ? progress !== null
                    ? t('crReminder.uploading', { percent: progress })
                    : t('crReminder.submitting')
                  : t('crReminder.submit')}
              </button>
              <p className="text-xs opacity-80 sm:col-span-3">{t('crReminder.documentHelp')}</p>
              {error && <p className="text-xs font-semibold text-error-700 dark:text-error-300 sm:col-span-3">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
