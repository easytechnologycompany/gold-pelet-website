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

  // ---- chrome ----
  navOverview: { en: 'Overview', ar: 'القصة', ku: 'کورتە', tr: 'Genel Bakış' },
  navProducts: { en: 'Products', ar: 'المنتجات', ku: 'بەرهەمەکان', tr: 'Ürünler' },
  navMade: { en: 'Manufacturing', ar: 'التصنيع', ku: 'بەرهەمهێنان', tr: 'Üretim' },
  navSpecs: { en: 'Specs', ar: 'المواصفات', ku: 'تایبەتمەندییەکان', tr: 'Teknik Bilgiler' },
  navTrade: { en: 'Trade', ar: 'التجارة', ku: 'بازرگانی', tr: 'Ticaret' },

  ariaPrimary: { en: 'Primary', ar: 'رئيسي', ku: 'سەرەکی', tr: 'Birincil' },
  ariaLanguage: { en: 'Language', ar: 'اللغة', ku: 'زمان', tr: 'Dil' },
  ariaAppearance: {
    en: 'Switch appearance',
    ar: 'تبديل المظهر',
    ku: 'گۆڕینی ڕوخسار',
    tr: 'Görünümü değiştir',
  },

  // ---- hero ----
  heroKicker: { en: 'Gold Pelet', ar: 'گولد بيليت', ku: 'گۆڵد پێلێت', tr: 'Gold Pelet' },
  heroLine1: {
    en: 'Twelve seconds',
    ar: 'اثنتا عشرة ثانية',
    ku: 'دوازدە چرکە',
    tr: 'On iki saniye',
  },
  heroLine2: {
    en: 'change everything',
    ar: 'تصنع الفرق كلّه',
    ku: 'هەموو شتێک دەگۆڕن',
    tr: 'her şeyi değiştirir',
  },
  heroLead: {
    en: "We don't slice potatoes. We press dough into pellets and let sunflower oil do the rest. Lighter bite. Cleaner crunch. Seasoning in every corner.",
    ar: 'نحن لا نقطّع البطاطا شرائح. نضغط العجينة حبّاتٍ صغيرة، ثم تنتفخ في زيت دوّار الشمس. قوامٌ أخفّ، قرمشةٌ أوضح، وبهارٌ يصل إلى كل زاوية.',
    ku: 'ئێمە پەتاتە ناکەینە پارچە. هەویر دەکەینە گرانوول و زەیتی گوڵەبەڕۆژە کارەکەی تەواو دەکات. گازێکی سووکتر. ترشکەیەکی پاکتر. تامدان لە هەموو گۆشەیەکدا.',
    tr: 'Patates dilimlemiyoruz. Hamuru pelet hâline getiriyoruz, gerisini ayçiçek yağı hallediyor. Daha hafif bir ısırık. Daha temiz bir çıtırtı. Her köşede baharat.',
  },
  heroLinkProducts: {
    en: 'See the products',
    ar: 'شاهد المنتجات',
    ku: 'بەرهەمەکان ببینە',
    tr: 'Ürünleri görün',
  },
  heroLinkTrade: {
    en: 'Order wholesale',
    ar: 'اطلب بالجملة',
    ku: 'داواکاری کۆمەڵ',
    tr: 'Toptan sipariş',
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

  // ---- product rail ----
  rangeEyebrow: { en: 'Products', ar: 'المنتجات', ku: 'بەرهەمەکان', tr: 'Ürünler' },
  rangeHeading: {
    en: 'Six flavours. Six cuts.',
    ar: 'ستّ نكهات. ستّ قصّات.',
    ku: 'شەش تام. شەش قەد.',
    tr: 'Altı çeşni. Altı kesim.',
  },
  railHint: {
    en: 'Scroll to browse',
    ar: 'اسحب للتصفّح',
    ku: 'بۆ گەڕان بیجوڵێنە',
    tr: 'Gezinmek için kaydırın',
  },
  mild: { en: 'mild', ar: 'غير حارّ', ku: 'سووک', tr: 'hafif' },

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

  // ---- footer ----
  footProducts: { en: 'Products', ar: 'المنتجات', ku: 'بەرهەمەکان', tr: 'Ürünler' },
  footCompany: { en: 'Company', ar: 'الشركة', ku: 'کۆمپانیا', tr: 'Şirket' },
  footTrade: { en: 'Trade', ar: 'التجارة', ku: 'بازرگانی', tr: 'Ticaret' },
  footContact: { en: 'Contact', ar: 'تواصل', ku: 'پەیوەندی', tr: 'İletişim' },

  footSalt: {
    en: 'Salt & Sunflower',
    ar: 'ملح وزيت دوّار الشمس',
    ku: 'خوێ و گوڵەبەڕۆژە',
    tr: 'Tuz & Ayçiçeği',
  },
  footPaprika: { en: 'Red Paprika', ar: 'فلفل أحمر حلو', ku: 'پاپریکای سوور', tr: 'Kırmızı Kapya' },
  footRings: {
    en: 'Chilli & Lime Rings',
    ar: 'حلقات الفلفل والليمون',
    ku: 'بازنەی بیبەر و لیمۆ',
    tr: 'Acı Biber & Limon Halkaları',
  },
  footZaatar: {
    en: "Za'atar & Olive",
    ar: 'زعتر وزيت زيتون',
    ku: 'زەعتەر و زەیتوون',
    tr: 'Zahter & Zeytinyağı',
  },

  footOverview: { en: 'Overview', ar: 'نبذة', ku: 'دەربارە', tr: 'Hakkımızda' },
  footManufacturing: { en: 'Manufacturing', ar: 'التصنيع', ku: 'بەرهەمهێنان', tr: 'Üretim' },
  footSpecifications: {
    en: 'Specifications',
    ar: 'المواصفات',
    ku: 'تایبەتمەندییەکان',
    tr: 'Teknik Bilgiler',
  },

  footDistributor: {
    en: 'Become a distributor',
    ar: 'كن موزّعًا',
    ku: 'ببە بە دابەشکەر',
    tr: 'Distribütör olun',
  },
  footPrivateLabel: {
    en: 'Private label',
    ar: 'العلامة الخاصة',
    ku: 'مارکەی تایبەت',
    tr: 'Özel etiket',
  },
  footSamples: {
    en: 'Request samples',
    ar: 'طلب عيّنات',
    ku: 'داواکردنی نموونە',
    tr: 'Numune isteyin',
  },

  footPhone: { en: '+964 780 000 0000' },
  footEmail: { en: 'sales@goldpelet.iq' },
  footCity: { en: 'Baghdad, Iraq', ar: 'بغداد، العراق', ku: 'بەغدا، عێراق', tr: 'Bağdat, Irak' },

  footCopyright: {
    en: '© 2026 Gold Pelet Food Industries.',
    ar: '© ٢٠٢٦ شركة گولد بيليت للصناعات الغذائية.',
    ku: '© ٢٠٢٦ کۆمپانیای گۆڵد پێلێت بۆ پیشەسازی خواردن.',
    tr: '© 2026 Gold Pelet Gıda Sanayi.',
  },
  // Do not remove until real data lands — see CLAUDE.md §4 in the design repo.
  footDisclaimer: {
    en: 'Design concept — figures and product data are illustrative.',
    ar: 'تصميم أوليّ — الأرقام والبيانات توضيحية.',
    ku: 'چەمکی دیزاین — ژمارەکان و زانیاری بەرهەمەکان بۆ نموونەن.',
    tr: 'Tasarım konsepti — rakamlar ve ürün verileri temsilîdir.',
  },

  // ---- 404 ----
  nfTitle: { en: 'Page not found', ar: 'الصفحة غير موجودة', ku: 'پەڕەکە نەدۆزرایەوە', tr: 'Sayfa bulunamadı' },
  nfBack: { en: 'Back to Gold Pelet', ar: 'العودة إلى گولد بيليت', ku: 'گەڕانەوە بۆ گۆڵد پێلێت', tr: "Gold Pelet'e dön" },
} satisfies Record<string, Str>

export type CopyKey = keyof typeof copy
