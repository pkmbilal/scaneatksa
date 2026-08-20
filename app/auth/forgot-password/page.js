'use client'

import { supabaseBrowser } from "@/lib/supabase/client";

const supabase = supabaseBrowser();

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, ArrowLeft } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')

  // Hide navbar on this page
  useEffect(() => {
    document.body.classList.add('hide-navbar')
    return () => document.body.classList.remove('hide-navbar')
  }, [])

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage(t('forgotPassword.successMessage'))
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
                <Mail className="h-8 w-8 text-green-600" />
              </div>

              {/* Title */}
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('forgotPassword.title')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t('forgotPassword.subtitle')}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                />

                {error && (
                  <p className="text-sm text-destructive text-start">{error}</p>
                )}

                {message && (
                  <p className="text-sm text-green-600 text-start">{message}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-primary hover:bg-green-600 text-white"
                >
                  {loading ? t('forgotPassword.sending') : t('forgotPassword.sendEmail')}
                </Button>
              </form>

              {/* Back to login */}
              <div className="pt-2">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition"
                >
                  <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
                  {t('forgotPassword.backToLogin')}
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
              <Mail className="h-8 w-8 text-green-600" />
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {t('forgotPassword.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('forgotPassword.subtitle')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder={t('forgotPassword.emailPlaceholder')}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
              />

              {error && (
                <p className="text-sm text-destructive text-start">{error}</p>
              )}

              {message && (
                <p className="text-sm text-green-600 text-start">{message}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-primary hover:bg-green-600 text-white"
              >
                {loading ? t('forgotPassword.sending') : t('forgotPassword.sendEmail')}
              </Button>
            </form>

            {/* Back to login */}
            <div className="pt-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition"
              >
                <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
