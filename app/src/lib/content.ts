import type { Str } from './i18n'

/**
 * Every user-facing string on the site, keyed. Ported from the `data-ar` /
 * `data-tr` attributes on the approved index.html.
 *
 * NOTE: the tr copy is a first pass and wants a native review before
 * launch — see docs/handoff.md in the design repo.
 */
export const copy = {
  brand: { en: 'Gold Pelet' },

  ariaPrimary: { en: 'Primary', ar: 'رئيسي', tr: 'Birincil' },
  ariaLanguage: { en: 'Language', ar: 'اللغة', tr: 'Dil' },
  ariaAppearance: {
    en: 'Switch appearance',
    ar: 'تبديل المظهر',
    tr: 'Görünümü değiştir',
  },
  filmAlt: {
    en: 'Pellet chips frying in oil',
    ar: 'رقائق البيليت أثناء القلي في الزيت',
    tr: 'Yağda kızaran pelet cips',
  },
  /* The company name itself is in the logo beside this, so the label is only
     the connective phrase. tr is a first pass, as the note at the top
     of this file says of the rest. */
  poweredBy: {
    en: 'Powered by',
    ar: 'بدعم من',
    tr: 'Geliştiren',
  },
  easytechAlt: {
    en: 'Easy Technology Company',
    ar: 'Easy Technology Company',
    tr: 'Easy Technology Company',
  },
  railHint: {
    en: 'Scroll to browse',
    ar: 'اسحب للتصفّح',
    tr: 'Gezinmek için kaydırın',
  },

  // ---- 404 ----
  nfTitle: { en: 'Page not found', ar: 'الصفحة غير موجودة', tr: 'Sayfa bulunamadı' },
  nfBack: { en: 'Back to Gold Pelet', ar: 'العودة إلى گولد بيليت', tr: "Gold Pelet'e dön" },
} satisfies Record<string, Str>

export type CopyKey = keyof typeof copy
