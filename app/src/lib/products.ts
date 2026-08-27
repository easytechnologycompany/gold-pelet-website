import type { Str } from './i18n'

/** Ids of the hand-drawn product glyphs in the SVG sprite. No external
 *  images anywhere on this site — see CLAUDE.md §2 in the design repo. */
export type GlyphId = 'g-classic' | 'g-ridged' | 'g-ring' | 'g-curl' | 'g-stick'

/** Ids of the UI icon symbols in the sprite. */
export type IconId = 'i-chev' | 'i-check' | 'i-cert' | 'i-leaf' | 'i-scan' | 'i-truck'

/**
 * Bento cells. `cls` carries the span classes the grid reads at each
 * breakpoint — the counts are pinned rather than auto-fit so a seven-item
 * grid never leaves a dead cell (a bug found and fixed in the design session).
 */
export type BentoCell =
  | { kind: 'num'; cls: string; num: string; cap: Str; p: Str }
  | { kind: 'art'; cls: string; glyph: GlyphId; h: Str; p: Str }
  | { kind: 'ico'; cls: string; icon: IconId; h: Str; p: Str }

export const bento: BentoCell[] = [
  {
    kind: 'num',
    cls: 'w3 tint',
    num: '12s',
    cap: { en: 'In the fryer', ar: 'في المقلاة', ku: 'لە تاوەکەدا', tr: 'Kızartmada' },
    p: {
      en: 'Sunflower oil held at 195°C. Twelve seconds is the whole cook — long enough to expand the pellet, short enough to keep it pale.',
      ar: 'زيت دوّار الشمس عند ١٩٥°م. اثنتا عشرة ثانية هي الطهي كلّه — تكفي لتمدّد الحبّة وتُبقيها فاتحة اللون.',
      ku: 'زەیتی گوڵەبەڕۆژە لە پلەی ١٩٥°س. دوازدە چرکە هەموو کاتی لێنانەکەیە — بەشی ئەوە دەکات گرانوولەکە بپلێتەوە و بەشی ئەوەش دەکات ڕەنگەکەی کاڵ بمێنێتەوە.',
      tr: "Ayçiçek yağı 195°C'de tutulur. On iki saniye pişirmenin tamamıdır — peleti şişirmeye yetecek kadar uzun, rengini açık tutacak kadar kısa.",
    },
  },
  {
    kind: 'art',
    cls: 'w3',
    glyph: 'g-ridged',
    h: {
      en: 'Six cuts, one line',
      ar: 'ستّ قصّات على خطّ واحد',
      ku: 'شەش قەد، یەک هێڵ',
      tr: 'Altı kesim, tek hat',
    },
    p: {
      en: 'Ridged, classic, rings, curls, sticks and triangles all run on the same continuous line.',
      ar: 'المضلّعة والكلاسيكية والحلقات واللفائف والأصابع والمثلثات كلّها على الخط نفسه.',
      ku: 'شیوداری، کلاسیکی، بازنە، لوولە، پارچە و سێگۆشە هەموویان لەسەر هەمان هێڵدا دەڕۆن.',
      tr: 'Tırtıklı, klasik, halka, kıvrım, çubuk ve üçgen; hepsi aynı hatta üretilir.',
    },
  },
  {
    kind: 'num',
    cls: 'w2',
    num: '14t',
    cap: { en: 'Daily capacity', ar: 'الطاقة اليومية', ku: 'توانای ڕۆژانە', tr: 'Günlük kapasite' },
    p: {
      en: 'Three lines, single shift, with headroom for a second.',
      ar: 'ثلاثة خطوط بوردية واحدة، مع سعة لوردية ثانية.',
      ku: 'سێ هێڵ بە یەک نۆبەت، لەگەڵ بۆشایی بۆ نۆبەتێکی دووەم.',
      tr: 'Üç hat, tek vardiya, ikinci bir vardiya için pay bırakılmış.',
    },
  },
  {
    kind: 'ico',
    cls: 'w2',
    icon: 'i-cert',
    h: {
      en: 'ISO 22000 · HACCP',
      ar: 'آيزو ٢٢٠٠٠ · هاسب',
      ku: 'ئایزۆ ٢٢٠٠٠ · هاسپ',
      tr: 'ISO 22000 · HACCP',
    },
    p: {
      en: 'Certified facility, audited annually, with Halal certification per batch.',
      ar: 'منشأة معتمدة تُدقَّق سنويًا، مع شهادة حلال لكل دفعة.',
      ku: 'دەزگایەکی بڕوانامەدار کە ساڵانە پشکنین دەکرێت، لەگەڵ بڕوانامەی حەڵاڵ بۆ هەر بەشێک.',
      tr: 'Sertifikalı tesis, yılda bir denetlenir, her parti için helal sertifikasıyla.',
    },
  },
  {
    kind: 'ico',
    cls: 'w2',
    icon: 'i-scan',
    h: {
      en: 'Batch traceable',
      ar: 'تتبّع الدفعات',
      ku: 'شوێنپێهەڵگری بەشەکان',
      tr: 'Parti izlenebilirliği',
    },
    p: {
      en: 'Every pack code resolves to its shift, oil change, seasoning lot and supplier.',
      ar: 'رمز كل عبوة يقود إلى ورديتها وتغيير الزيت ودفعة التتبيل والمورّد.',
      ku: 'کۆدی هەر پاکەتێک دەگەڕێتەوە بۆ نۆبەتەکەی، گۆڕینی زەیت، بەشی تامدان و دابینکەر.',
      tr: 'Her paket kodu; vardiyasına, yağ değişimine, baharat partisine ve tedarikçisine ulaşır.',
    },
  },
  {
    kind: 'ico',
    cls: 'w3',
    icon: 'i-leaf',
    h: {
      en: 'Sunflower oil only',
      ar: 'زيت دوّار الشمس حصرًا',
      ku: 'تەنیا زەیتی گوڵەبەڕۆژە',
      tr: 'Yalnızca ayçiçek yağı',
    },
    p: {
      en: 'No palm oil, no MSG, no artificial colouring. Seven ingredients, all of them on the label.',
      ar: 'بلا زيت نخيل ولا غلوتامات ولا ألوان صناعية. سبعة مكوّنات، جميعها على الملصق.',
      ku: 'بێ زەیتی خورما، بێ گلوتامات، بێ ڕەنگی دەستکرد. حەوت پێکهاتە، هەموویان لەسەر لەیبڵەکەن.',
      tr: 'Palm yağı yok, MSG yok, yapay renklendirici yok. Yedi malzeme, hepsi etikette.',
    },
  },
  {
    kind: 'ico',
    cls: 'w3',
    icon: 'i-truck',
    h: { en: '12 governorates', ar: '١٢ محافظة', ku: '١٢ پارێزگا', tr: '12 il' },
    p: {
      en: 'Same-day in Baghdad, 48 hours to Erbil, Basra and Mosul, weekly everywhere else.',
      ar: 'اليوم نفسه في بغداد، ٤٨ ساعة لأربيل والبصرة والموصل، وأسبوعيًا لبقية المحافظات.',
      ku: 'هەمان ڕۆژ لە بەغدا، ٤٨ کاتژمێر بۆ هەولێر و بەسڕە و موسڵ، هەفتانە بۆ پارێزگاکانی تر.',
      tr: "Bağdat'ta aynı gün; Erbil, Basra ve Musul'a 48 saat; diğer illere haftalık.",
    },
  },
]

