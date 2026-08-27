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
  packAlt: {
    en: 'Gold Pelet retail pack',
    ar: 'عبوة گولد بيليت',
    ku: 'پاکەتی گۆڵد پێلێت',
    tr: 'Gold Pelet perakende paketi',
  },

  // ---- statement ----
  statementMega: { en: '4×', ar: '×٤', ku: '×٤', tr: '4×' },
  statementSub: {
    en: 'A pellet expands four times over in the fryer. What went in solid comes out mostly air. That is where the crunch comes from.',
    ar: 'تتمدّد الحبّة أربعة أضعاف حجمها في المقلاة. ما كان صلبًا يصير هواءً — وهذا هو سبب القرمشة.',
    ku: 'گرانوولەکە لە تاوەکەدا چوار ئەوەندە دەپلێتەوە. ئەوەی بە ڕەقی چووە ژوورەوە زۆرینەی بە هەوا دێتە دەرەوە. ترشکەکە لەوێوە دێت.',
    tr: 'Pelet, kızartmada dört katına genişler. İçeri katı giren, dışarı çoğunlukla hava olarak çıkar. Çıtırlık işte buradan gelir.',
  },

  // ---- bento ----
  bentoEyebrow: {
    en: 'Why Gold Pelet',
    ar: 'لماذا گولد بيليت',
    ku: 'بۆچی گۆڵد پێلێت',
    tr: 'Neden Gold Pelet',
  },
  bentoHeading: {
    en: 'A factory built on details',
    ar: 'مصنع مبني على التفاصيل',
    ku: 'کارگەیەک لەسەر وردەکارییەکان بنیاتنراوە',
    tr: 'Ayrıntılar üzerine kurulu bir fabrika',
  },
  railHint: {
    en: 'Scroll to browse',
    ar: 'اسحب للتصفّح',
    ku: 'بۆ گەڕان بیجوڵێنە',
    tr: 'Gezinmek için kaydırın',
  },

  // ---- manufacturing story ----
  storyEyebrow: { en: 'How it is made', ar: 'كيف يُصنع', ku: 'چۆن دروست دەکرێت', tr: 'Nasıl üretilir' },
  storyHeading: {
    en: 'From formulation to pallet',
    ar: 'من التركيب إلى المنصّة',
    ku: 'لە پێکهاتەوە بۆ پاڵێت',
    tr: 'Formülasyondan palete',
  },
  stepRaw: { en: 'Raw material', ar: 'المواد الخام', ku: 'کەرەستەی خاو', tr: 'Ham madde' },
  stepFormulation: { en: 'Formulation', ar: 'التركيب', ku: 'پێکهاتە', tr: 'Formülasyon' },
  stepExtrusion: { en: 'Extrusion', ar: 'البثق', ku: 'دەرهاویشتن', tr: 'Ekstrüzyon' },
  stepDrying: { en: 'Drying', ar: 'التجفيف', ku: 'وشککردن', tr: 'Kurutma' },
  stepFrying: { en: 'Frying', ar: 'القلي', ku: 'سووراندن', tr: 'Kızartma' },
  stepReady: { en: 'Ready to ship', ar: 'جاهز للشحن', ku: 'ئامادەی ناردن', tr: 'Sevkiyata hazır' },

  // ---- specs ----
  specsEyebrow: {
    en: 'Specifications',
    ar: 'المواصفات',
    ku: 'تایبەتمەندییەکان',
    tr: 'Teknik Bilgiler',
  },
  specsHeading: {
    en: 'The technical detail',
    ar: 'التفاصيل التقنية',
    ku: 'وردەکارییە تەکنیکییەکان',
    tr: 'Teknik ayrıntılar',
  },

  // ---- CTA ----
  ctaHeading: {
    en: "Let's talk volume",
    ar: 'لنتحدّث عن الكميات',
    ku: 'با لەسەر بڕەکان بدوێین',
    tr: 'Hacim konuşalım',
  },
  ctaLead: {
    en: 'Ten cases minimum. Orders confirmed before 2pm ship same-day in Baghdad and within 48 hours nationwide.',
    ar: 'أقلّ طلب عشرة صناديق. الطلبات المؤكّدة قبل الثانية ظهرًا تُشحن في اليوم نفسه داخل بغداد، وخلال ٤٨ ساعة إلى بقية المحافظات.',
    ku: 'کەمترین داواکاری دە سندوقە. داواکارییەکانی پێش کاتژمێر ٢ی دوانیوەڕۆ هەمان ڕۆژ لە بەغدا و لە ماوەی ٤٨ کاتژمێردا بۆ سەرانسەری وڵات دەنێردرێن.',
    tr: "En az on koli. Öğleden sonra 2'den önce onaylanan siparişler Bağdat'ta aynı gün, ülke genelinde 48 saat içinde sevk edilir.",
  },
  ctaPrimary: {
    en: 'Contact sales',
    ar: 'تواصل مع المبيعات',
    ku: 'پەیوەندی بە فرۆشتنەوە',
    tr: 'Satışla iletişime geçin',
  },
  ctaSecondary: {
    en: 'Download price list',
    ar: 'تحميل قائمة الأسعار',
    ku: 'داگرتنی لیستی نرخەکان',
    tr: 'Fiyat listesini indirin',
  },

  // ---- 404 ----
  nfTitle: { en: 'Page not found', ar: 'الصفحة غير موجودة', ku: 'پەڕەکە نەدۆزرایەوە', tr: 'Sayfa bulunamadı' },
  nfBack: { en: 'Back to Gold Pelet', ar: 'العودة إلى گولد بيليت', ku: 'گەڕانەوە بۆ گۆڵد پێلێت', tr: "Gold Pelet'e dön" },
} satisfies Record<string, Str>

export type CopyKey = keyof typeof copy
