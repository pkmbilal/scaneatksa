// Bundled list of Saudi cities. `slug` is the stable, locale-independent value
// stored in restaurants.city / restaurant_requests.city and used in ?city= URLs.
// Names are UI chrome -- localized here, never sourced from Supabase.
export const SAUDI_CITIES = [
  { slug: 'riyadh',         en: 'Riyadh',          ar: 'الرياض' },
  { slug: 'jeddah',         en: 'Jeddah',          ar: 'جدة' },
  { slug: 'mecca',          en: 'Mecca',           ar: 'مكة المكرمة' },
  { slug: 'medina',         en: 'Medina',          ar: 'المدينة المنورة' },
  { slug: 'dammam',         en: 'Dammam',          ar: 'الدمام' },
  { slug: 'al-khobar',      en: 'Al Khobar',       ar: 'الخبر' },
  { slug: 'dhahran',        en: 'Dhahran',         ar: 'الظهران' },
  { slug: 'jubail',         en: 'Jubail',          ar: 'الجبيل' },
  { slug: 'al-ahsa',        en: 'Al-Ahsa (Hofuf)', ar: 'الأحساء' },
  { slug: 'qatif',          en: 'Qatif',           ar: 'القطيف' },
  { slug: 'hafar-al-batin', en: 'Hafar Al-Batin',  ar: 'حفر الباطن' },
  { slug: 'ras-tanura',     en: 'Ras Tanura',      ar: 'رأس تنورة' },
  { slug: 'taif',           en: 'Taif',            ar: 'الطائف' },
  { slug: 'tabuk',          en: 'Tabuk',           ar: 'تبوك' },
  { slug: 'buraidah',       en: 'Buraidah',        ar: 'بريدة' },
  { slug: 'unaizah',        en: 'Unaizah',         ar: 'عنيزة' },
  { slug: 'khamis-mushait', en: 'Khamis Mushait',  ar: 'خميس مشيط' },
  { slug: 'abha',           en: 'Abha',            ar: 'أبها' },
  { slug: 'hail',           en: 'Hail',            ar: 'حائل' },
  { slug: 'najran',         en: 'Najran',          ar: 'نجران' },
  { slug: 'jazan',          en: 'Jazan',           ar: 'جازان' },
  { slug: 'yanbu',          en: 'Yanbu',           ar: 'ينبع' },
  { slug: 'sakaka',         en: 'Sakaka',          ar: 'سكاكا' },
  { slug: 'arar',           en: 'Arar',            ar: 'عرعر' },
  { slug: 'al-bahah',       en: 'Al Bahah',        ar: 'الباحة' },
  { slug: 'qurayyat',       en: 'Qurayyat',        ar: 'القريات' },
  { slug: 'bishah',         en: 'Bishah',          ar: 'بيشة' },
  { slug: 'diriyah',        en: 'Diriyah',         ar: 'الدرعية' },
  { slug: 'al-kharj',       en: 'Al Kharj',        ar: 'الخرج' },
  { slug: 'al-majmaah',     en: "Al Majma'ah",     ar: 'المجمعة' },
  { slug: 'dawadmi',        en: 'Dawadmi',         ar: 'الدوادمي' },
  { slug: 'rabigh',         en: 'Rabigh',          ar: 'رابغ' },
  { slug: 'duba',           en: 'Duba',            ar: 'ضباء' },
]

const CITY_BY_SLUG = Object.fromEntries(SAUDI_CITIES.map((c) => [c.slug, c]))

// Localized display name for a stored slug. Unknown / legacy values fall back to
// the raw string so nothing ever renders blank.
export function cityLabel(slug, locale) {
  if (!slug) return null
  const c = CITY_BY_SLUG[slug]
  if (!c) return slug
  return locale === 'ar' ? c.ar : c.en
}

// SAUDI_CITIES pre-sorted for the active locale (for dropdown option order).
export function citiesForLocale(locale) {
  return [...SAUDI_CITIES].sort((a, b) =>
    cityLabel(a.slug, locale).localeCompare(cityLabel(b.slug, locale), locale)
  )
}