export type Product = {
  glyph: GlyphId
  /** Per-product artwork glow. This is where colour variety lives — it comes
   *  from the products themselves, not from the interface chrome. */
  tone: string
  cut: Str
  name: Str
  p: Str
  /** Retail pack weight in grams. */
  g: number
  /** 0 reads as "mild"; 1–3 render as filled dots. */
  heat: 0 | 1 | 2 | 3
}

export const products: Product[] = [
  {
    glyph: 'g-ridged',
    tone: '#D4A017',
    cut: { en: 'Classic cut', ar: 'قصّة كلاسيكية', ku: 'قەدی کلاسیکی', tr: 'Klasik kesim' },
    name: {
      en: 'Salt & Sunflower',
      ar: 'ملح وزيت دوّار الشمس',
      ku: 'خوێ و گوڵەبەڕۆژە',
      tr: 'Tuz & Ayçiçeği',
    },
    p: {
      en: 'Three ingredients. Coarse sea salt applied warm so it lands in flakes, not dust.',
      ar: 'ثلاثة مكوّنات. ملح بحر خشن يُضاف دافئًا فيستقرّ رقائق لا غبارًا.',
      ku: 'سێ پێکهاتە. خوێی دەریای ڕەق بە گەرمی زیاد دەکرێت تا وەک پەڕە دابنیشێت نەک وەک تۆز.',
      tr: 'Üç malzeme. İri deniz tuzu sıcakken uygulanır; toz değil, pul pul oturur.',
    },
    g: 45,
    heat: 0,
  },
  {
    glyph: 'g-classic',
    tone: '#C2410C',
    cut: { en: 'Ridged', ar: 'مضلّعة', ku: 'شیوداری', tr: 'Tırtıklı' },
    name: { en: 'Red Paprika', ar: 'فلفل أحمر حلو', ku: 'پاپریکای سوور', tr: 'Kırmızı Kapya' },
    p: {
      en: 'Sweet Aleppo paprika with a slow, warm finish. Ridges carry twice the seasoning.',
      ar: 'فلفل حلبي حلو بنهاية دافئة. التضليع يحمل ضعف البهار.',
      ku: 'پاپریکای شیرینی حەلەب بە کۆتاییەکی گەرم. شیوەکان دوو ئەوەندە تام هەڵدەگرن.',
      tr: 'Tatlı Halep kapyası, sıcak bir bitişle. Tırtıklar iki kat baharat taşır.',
    },
    g: 45,
    heat: 1,
  },
  {
    glyph: 'g-ring',
    tone: '#DC2626',
    cut: { en: 'Rings', ar: 'حلقات', ku: 'بازنە', tr: 'Halka' },
    name: {
      en: 'Chilli & Lime Rings',
      ar: 'حلقات الفلفل والليمون',
      ku: 'بازنەی بیبەر و لیمۆ',
      tr: 'Acı Biber & Limon Halkaları',
    },
    p: {
      en: 'Green chilli forward, dried Basra lime behind it. Our fastest line in the south.',
      ar: 'فلفل أخضر في المقدّمة ونومي بصرة خلفه. أسرع منتجاتنا دورانًا في الجنوب.',
      ku: 'بیبەری سەوز لە پێشەوە و لیمۆی وشکی بەسڕە لە دواوە. خێراترین بەرهەممان لە باشوور.',
      tr: 'Önde yeşil acı biber, arkasında kurutulmuş Basra limonu. Güneydeki en hızlı ürünümüz.',
    },
    g: 50,
    heat: 3,
  },
  {
    glyph: 'g-classic',
    tone: '#0E7490',
    cut: { en: 'Ridged', ar: 'مضلّعة', ku: 'شیوداری', tr: 'Tırtıklı' },
    name: {
      en: 'Sour Cream & Chive',
      ar: 'كريمة حامضة وثوم معمّر',
      ku: 'کرێمی ترش و پیازە',
      tr: 'Ekşi Krema & Frenk Soğanı',
    },
    p: {
      en: 'Cultured cream and dried chive, balanced with lemon to keep the finish clean.',
      ar: 'كريمة مخمّرة وثوم معمّر مجفّف، متوازنة بالليمون لتبقى النهاية نظيفة.',
      ku: 'کرێمی هەڵهێنراو و پیازەی وشک، بە لیمۆ هاوسەنگ کراوە تا کۆتاییەکەی پاک بمێنێتەوە.',
      tr: 'Kültürlenmiş krema ve kurutulmuş frenk soğanı, bitişi temiz tutmak için limonla dengelenmiş.',
    },
    g: 45,
    heat: 0,
  },
  {
    glyph: 'g-curl',
    tone: '#EA9A0B',
    cut: { en: 'Curls', ar: 'لفائف', ku: 'لوولە', tr: 'Kıvrım' },
    name: { en: 'Cheddar Curls', ar: 'لفائف الشيدر', ku: 'لوولەی چێدەر', tr: 'Cheddar Kıvrımları' },
    p: {
      en: 'Aged cheddar applied at temperature so it binds to the curl rather than sitting on it.',
      ar: 'شيدر معتّق يُضاف على حرارة مناسبة فيلتصق باللفّة.',
      ku: 'پەنیری چێدەری کۆن لە پلەی گونجاودا زیاد دەکرێت تا بە لوولەکەوە بنووسێت.',
      tr: 'Olgunlaştırılmış cheddar uygun sıcaklıkta uygulanır; kıvrıma yapışır.',
    },
    g: 60,
    heat: 0,
  },
  {
    glyph: 'g-stick',
    tone: '#4D7C0F',
    cut: { en: 'Sticks', ar: 'أصابع', ku: 'پارچە', tr: 'Çubuk' },
    name: {
      en: "Za'atar & Olive",
      ar: 'زعتر وزيت زيتون',
      ku: 'زەعتەر و زەیتوون',
      tr: 'Zahter & Zeytinyağı',
    },
    p: {
      en: 'Nineveh thyme milled weekly on site, with sumac and cold-pressed olive oil.',
      ar: 'زعتر نينوى يُطحن أسبوعيًا في المنشأة، مع سمّاق وزيت زيتون معصور على البارد.',
      ku: 'جەعدەی نەینەوا هەفتانە لە کارگەکەدا دەهاڕدرێت، لەگەڵ سماق و زەیتی زەیتوونی ساردگوشراو.',
      tr: 'Ninova kekiği tesiste haftalık öğütülür, sumak ve soğuk sıkım zeytinyağıyla.',
    },
    g: 50,
    heat: 1,
  },
]

