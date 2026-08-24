'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { signUp } from '@/lib/auth/client'
import LanguageSwitcher from '@/components/LanguageSwitcher'

import { Pizza, MailCheck } from 'lucide-react'

// shadcn
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  const t = useTranslations('auth')

  // Hide navbar on this page
  useEffect(() => {
    document.body.classList.add('hide-navbar')
    return () => document.body.classList.remove('hide-navbar')
  }, [])

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ✅ dialog state
  const [otpDialogOpen, setOtpDialogOpen] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  const router = useRouter()

  const goVerify = (email) => {
    router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(t('signup.passwordMismatch'))
      setLoading(false)
      return
    }

    // Validate password pattern
    // Min 6 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/

    if (!passwordRegex.test(formData.password)) {
      setError(t('signup.passwordRequirements'))
      setLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.fullName
      )

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      // ✅ Open shadcn dialog instead of browser alert
      setPendingEmail(formData.email)
      setOtpDialogOpen(true)
      setLoading(false)
    } catch (err) {
      setError(t('signup.unexpectedError', { message: err.message }))
      setLoading(false)
    }
  }

  return (
    <>
      <LanguageSwitcher className="fixed top-4 end-4 z-50" />

      {/* ✅ OTP Success Dialog */}
      <Dialog
        open={otpDialogOpen}
        onOpenChange={(open) => {
          setOtpDialogOpen(open)
          // optional: if they close it, still take them to verify
          // if (!open && pendingEmail) goVerify(pendingEmail)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-50">
                <MailCheck className="h-5 w-5 text-green-600" />
              </span>
              {t('signup.otpDialog.title')}
            </DialogTitle>
            <DialogDescription className="mt-2">
              {t.rich('signup.otpDialog.description', {
                email: pendingEmail,
                bold: (chunks) => (
                  <span className="font-semibold text-gray-900">{chunks}</span>
                ),
              })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOtpDialogOpen(false)}
            >
              {t('signup.otpDialog.close')}
            </Button>
            <Button
              className="bg-primary hover:bg-green-600"
              onClick={() => goVerify(pendingEmail)}
            >
              {t('signup.otpDialog.continue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MOBILE wrapper */}
      <div className="md:hidden min-h-screen bg-white flex items-center justify-center px-0">
        <div className="w-full min-h-screen p-8 flex flex-col justify-center">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="text-5xl mb-4">
              <Pizza size={48} color="#00c951" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {t('signup.title')}
            </h1>
            <p className="text-gray-600">{t('signup.subtitle', { brand: 'ScanEat' })}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('signup.fullNameLabel')}
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder={t('signup.fullNamePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('signup.emailLabel')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder={t('signup.emailPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('signup.passwordLabel')}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={t('signup.passwordPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('signup.confirmPasswordLabel')}
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder={t('signup.confirmPasswordPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 cursor-pointer"
            >
              {loading ? t('signup.creatingAccount') : t('signup.createAccount')}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {t('signup.alreadyHaveAccount')}{' '}
              <Link
                href="/auth/login"
                className="text-primary hover:text-green-600 font-semibold"
              >
                {t('signup.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* DESKTOP wrapper */}
      <div className="hidden md:flex min-h-screen bg-gradient-to-br from-green-50 to-green-100 items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="text-5xl mb-4">
              <Pizza size={48} color="#00c951" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {t('signup.title')}
            </h1>
            <p className="text-gray-600">{t('signup.subtitle', { brand: 'ScanEat' })}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('signup.fullNameLabel')}
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder={t('signup.fullNamePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('signup.emailLabel')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder={t('signup.emailPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('signup.passwordLabel')}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={t('signup.passwordPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('signup.confirmPasswordLabel')}
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder={t('signup.confirmPasswordPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 cursor-pointer"
            >
              {loading ? t('signup.creatingAccount') : t('signup.createAccount')}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {t('signup.alreadyHaveAccount')}{' '}
              <Link
                href="/auth/login"
                className="text-primary hover:text-green-600 font-semibold"
              >
                {t('signup.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
