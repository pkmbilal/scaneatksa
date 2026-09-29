'use client'

import { forwardRef } from 'react'
import { useTranslations } from 'next-intl'
import NextImage from 'next/image'

// Hard-coded brand colors: the template is exported/printed, so it must not
// follow the app theme (--primary turns gray in dark mode).
const BRAND = '#00c951'
const BRAND_DARK = '#00a347'

const QRCodeTemplateCard = forwardRef(function QRCodeTemplateCard(
  { selectedTableId, selectedTable, qrCodeUrl },
  ref
) {
  const t = useTranslations('qr.template')
  const showTable = selectedTableId !== 'general' && selectedTable?.table_number

  return (
    <div
      ref={ref}
      className="relative overflow-hidden flex flex-col items-center"
      style={{
        width: '9cm',
        height: '12cm',
        boxSizing: 'border-box',
        borderRadius: '16px',
        backgroundColor: BRAND,
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 6px, transparent 6px 14px)',
      }}
    >
      {/* Decorative accents */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          width: '5cm',
          height: '5cm',
          top: '-1.8cm',
          right: '-1.8cm',
          backgroundColor: 'rgba(255,255,255,0.12)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          width: '6cm',
          height: '6cm',
          bottom: '-2.6cm',
          left: '-2.6cm',
          backgroundColor: BRAND_DARK,
          opacity: 0.55,
        }}
      />

      {/* Header band */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{
          backgroundColor: BRAND_DARK,
          padding: '14px 0 20px',
          borderBottomLeftRadius: '50% 22px',
          borderBottomRightRadius: '50% 22px',
        }}
      >
        <div className="rounded-2xl bg-white p-1.5 shadow-md">
          <NextImage
            src="/scaneat-logo.png"
            alt={t('logoAlt')}
            width={72}
            height={72}
            priority
          />
        </div>
      </div>

      {/* Body */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-between px-6 pt-3 pb-4">
        <p
          className="text-center text-base font-semibold text-white leading-none uppercase"
          style={{ letterSpacing: '0.08em' }}
        >
          {t('scanToOrder')}
        </p>

        <div
          className="rounded-2xl bg-white p-2.5"
          style={{
            boxShadow:
              '0 8px 20px rgba(0,0,0,0.18), 0 0 0 4px rgba(255,255,255,0.25)',
          }}
        >
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt={t('qrCodeAlt')}
              className="object-contain"
              style={{ width: '5cm', height: '5cm' }}
            />
          ) : (
            <div
              className="flex items-center justify-center text-xs text-gray-500"
              style={{ width: '5cm', height: '5cm' }}
            >
              {t('generating')}
            </div>
          )}
        </div>

        {showTable ? (
          <div
            className="rounded-full bg-white px-5 py-1 text-base font-bold shadow-md"
            style={{ color: BRAND_DARK }}
          >
            {t('table', { tableNumber: selectedTable.table_number })}
          </div>
        ) : (
          <div className="h-[32px]" />
        )}
      </div>
    </div>
  )
})

export default QRCodeTemplateCard
