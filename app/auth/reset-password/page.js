'use client'

import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function ResetPasswordPage() {
  const t = useTranslations('auth')

  // Hide navbar on this page
  useEffect(() => {
    document.body.classList.add('hide-navbar')
    return () => document.body.classList.remove('hide-navbar')
  }, [])

  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError(t('resetPassword.passwordTooShort'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch'))
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    }

    setLoading(false)
  }

  return (
    <>
      <LanguageSwitcher className="fixed top-4 end-4 z-50" />

      {/* MOBILE wrapper */}
      <div className="md:hidden flex min-h-screen items-center justify-center bg-white px-0">
        <div className="w-full min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md rounded-3xl shadow-none border-0">
            <CardContent className="p-8 text-center space-y-6">
              {/* Icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Lock className="h-8 w-8 text-green-600" />
              </div>

              {/* Title */}
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('resetPassword.title')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t('resetPassword.subtitle')}
                </p>
              </div>

              {/* Form */}
              {!success ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password */}
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('resetPassword.newPasswordPlaceholder')}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-xl pe-10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-orange-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 rounded-xl pe-10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-orange-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-start">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-primary hover:bg-green-600 text-white"
                  >
                    {loading ? t('resetPassword.updating') : t('resetPassword.resetButton')}
                  </Button>
                </form>
              ) : (
                <div className="space-y-3">
                  <p className="text-green-600 font-medium">
                    {t('resetPassword.successMessage')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('resetPassword.redirecting')}
                  </p>
                </div>
              )}

              {/* Back to login */}
              <div className="pt-2">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-orange-600 transition"
                >
                  <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
                  {t('resetPassword.backToLogin')}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DESKTOP wrapper (green gradient bg) */}
      <div className="hidden md:flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
        <Card className="w-full max-w-md rounded-3xl shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Lock className="h-8 w-8 text-green-600" />
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {t('resetPassword.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('resetPassword.subtitle')}
              </p>
            </div>

            {/* Form */}
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('resetPassword.newPasswordPlaceholder')}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl pe-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-orange-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 rounded-xl pe-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-orange-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {error && (
                  <p className="text-sm text-destructive text-start">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-primary hover:bg-green-600 text-white"
                >
                  {loading ? t('resetPassword.updating') : t('resetPassword.resetButton')}
                </Button>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-green-600 font-medium">
                  {t('resetPassword.successMessage')}
                </p>
                <p className="text-sm text-muted-foreground">{t('resetPassword.redirecting')}</p>
              </div>
            )}

            {/* Back to login */}
            <div className="pt-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-orange-600 transition"
              >
                <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
                {t('resetPassword.backToLogin')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
