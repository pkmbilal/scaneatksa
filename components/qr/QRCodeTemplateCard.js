'use client'

import { forwardRef } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import NextImage from 'next/image'

const QRCodeTemplateCard = forwardRef(function QRCodeTemplateCard(
  { selectedTableId, selectedTable, qrCodeUrl },
  ref
) {
  const t = useTranslations('qr.template')
  const showTable = selectedTableId !== 'general' && selectedTable?.table_number

  return (
    <div
      ref={ref}
      className="bg-white"
      style={{
        width: '9cm',
        height: '12cm',
        boxSizing: 'border-box',
      }}
    >
      <Card className="h-full w-full border-border shadow-none rounded-xl">
        <CardContent className="h-full py-4 px-8 flex flex-col items-center justify-between">
          {/* Header */}
          <div className="w-full flex items-center justify-center pt-1 mb-3">
            <NextImage
              src="/logo.svg"
              alt={t('logoAlt')}
              width={180}
              height={50}
              priority
            />
          </div>

          {/* Title */}
          <div className="text-center mb-2">
            <p className="text-md font-semibold text-gray-400 leading-none">
              {t('scanToOrder')}
            </p>
          </div>

          {/* QR */}
          <div className="flex-1 flex items-center justify-center mb-2">
            <div className="rounded-xl border border-border bg-white p-2">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={t('qrCodeAlt')}
                  className="object-contain"
                  style={{ width: '5cm', height: '5cm' }}
                />
              ) : (
                <div
                  className="flex items-center justify-center text-xs text-muted-foreground"
                  style={{ width: '5cm', height: '5cm' }}
                >
                  {t('generating')}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="pb-1 text-center">
            {showTable ? (
              <p className="text-md font-semibold text-foreground">
                {t('table', { tableNumber: selectedTable.table_number })}
              </p>
            ) : (
              <div className="h-[20px]" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

export default QRCodeTemplateCard