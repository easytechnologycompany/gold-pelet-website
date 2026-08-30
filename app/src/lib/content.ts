import type { Str } from './i18n'

/**
 * Every user-facing string on the site, keyed. Ported from the `data-ar` /
 * `data-ku` / `data-tr` attributes on the approved index.html.
 *
 * NOTE: the ku/tr copy is a first pass and wants a native review before
 * launch — see docs/handoff.md in the design repo.
 */
export const copy = {
  brand: { en: 'Gold Pelet' },

  ariaPrimary: { en: 'Primary', ar: 'رئيسي', ku: 'سەرەکی', tr: 'Birincil' },
  ariaLanguage: { en: 'Language', ar: 'اللغة', ku: 'زمان', tr: 'Dil' },
  ariaAppearance: {
    en: 'Switch appearance',
    ar: 'تبديل المظهر',
    ku: 'گۆڕینی ڕوخسار',
    tr: 'Görünümü değiştir',
  },
  filmAlt: {
    en: 'Pellet chips frying in oil',
    ar: 'رقائق البيليت أثناء القلي في الزيت',
    ku: 'چیپسی پێلێت لە زەیتدا سوور دەکرێتەوە',
    tr: 'Yağda kızaran pelet cips',
  },
  /* The company name itself is in the logo beside this, so the label is only
     the connective phrase. ku and tr are a first pass, as the note at the top
     of this file says of the rest. */
  poweredBy: {
    en: 'Powered by',
    ar: 'بدعم من',
    ku: 'بە پاڵپشتی',
    tr: 'Geliştiren',
  },
  easytechAlt: {
    en: 'Easy Technology Company',
    ar: 'Easy Technology Company',
    ku: 'Easy Technology Company',
    tr: 'Easy Technology Company',
  },
  railHint: {
    en: 'Scroll to browse',
    ar: 'اسحب للتصفّح',
    ku: 'بۆ گەڕان بیجوڵێنە',
    tr: 'Gezinmek için kaydırın',
  },

  // ---- 404 ----
  nfTitle: { en: 'Page not found', ar: 'الصفحة غير موجودة', ku: 'پەڕەکە نەدۆزرایەوە', tr: 'Sayfa bulunamadı' },
  nfBack: { en: 'Back to Gold Pelet', ar: 'العودة إلى گولد بيليت', ku: 'گەڕانەوە بۆ گۆڵد پێلێت', tr: "Gold Pelet'e dön" },
} satisfies Record<string, Str>

export type CopyKey = keyof typeof copy