export type Spec = { k: Str; v: Str }

export const specs: Spec[] = [
  {
    k: { en: 'Formats', ar: 'العبوات', ku: 'قەبارەکان', tr: 'Ambalajlar' },
    v: {
      en: '45 g · 50 g · 60 g retail · 150 g share · catering case',
      ar: '٤٥غ · ٥٠غ · ٦٠غ تجزئة · ١٥٠غ عائلية · عبوة الجملة',
      ku: '٤٥گ · ٥٠گ · ٦٠گ تاکە · ١٥٠گ هاوبەش · سندوقی خزمەتگوزاری',
      tr: '45 g · 50 g · 60 g perakende · 150 g paylaşımlık · ikram kolisi',
    },
  },
  {
    k: { en: 'Case configuration', ar: 'تنسيق الصندوق', ku: 'پێکهاتەی سندوق', tr: 'Koli düzeni' },
    v: {
      en: '24 units per case · 96 cases per pallet',
      ar: '٢٤ وحدة في الصندوق · ٩٦ صندوقًا على المنصّة',
      ku: '٢٤ دانە لە هەر سندوقێک · ٩٦ سندوق لەسەر هەر پاڵێتێک',
      tr: 'Koli başına 24 adet · palet başına 96 koli',
    },
  },
  {
    k: { en: 'Shelf life', ar: 'مدة الصلاحية', ku: 'ماوەی بەکارهێنان', tr: 'Raf ömrü' },
    v: {
      en: '12 months, verified by accelerated testing on site',
      ar: '١٢ شهرًا، مُثبتة بالاختبار المعجّل في المنشأة',
      ku: '١٢ مانگ، بە تاقیکردنەوەی خێراکراو لە کارگەکەدا پشتڕاست کراوە',
      tr: '12 ay, tesiste hızlandırılmış testle doğrulanmış',
    },
  },
  {
    k: { en: 'Packaging', ar: 'التغليف', ku: 'پاکەتکردن', tr: 'Ambalajlama' },
    v: {
      en: 'Metallised film, nitrogen-flushed, sealed within 90 seconds',
      ar: 'غشاء معدني، معبّأ بالنيتروجين، ويُختم خلال ٩٠ ثانية',
      ku: 'فیلمی مەعدەنی، بە نایترۆجین پڕکراو، لە ماوەی ٩٠ چرکەدا دادەخرێت',
      tr: 'Metalize film, nitrojenle doldurulmuş, 90 saniye içinde mühürlenir',
    },
  },
  {
    k: { en: 'Frying medium', ar: 'وسط القلي', ku: 'زەیتی سووراندن', tr: 'Kızartma yağı' },
    v: {
      en: 'Single-origin sunflower oil, continuously filtered',
      ar: 'زيت دوّار الشمس من مصدر واحد، يُرشَّح باستمرار',
      ku: 'زەیتی گوڵەبەڕۆژەی یەک سەرچاوە، بەردەوام پاڵاوتە',
      tr: 'Tek kaynaklı ayçiçek yağı, sürekli filtrelenir',
    },
  },
  {
    k: { en: 'Certification', ar: 'الاعتماد', ku: 'بڕوانامەکان', tr: 'Sertifikasyon' },
    v: {
      en: 'ISO 22000, HACCP, Halal — certificate number printed per batch',
      ar: 'آيزو ٢٢٠٠٠، هاسب، حلال — رقم الشهادة مطبوع لكل دفعة',
      ku: 'ئایزۆ ٢٢٠٠٠، هاسپ، حەڵاڵ — ژمارەی بڕوانامە بۆ هەر بەشێک چاپ دەکرێت',
      tr: 'ISO 22000, HACCP, Helal — parti başına sertifika numarası basılır',
    },
  },
  {
    k: { en: 'Private label', ar: 'العلامة الخاصة', ku: 'مارکەی تایبەت', tr: 'Özel etiket' },
    v: {
      en: 'From 500 cases per SKU, artwork supplied by the buyer',
      ar: 'ابتداءً من ٥٠٠ صندوق لكل صنف، والتصميم من المشتري',
      ku: 'لە ٥٠٠ سندوقەوە بۆ هەر جۆرێک، دیزاین لەلایەن کڕیارەوە دابین دەکرێت',
      tr: 'SKU başına 500 koliden itibaren, tasarım alıcı tarafından sağlanır',
    },
  },
  {
    k: { en: 'Minimum order', ar: 'أقلّ طلب', ku: 'کەمترین داواکاری', tr: 'Minimum sipariş' },
    v: {
      en: '10 cases · same-day Baghdad · 48 hours nationwide',
      ar: '١٠ صناديق · اليوم نفسه في بغداد · ٤٨ ساعة لبقية المحافظات',
      ku: '١٠ سندوق · هەمان ڕۆژ لە بەغدا · ٤٨ کاتژمێر بۆ پارێزگاکانی تر',
      tr: "10 koli · Bağdat'ta aynı gün · diğer illere 48 saat",
    },
  },
]
