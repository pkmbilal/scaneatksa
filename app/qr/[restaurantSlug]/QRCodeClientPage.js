'use client'
import { supabaseBrowser } from "@/lib/supabase/client";
const supabase = supabaseBrowser();

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { toPng } from 'html-to-image'
import { useTranslations } from 'next-intl'
import { Download, Printer, ExternalLink, QrCode, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import QRCodeTemplateCard from '@/components/qr/QRCodeTemplateCard'

export default function QRCodeClientPage({ restaurantSlug }) {
  const t = useTranslations('qr.clientPage')
  const router = useRouter()
  const searchParams = useSearchParams()

  const slug = decodeURIComponent(String(restaurantSlug || '')).trim()

  const [restaurant, setRestaurant] = useState(null)
  const [tables, setTables] = useState([])
  const [selectedTableId, setSelectedTableId] = useState('general')

  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [menuUrl, setMenuUrl] = useState('')

  const [loading, setLoading] = useState(true)
  const [roleChecked, setRoleChecked] = useState(false)

  // Ref for export
  const templateRef = useRef(null)

  const selectedTable = useMemo(() => {
    if (selectedTableId === 'general') return null
    return tables.find((tbl) => String(tbl.id) === String(selectedTableId)) || null
  }, [selectedTableId, tables])

  const encodedUrl = useMemo(() => {
    if (!slug) return ''
    if (typeof window === 'undefined') return ''

    const base = `${window.location.origin}/menu/${slug}`
    if (!selectedTable) return base

    if (selectedTable.code) {
      return `${base}?t=${encodeURIComponent(selectedTable.code)}`
    }
    return `${base}?table=${encodeURIComponent(selectedTable.table_number)}`
  }, [slug, selectedTable])

  useEffect(() => {
    let mounted = true

    async function guardAndLoad() {
      try {
        if (!slug) {
          toast.error(t('errors.missingSlug'))
          router.push('/dashboard')
          return
        }

        if (mounted) {
          setLoading(true)
          setRoleChecked(false)
        }

        const { data: userRes } = await supabase.auth.getUser()
        const user = userRes?.user

        if (!user) {
          toast.error(t('errors.loginRequired'))
          router.push('/auth/login')
          return
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, role')
          .eq('id', user.id)
          .maybeSingle()

        const role = String(profile?.role || '').toLowerCase()
        const isAdmin = role === 'admin'
        const isOwner = role === 'owner'

        if (!isAdmin && !isOwner) {
          toast.error(t('errors.accessDenied', { role: role || '(missing)' }))
          router.push('/dashboard')
          return
        }

        const { data: rest } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()

        if (!rest) {
          toast.error(t('errors.restaurantNotFound', { slug }))
          router.push('/dashboard')
          return
        }

        // Ownership check (admin bypass)
        if (!isAdmin) {
          const uid = user.id
          const email = (user.email || '').toLowerCase().trim()
          const ownerId = rest.owner_id
          const ownerEmail = (rest.owner_email || '').toLowerCase().trim()

          const ownerEmailMatch = ownerEmail && email && ownerEmail === email

          if (!ownerId && ownerEmailMatch) {
            const { error: claimErr } = await supabase
              .from('restaurants')
              .update({ owner_id: uid })
              .eq('id', rest.id)

            if (!claimErr) rest.owner_id = uid
          }

          const finalOwnerOk =
            (rest.owner_id && rest.owner_id === uid) || ownerEmailMatch

          if (!finalOwnerOk) {
            toast.error(t('errors.notOwner'))
            router.push('/dashboard/owner')
            return
          }
        }

        if (mounted) setRestaurant(rest)

        const { data: tableRows, error: tableErr } = await supabase
          .from('restaurant_tables')
          .select('id, table_number, code, is_active')
          .eq('restaurant_id', rest.id)
          .order('table_number', { ascending: true })

        if (tableErr) {
          console.log('restaurant_tables error:', tableErr)
          if (mounted) setTables([])
        } else {
          const activeTables = (tableRows || []).filter((tbl) => tbl.is_active !== false)
          if (mounted) setTables(activeTables)
        }
      } catch (e) {
        console.error(e)
        toast.error(t('errors.generic'))
        router.push('/dashboard')
      } finally {
        if (mounted) {
          setRoleChecked(true)
          setLoading(false)
        }
      }
    }

    guardAndLoad()
    return () => {
      mounted = false
    }
  }, [slug, router, t])

  // ✅ NEW: Auto-select table based on URL query
  // Supported:
  // - /dashboard/qr/[slug]?tableId=<uuid>
  // - /dashboard/qr/[slug]?code=<tableCode>
  useEffect(() => {
    const tableId = searchParams?.get('tableId')
    if (tableId) {
      setSelectedTableId(tableId)
      return
    }

    const code = searchParams?.get('code')
    if (code && tables?.length) {
      const match = tables.find((tbl) => String(tbl.code) === String(code))
      if (match) setSelectedTableId(match.id)
    }
  }, [searchParams, tables])

  // Generate QR whenever encodedUrl changes
  useEffect(() => {
    let mounted = true

    async function generate() {
      if (!encodedUrl) return
      setMenuUrl(encodedUrl)

      try {
        const qr = await QRCode.toDataURL(encodedUrl, {
          width: 1200,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
        })
        if (mounted) setQrCodeUrl(qr)
      } catch (err) {
        console.error('QR error:', err)
        toast.error(t('errors.qrGenerationFailed'))
      }
    }

    generate()
    return () => {
      mounted = false
    }
  }, [encodedUrl, t])

  // ✅ ensure fonts & images are ready before exporting
  const ensureAssetsReady = async () => {
    try {
      if (document?.fonts?.ready) {
        await document.fonts.ready
      }
    } catch {}

    await new Promise((resolve) => {
      const img = new window.Image()
      img.onload = resolve
      img.onerror = resolve
      img.src = '/logo.png'
    })
  }

  const handleDownloadTemplate = async () => {
    try {
      if (!templateRef.current) return
      if (!qrCodeUrl) {
        toast.error(t('errors.qrNotReady'))
        return
      }

      await ensureAssetsReady()

      const suffix =
        selectedTableId === 'general'
          ? 'menu'
          : `table-${String(selectedTable?.table_number ?? 'x')}`

      const node = templateRef.current

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 4,
        backgroundColor: '#ffffff',
      })

      const a = document.createElement('a')
      a.download = `${slug}-${suffix}-template.png`
      a.href = dataUrl
      a.click()

      toast.success(t('toast.templateDownloaded'))
    } catch (e) {
      console.error(e)
      toast.error(t('errors.downloadFailed'))
    }
  }

  const handlePrint = () => window.print()

  if (loading || !roleChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <span className="text-2xl">⚠️</span> {t('notFound.title')}
            </CardTitle>
            <CardDescription>
              {t('notFound.description', { slug })}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">{t('notFound.backToDashboard')}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-8 print:hidden">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-2xl flex items-center gap-2">
              <QrCode className="h-6 w-6 text-primary" />
              {restaurant.name}
            </CardTitle>
            <CardDescription>
              {selectedTableId === 'general'
                ? t('universalMenuQr')
                : t('tableSpecificQr', { tableNumber: selectedTable?.table_number })}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className="w-full flex items-center justify-center">
              <div className="md:w-1/2 w-full space-y-2">
                <label className="text-sm font-medium text-foreground">{t('qrTypeLabel')}</label>
                <select
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                >
                  <option value="general">{t('generalMenuQrOption')}</option>
                  {tables.map((tbl) => (
                    <option key={tbl.id} value={tbl.id}>
                      {t('tableOption', { tableNumber: tbl.table_number })}
                    </option>
                  ))}
                </select>

                {tables.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t('noTables')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="rounded-xl bg-white p-4 overflow-auto max-w-full">
                <QRCodeTemplateCard
                  ref={templateRef}
                  restaurant={restaurant}
                  selectedTableId={selectedTableId}
                  selectedTable={selectedTable}
                  qrCodeUrl={qrCodeUrl}
                  menuUrl={menuUrl}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center md:pt-4 pb-8">
            <Button
              onClick={handleDownloadTemplate}
              className="w-full sm:w-auto gap-2"
              size="lg"
              disabled={!qrCodeUrl}
            >
              <Download className="h-4 w-4" />
              {t('downloadTemplate')}
            </Button>

            <Button
              onClick={handlePrint}
              variant="outline"
              className="w-full sm:w-auto gap-2"
              size="lg"
              disabled={!qrCodeUrl}
            >
              <Printer className="h-4 w-4" />
              {t('printTemplate')}
            </Button>

            <Button asChild variant="secondary" className="w-full sm:w-auto gap-2" size="lg">
              <Link href={menuUrl || `/menu/${slug}`} target="_blank">
                <ExternalLink className="h-4 w-4" />
                {t('previewMenu')}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div id="print-root" className="hidden print:block">
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div style={{ width: '9cm', height: '12cm' }}>
            <QRCodeTemplateCard
              restaurant={restaurant}
              selectedTableId={selectedTableId}
              selectedTable={selectedTable}
              qrCodeUrl={qrCodeUrl}
              menuUrl={menuUrl}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            visibility: hidden !important;
          }

          #print-root,
          #print-root * {
            visibility: visible !important;
          }

          #print-root {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}