// Gold Pelet — lightweight i18n switcher. No frameworks, no build step:
// translations live in the TRANSLATIONS map below, keyed by a
// data-i18n="key" attribute on the element whose textContent should be
// replaced. Covers site chrome (nav/header/footer), every page's hero and
// closing CTA banner, and the language switcher itself. Deeper body copy
// (feature cards, product descriptions) and CMS-sourced sections
// (products, certifications, news, timeline, stats) are intentionally out
// of scope here — those come from the live database via cms.js and would
// need their own multilingual columns to translate correctly; translating
// only their static HTML fallback would be misleading since it's replaced
// by English API data moments after load.

const I18N_STORAGE_KEY = 'gp_lang';
const SUPPORTED_LANGS = ['en', 'ar', 'tr', 'ku'];
const RTL_LANGS = new Set(['ar', 'ku']);
const LANG_NAMES = { en: 'English', ar: 'العربية', tr: 'Türkçe', ku: 'کوردی' };

const TRANSLATIONS = {
  en: {
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.services': 'Services',
    'nav.about': 'About Us',
    'nav.news': 'Events & News',
    'nav.contact': 'Contact Us',
    'header.cta': 'Get a Quote',
    'lang.aria': 'Select language',

    'footer.heading.company': 'Company',
    'footer.heading.products': 'Products',
    'footer.heading.contact': 'Contact',
    'footer.link.potato': 'Potato Pellets',
    'footer.link.wheat': 'Wheat Pellets',
    'footer.link.corn': 'Corn & 3D Pellets',
    'footer.link.calculator': 'Load Calculator',
    'footer.copyright': '© 2026 Gold Pelet. All rights reserved.',

    'home.hero.eyebrow': 'Pellet Snack Manufacturer · Est. 1998',
    'home.hero.h1': 'From raw grain to ready-to-fry pellets, engineered for scale.',
    'home.hero.lede': 'Gold Pelet produces potato, corn and wheat snack pellets and semi-finished chips for food brands and co-packers worldwide — built on consistent raw materials, validated recipes, and a production line that runs to spec every batch.',
    'home.hero.cta.solutions': 'Our Solutions',
    'home.products.eyebrow': 'Product Range',
    'home.products.h2': 'Pellet snacks, built from the raw material up.',
    'home.products.lede': 'Twelve signature shapes across three core lines — wheat, potato and Egyptian 3D corn — each formulated to a fixed moisture, density and expansion profile so your fryers get a consistent result batch after batch.',
    'home.products.viewall': 'View Full Product Catalog',
    'home.capacity.eyebrow': 'Manufacturing Capacity',
    'home.capacity.h2': 'One facility, four production lines, zero bottlenecks.',
    'home.capacity.p': 'Our plant runs four parallel extrusion lines with in-house drying, seasoning and packaging — so a formulation change on one line never slows down the others.',
    'home.capacity.bullet1': '4 independent extrusion lines, running 24/6',
    'home.capacity.bullet2': 'In-house QA lab testing every production batch',
    'home.capacity.bullet3': 'Bulk, bag-in-box and custom private-label packing',
    'home.capacity.cta': 'See Our Solutions',
    'story.eyebrow': 'From Field to Fryer',
    'story.title': 'One continuous line, from raw grain to finished snack.',
    'story.steps.raw.title': 'Raw Materials',
    'story.steps.raw.description': 'Selected raw materials — wheat, potato and corn — prepared for production.',
    'story.steps.formulation.title': 'Formulation',
    'story.steps.formulation.description': 'Controlled moisture and ingredient ratios create a repeatable formulation.',
    'story.steps.extrusion.title': 'Extrusion',
    'story.steps.extrusion.description': 'Precision dies create the required pellet geometry.',
    'story.steps.drying.title': 'Drying',
    'story.steps.drying.description': 'Controlled drying stabilizes pellets for storage and transportation.',
    'story.steps.frying.title': 'Frying & Expansion',
    'story.steps.frying.description': 'The pellet expands into its finished, crispy form.',
    'story.steps.ready.title': 'Ready for Your Brand',
    'story.steps.ready.description': 'Ready for seasoning, packaging, private label or your own production.',
    'home.certs.eyebrow': 'Certifications',
    'home.certs.h2': 'Audited, certified, and documented at every stage.',
    'home.cta.h2': 'Ready to spec a pellet snack line with us?',
    'home.cta.p': 'Send your target shape, flavor carry and volume — our technical team will come back with a formulation and lead time within 3 business days.',
    'home.cta.btn1': 'Request a Quote',
    'home.cta.btn2': 'Browse Catalog',

    'products.hero.eyebrow': 'Product Catalog',
    'products.hero.h1': 'Five pellet lines. One consistent raw-material standard.',
    'products.hero.p': "Every formulation below ships with a full spec sheet — moisture content, bulk density, expansion ratio and recommended fry parameters — so your production team can qualify it before the first container arrives.",
    'products.calc.eyebrow': 'Plan Your Order',
    'products.calc.h2': 'Container Load Calculator',
    'products.calc.p': "Estimate how many containers your order needs. Pick a product line, packaging format and target quantity — we'll factor in typical bulk density against each container's weight and volume limits.",
    'products.cta.h2': 'Need a spec sheet before you commit?',
    'products.cta.p': "We'll send moisture, density and fry-parameter data for any line above, plus a sample kit on request.",
    'products.cta.btn': 'Request Samples',

    'services.hero.eyebrow': 'Our Solutions',
    'services.hero.h1': "It's always better when the whole process line is reliable.",
    'services.hero.p': 'A dependable process line — from raw material intake to a sealed, labeled pallet — is what separates a good pellet supplier from one you can actually build a product roadmap around.',
    'services.cta.h2': 'Tell us what your line needs.',
    'services.cta.p': "Whether it's a formulation change, a new pack format, or a first-time order — start with a conversation, not a form.",
    'services.cta.btn': 'Talk to Our Team',

    'about.hero.eyebrow': 'About Gold Pelet',
    'about.hero.h1': 'Your process-line partner in pellet snacks.',
    'about.hero.p': 'Founded in 1998, Gold Pelet builds long-term supply relationships with food brands and co-packers — not one-off orders.',
    'about.cta.h2': 'Want to see the facility?',
    'about.cta.p': 'We host qualified buyers for facility tours by appointment. Reach out to arrange a visit.',
    'about.cta.btn': 'Contact Us',

    'news.hero.eyebrow': 'Events & News',
    'news.hero.h1': "Where to find us, and what's changed on the line.",
    'news.hero.p': 'Trade show appearances, certification renewals and production milestones — kept current for buyers tracking our capacity and compliance status.',
    'news.cta.h2': 'Meeting us at a trade show?',
    'news.cta.p': "Let us know in advance and we'll have samples and spec sheets ready for your specific product interest.",
    'news.cta.btn': 'Schedule a Meeting',

    'contact.hero.eyebrow': 'Get In Touch',
    'contact.hero.h1': 'Request a quote, samples, or a spec sheet.',
    'contact.hero.p': "Tell us what you're producing and roughly how much you need — our technical sales team responds within 3 business days with a formulation and lead time.",
    'contact.form.eyebrow': 'RFQ / B2B Inquiry',
    'contact.form.h2': 'Request a Quote',
    'contact.form.submit': 'Submit Inquiry',
  },

  ar: {
    'nav.home': 'الرئيسية',
    'nav.products': 'المنتجات',
    'nav.services': 'الخدمات',
    'nav.about': 'من نحن',
    'nav.news': 'الفعاليات والأخبار',
    'nav.contact': 'اتصل بنا',
    'header.cta': 'اطلب عرض سعر',
    'lang.aria': 'اختر اللغة',

    'footer.heading.company': 'الشركة',
    'footer.heading.products': 'المنتجات',
    'footer.heading.contact': 'تواصل معنا',
    'footer.link.potato': 'بيليت البطاطا',
    'footer.link.wheat': 'بيليت القمح',
    'footer.link.corn': 'بيليت الذرة ثلاثي الأبعاد',
    'footer.link.calculator': 'حاسبة تحميل الحاويات',
    'footer.copyright': '© 2026 غولد بيليت. جميع الحقوق محفوظة.',

    'home.hero.eyebrow': 'مصنّع وجبات البيليت الخفيفة · تأسست 1998',
    'home.hero.h1': 'من الحبوب الخام إلى بيليت جاهز للقلي، بتصميم يواكب الإنتاج الكبير.',
    'home.hero.lede': 'تنتج غولد بيليت بيليت البطاطا والذرة والقمح والرقائق نصف المصنّعة للعلامات الغذائية وشركاء التعبئة حول العالم — باعتماد مواد خام ثابتة، ووصفات مُعتمدة، وخط إنتاج يلتزم بالمواصفات في كل دفعة.',
    'home.hero.cta.solutions': 'حلولنا',
    'home.products.eyebrow': 'تشكيلة المنتجات',
    'home.products.h2': 'وجبات بيليت خفيفة، مبنية من المادة الخام صعودًا.',
    'home.products.lede': 'اثنا عشر شكلاً مميزًا ضمن ثلاثة خطوط أساسية — القمح والبطاطا والذرة المصرية ثلاثية الأبعاد — كل شكل مُصاغ بنسبة رطوبة وكثافة ومعدل تمدد ثابت، لتحصل مقالي عملائنا على نتيجة متسقة دفعة بعد دفعة.',
    'home.products.viewall': 'عرض كتالوج المنتجات الكامل',
    'home.capacity.eyebrow': 'الطاقة الإنتاجية',
    'home.capacity.h2': 'منشأة واحدة، أربعة خطوط إنتاج، بلا أي اختناقات.',
    'home.capacity.p': 'يشغّل مصنعنا أربعة خطوط بثق متوازية مع تجفيف وتتبيل وتعبئة داخلية — بحيث لا يؤدي تغيير التركيبة في خط ما إلى إبطاء الخطوط الأخرى.',
    'home.capacity.bullet1': '4 خطوط بثق مستقلة، تعمل 24 ساعة لـ6 أيام أسبوعيًا',
    'home.capacity.bullet2': 'مختبر ضبط جودة داخلي يفحص كل دفعة إنتاج',
    'home.capacity.bullet3': 'تعبئة بالجملة، بأكياس داخل صناديق، وتغليف خاص بعلامتك التجارية',
    'home.capacity.cta': 'اطّلع على حلولنا',
    'story.eyebrow': 'من الحقل إلى المقلاة',
    'story.title': 'خط إنتاج واحد ومتواصل، من الحبة الخام إلى الوجبة الجاهزة.',
    'story.steps.raw.title': 'المواد الخام',
    'story.steps.raw.description': 'مواد خام مُنتقاة — قمح وبطاطا وذرة — جاهزة للإنتاج.',
    'story.steps.formulation.title': 'التركيب',
    'story.steps.formulation.description': 'رطوبة ونسب مكونات مضبوطة تُنتج تركيبة قابلة للتكرار.',
    'story.steps.extrusion.title': 'البثق',
    'story.steps.extrusion.description': 'قوالب دقيقة تُشكّل هندسة البيليت المطلوبة.',
    'story.steps.drying.title': 'التجفيف',
    'story.steps.drying.description': 'تجفيف مضبوط يُثبّت البيليت للتخزين والنقل.',
    'story.steps.frying.title': 'القلي والتمدد',
    'story.steps.frying.description': 'يتمدد البيليت ليأخذ شكله المقرمش النهائي.',
    'story.steps.ready.title': 'جاهز لعلامتكم التجارية',
    'story.steps.ready.description': 'جاهز للتتبيل والتعبئة والعلامة الخاصة أو إنتاجكم الخاص.',
    'home.certs.eyebrow': 'الشهادات',
    'home.certs.h2': 'مُدقَّق ومُعتمَد وموثّق في كل مرحلة.',
    'home.cta.h2': 'هل أنت مستعد لتحديد مواصفات خط وجبات بيليت معنا؟',
    'home.cta.p': 'أرسل لنا الشكل والنكهة المستهدفة والكمية — سيعود إليك فريقنا الفني بتركيبة ومدة تسليم خلال 3 أيام عمل.',
    'home.cta.btn1': 'اطلب عرض سعر',
    'home.cta.btn2': 'تصفح الكتالوج',

    'products.hero.eyebrow': 'كتالوج المنتجات',
    'products.hero.h1': 'خمسة خطوط بيليت. معيار مادة خام ثابت واحد.',
    'products.hero.p': 'كل تركيبة أدناه تُرسَل مع نشرة مواصفات كاملة — نسبة الرطوبة، الكثافة الظاهرية، معدل التمدد، ومعايير القلي الموصى بها — ليتمكن فريق الإنتاج لديك من اعتمادها قبل وصول أول حاوية.',
    'products.calc.eyebrow': 'خطط لطلبيتك',
    'products.calc.h2': 'حاسبة تحميل الحاويات',
    'products.calc.p': 'قدّر عدد الحاويات التي تحتاجها طلبيتك. اختر خط المنتج وشكل التعبئة والكمية المستهدفة — وسنحسب الكثافة الظاهرية النموذجية مقابل حدود الوزن والحجم لكل حاوية.',
    'products.cta.h2': 'تحتاج نشرة مواصفات قبل الالتزام؟',
    'products.cta.p': 'سنرسل بيانات الرطوبة والكثافة ومعايير القلي لأي خط أعلاه، بالإضافة إلى عيّنة عند الطلب.',
    'products.cta.btn': 'اطلب عيّنات',

    'services.hero.eyebrow': 'حلولنا',
    'services.hero.h1': 'الأمور تسير دائمًا بشكل أفضل عندما يكون خط العملية بأكمله موثوقًا.',
    'services.hero.p': 'خط عملية يمكن الاعتماد عليه — من استلام المادة الخام إلى منصة نقالة مختومة ومُصنّفة — هو ما يميّز مورد بيليت جيد عن مورد يمكنك فعلًا بناء خارطة طريق منتج معه.',
    'services.cta.h2': 'أخبرنا بما يحتاجه خط الإنتاج لديك.',
    'services.cta.p': 'سواء كان تغييرًا في التركيبة، أو شكل تعبئة جديد، أو طلبية أولى — ابدأ بمحادثة، لا بنموذج.',
    'services.cta.btn': 'تحدث إلى فريقنا',

    'about.hero.eyebrow': 'عن غولد بيليت',
    'about.hero.h1': 'شريكك في خط إنتاج وجبات البيليت الخفيفة.',
    'about.hero.p': 'تأسست غولد بيليت عام 1998، وتبني علاقات توريد طويلة الأمد مع العلامات الغذائية وشركاء التعبئة — لا طلبيات لمرة واحدة.',
    'about.cta.h2': 'تريد رؤية المنشأة؟',
    'about.cta.p': 'نستضيف المشترين المؤهلين لجولات في المنشأة بموعد مسبق. تواصل معنا لترتيب زيارة.',
    'about.cta.btn': 'اتصل بنا',

    'news.hero.eyebrow': 'الفعاليات والأخبار',
    'news.hero.h1': 'أين تجدنا، وما الذي تغيّر في خط الإنتاج.',
    'news.hero.p': 'مشاركات في المعارض التجارية، وتجديد الشهادات، ومحطات الإنتاج المهمة — محدّثة باستمرار للمشترين المتابعين لطاقتنا الإنتاجية وحالة امتثالنا.',
    'news.cta.h2': 'ستقابلنا في معرض تجاري؟',
    'news.cta.p': 'أخبرنا مسبقًا وسنجهّز العيّنات ونشرات المواصفات الخاصة باهتمامك بالمنتج.',
    'news.cta.btn': 'حدّد موعد لقاء',

    'contact.hero.eyebrow': 'تواصل معنا',
    'contact.hero.h1': 'اطلب عرض سعر أو عيّنات أو نشرة مواصفات.',
    'contact.hero.p': 'أخبرنا بما تنتجه وبالكمية التقريبية التي تحتاجها — يرد فريق المبيعات الفني لدينا خلال 3 أيام عمل بتركيبة ومدة تسليم.',
    'contact.form.eyebrow': 'طلب عرض سعر / استفسار أعمال',
    'contact.form.h2': 'اطلب عرض سعر',
    'contact.form.submit': 'إرسال الطلب',
  },

  tr: {
    'nav.home': 'Ana Sayfa',
    'nav.products': 'Ürünler',
    'nav.services': 'Hizmetler',
    'nav.about': 'Hakkımızda',
    'nav.news': 'Etkinlik & Haberler',
    'nav.contact': 'İletişim',
    'header.cta': 'Teklif Al',
    'lang.aria': 'Dil seçin',

    'footer.heading.company': 'Şirket',
    'footer.heading.products': 'Ürünler',
    'footer.heading.contact': 'İletişim',
    'footer.link.potato': 'Patates Pelet',
    'footer.link.wheat': 'Buğday Pelet',
    'footer.link.corn': 'Mısır ve 3D Pelet',
    'footer.link.calculator': 'Konteyner Yükleme Hesaplayıcı',
    'footer.copyright': '© 2026 Gold Pelet. Tüm hakları saklıdır.',

    'home.hero.eyebrow': 'Pelet Atıştırmalık Üreticisi · 1998\'den beri',
    'home.hero.h1': 'Ham taneden kızartmaya hazır pelete, büyük ölçek için tasarlandı.',
    'home.hero.lede': 'Gold Pelet, dünya çapındaki gıda markaları ve fason üreticiler için patates, mısır ve buğday atıştırmalık pelet ile yarı mamul cips üretir — tutarlı hammadde, onaylı reçeteler ve her seferinde spesifikasyona uygun çalışan bir üretim hattı üzerine kuruludur.',
    'home.hero.cta.solutions': 'Çözümlerimiz',
    'home.products.eyebrow': 'Ürün Yelpazesi',
    'home.products.h2': 'Hammaddeden başlayarak inşa edilmiş pelet atıştırmalıklar.',
    'home.products.lede': 'Üç ana hat — buğday, patates ve Mısır tarzı 3D — genelinde on iki imza şekil, her biri fritözlerinizde parti be parti tutarlı sonuç için sabit nem, yoğunluk ve genleşme profiline göre formüle edilmiştir.',
    'home.products.viewall': 'Tüm Ürün Kataloğunu Görüntüle',
    'home.capacity.eyebrow': 'Üretim Kapasitesi',
    'home.capacity.h2': 'Tek tesis, dört üretim hattı, sıfır darboğaz.',
    'home.capacity.p': 'Tesisimiz, kurutma, tatlandırma ve ambalajlamayı kendi bünyesinde yapan dört paralel ekstrüzyon hattı çalıştırır — böylece bir hattaki reçete değişikliği diğerlerini asla yavaşlatmaz.',
    'home.capacity.bullet1': 'Haftada 6 gün, 24 saat çalışan 4 bağımsız ekstrüzyon hattı',
    'home.capacity.bullet2': 'Her üretim partisini test eden dahili kalite kontrol laboratuvarı',
    'home.capacity.bullet3': 'Dökme, kutu içi torba ve özel private-label ambalaj',
    'home.capacity.cta': 'Çözümlerimizi İnceleyin',
    'story.eyebrow': 'Tarladan Fritöze',
    'story.title': 'Ham taneden bitmiş atıştırmalığa, tek ve kesintisiz bir hat.',
    'story.steps.raw.title': 'Ham Maddeler',
    'story.steps.raw.description': 'Seçilmiş ham maddeler — buğday, patates ve mısır — üretime hazırlanır.',
    'story.steps.formulation.title': 'Formülasyon',
    'story.steps.formulation.description': 'Kontrollü nem ve malzeme oranları tekrarlanabilir bir formülasyon oluşturur.',
    'story.steps.extrusion.title': 'Ekstrüzyon',
    'story.steps.extrusion.description': 'Hassas kalıplar gerekli pelet geometrisini oluşturur.',
    'story.steps.drying.title': 'Kurutma',
    'story.steps.drying.description': 'Kontrollü kurutma, peletleri depolama ve taşıma için stabilize eder.',
    'story.steps.frying.title': 'Kızartma ve Genleşme',
    'story.steps.frying.description': 'Pelet, nihai çıtır şekline genleşir.',
    'story.steps.ready.title': 'Markanıza Hazır',
    'story.steps.ready.description': 'Tatlandırma, ambalajlama, private label veya kendi üretiminiz için hazır.',
    'home.certs.eyebrow': 'Sertifikalar',
    'home.certs.h2': 'Her aşamada denetlenmiş, sertifikalandırılmış ve belgelenmiş.',
    'home.cta.h2': 'Bizimle bir pelet atıştırmalık hattı belirlemeye hazır mısınız?',
    'home.cta.p': 'Hedef şekil, aroma taşıyıcı ve hacmi bize iletin — teknik ekibimiz 3 iş günü içinde bir reçete ve teslim süresiyle dönüş yapacaktır.',
    'home.cta.btn1': 'Teklif Al',
    'home.cta.btn2': 'Kataloğa Göz At',

    'products.hero.eyebrow': 'Ürün Kataloğu',
    'products.hero.h1': 'Beş pelet hattı. Tek ve tutarlı bir hammadde standardı.',
    'products.hero.p': 'Aşağıdaki her formülasyon, üretim ekibinizin ilk konteyner gelmeden önce onaylayabilmesi için nem oranı, yığın yoğunluğu, genleşme oranı ve önerilen kızartma parametrelerini içeren eksiksiz bir spesifikasyon föyüyle gönderilir.',
    'products.calc.eyebrow': 'Siparişinizi Planlayın',
    'products.calc.h2': 'Konteyner Yükleme Hesaplayıcı',
    'products.calc.p': 'Siparişinizin kaç konteyner gerektirdiğini tahmin edin. Bir ürün hattı, ambalaj formatı ve hedef miktar seçin — tipik yığın yoğunluğunu her konteynerin ağırlık ve hacim sınırlarına göre hesaplayalım.',
    'products.cta.h2': 'Karar vermeden önce bir spesifikasyon föyüne mi ihtiyacınız var?',
    'products.cta.p': 'Yukarıdaki herhangi bir hat için nem, yoğunluk ve kızartma parametresi verilerini, talep üzerine bir numune kitiyle birlikte göndeririz.',
    'products.cta.btn': 'Numune İste',

    'services.hero.eyebrow': 'Çözümlerimiz',
    'services.hero.h1': 'Tüm süreç hattı güvenilir olduğunda işler her zaman daha iyi gider.',
    'services.hero.p': 'Hammadde kabulünden mühürlü, etiketli palete kadar güvenilir bir süreç hattı — iyi bir pelet tedarikçisini, gerçekten birlikte bir ürün yol haritası kurabileceğiniz bir tedarikçiden ayıran şeydir.',
    'services.cta.h2': 'Hattınızın neye ihtiyacı olduğunu bize söyleyin.',
    'services.cta.p': 'İster bir reçete değişikliği, ister yeni bir ambalaj formatı, ister ilk siparişiniz olsun — bir formla değil, bir konuşmayla başlayın.',
    'services.cta.btn': 'Ekibimizle Konuşun',

    'about.hero.eyebrow': 'Gold Pelet Hakkında',
    'about.hero.h1': 'Pelet atıştırmalıklarda süreç hattı ortağınız.',
    'about.hero.p': '1998\'de kurulan Gold Pelet, gıda markaları ve fason üreticilerle tek seferlik siparişler değil, uzun vadeli tedarik ilişkileri kurar.',
    'about.cta.h2': 'Tesisi görmek ister misiniz?',
    'about.cta.p': 'Randevu ile nitelikli alıcılar için tesis turları düzenliyoruz. Ziyaret ayarlamak için bize ulaşın.',
    'about.cta.btn': 'İletişime Geçin',

    'news.hero.eyebrow': 'Etkinlik & Haberler',
    'news.hero.h1': 'Bizi nerede bulacağınız ve hatta neler değişti.',
    'news.hero.p': 'Fuar katılımları, sertifika yenilemeleri ve üretim kilometre taşları — kapasitemizi ve uyumluluk durumumuzu takip eden alıcılar için güncel tutulur.',
    'news.cta.h2': 'Bizimle bir fuarda mı buluşuyorsunuz?',
    'news.cta.p': 'Önceden haber verin, ürün ilginize özel numuneleri ve spesifikasyon föylerini hazır bulundururuz.',
    'news.cta.btn': 'Bir Görüşme Planlayın',

    'contact.hero.eyebrow': 'Bize Ulaşın',
    'contact.hero.h1': 'Teklif, numune veya spesifikasyon föyü talep edin.',
    'contact.hero.p': 'Ne ürettiğinizi ve yaklaşık ne kadar ihtiyacınız olduğunu bize söyleyin — teknik satış ekibimiz 3 iş günü içinde bir reçete ve teslim süresiyle yanıt verir.',
    'contact.form.eyebrow': 'Teklif Talebi / B2B Sorgusu',
    'contact.form.h2': 'Teklif Al',
    'contact.form.submit': 'Talebi Gönder',
  },

  ku: {
    'nav.home': 'سەرەکی',
    'nav.products': 'بەرهەمەکان',
    'nav.services': 'خزمەتگوزاریەکان',
    'nav.about': 'دەربارەمان',
    'nav.news': 'ڕووداو و هەواڵ',
    'nav.contact': 'پەیوەندیمان پێوە بکە',
    'header.cta': 'داواکردنی نرخ',
    'lang.aria': 'زمان هەڵبژێرە',

    'footer.heading.company': 'کۆمپانیا',
    'footer.heading.products': 'بەرهەمەکان',
    'footer.heading.contact': 'پەیوەندی',
    'footer.link.potato': 'پێلێتی پەتاتە',
    'footer.link.wheat': 'پێلێتی گەنم',
    'footer.link.corn': 'پێلێتی گەنمەشامی و سێ‌ڕەهەندی',
    'footer.link.calculator': 'ژمێرەری بارکردنی کۆنتەینەر',
    'footer.copyright': '© 2026 گۆڵد پێلێت. هەموو مافەکان پارێزراون.',

    'home.hero.eyebrow': 'بەرهەمهێنەری خواردنە سووکەکانی پێلێت · دامەزراوی ساڵی ١٩٩٨',
    'home.hero.h1': 'لە دانەوێڵەی خاوی تاوەکو پێلێتی ئامادە بۆ سووراندن، بۆ ئاستێکی بەرفراوان دیزاین کراوە.',
    'home.hero.lede': 'گۆڵد پێلێت پێلێتی پەتاتە و گەنمەشامی و گەنم و چیپسی نیوەتەواو بەرهەم دەهێنێت بۆ براندە خۆراکیەکان و هاوبەشانی بەستەبەندی لە سەرانسەری جیهاندا — لەسەر بنەمای ماددەی خاوی جێگیر، ڕێسەی پشتڕاستکراوە، و هێڵێکی بەرهەمهێنان کە لە هەر پارتییەکدا بەگوێرەی ستانداردەکان کار دەکات.',
    'home.hero.cta.solutions': 'چارەسەرەکانمان',
    'home.products.eyebrow': 'ڕیزبەندی بەرهەمەکان',
    'home.products.h2': 'خواردنی سووکی پێلێت، لە ماددەی خاوەوە بونیاد نراوە.',
    'home.products.lede': 'دوازدە شێوازی تایبەت لە سێ هێڵی سەرەکیدا — گەنم، پەتاتە و گەنمەشامی سێ‌ڕەهەندی — هەریەکەیان بە شێوازێکی جێگیری هەڵم، چڕی و ڕێژەی بڵاوبوونەوە دروستکراون بۆ ئەوەی سووراوەکانتان ئەنجامێکی یەکسان بەدەست بهێنن پارتی دوای پارتی.',
    'home.products.viewall': 'بینینی هەموو کاتالۆگی بەرهەمەکان',
    'home.capacity.eyebrow': 'توانای بەرهەمهێنان',
    'home.capacity.h2': 'یەک کارگە، چوار هێڵی بەرهەمهێنان، بێ هیچ گیرکردنێک.',
    'home.capacity.p': 'کارگەکەمان چوار هێڵی هاوتەریب کار پێدەکات لەگەڵ وشککردنەوە و تام و بەستەبەندی ناوخۆیی — بۆیە گۆڕانکاری ڕێسە لە یەک هێڵدا هەرگیز کاریگەری لەسەر هێڵەکانی تر نابێت.',
    'home.capacity.bullet1': '٤ هێڵی سەربەخۆی هاوتەریب، ٢٤ کاتژمێر بۆ ٦ ڕۆژی هەفتانە کار دەکات',
    'home.capacity.bullet2': 'تاقیگەیەکی جۆری ناوخۆیی هەموو پارتیەکی بەرهەمهێنان تاقی دەکاتەوە',
    'home.capacity.bullet3': 'بەستەبەندی کۆمەڵی، کیسە لەناو سندوق، و بەستەبەندی تایبەت بە براندی خۆتان',
    'home.capacity.cta': 'سەیری چارەسەرەکانمان بکە',
    'story.eyebrow': 'لە کێڵگە بۆ فڕایەر',
    'story.title': 'یەک هێڵی بەردەوام، لە دانەوێڵەی خاوەوە بۆ خواردنی تەواوکراو.',
    'story.steps.raw.title': 'ماددە خاوەکان',
    'story.steps.raw.description': 'ماددە خاوی هەڵبژێردراو — گەنم، پەتاتە و گەنمەشامی — ئامادەکراو بۆ بەرهەمهێنان.',
    'story.steps.formulation.title': 'ڕێسەکردن',
    'story.steps.formulation.description': 'هەڵم و ڕێژەی ماددەی کۆنترۆڵکراو ڕێسەیەکی دووبارەبوونەوە دروست دەکات.',
    'story.steps.extrusion.title': 'بژاردن',
    'story.steps.extrusion.description': 'قاڵبی وردبین شێوازی پێویستی پێلێت دروست دەکات.',
    'story.steps.drying.title': 'وشککردنەوە',
    'story.steps.drying.description': 'وشککردنەوەی کۆنترۆڵکراو پێلێت بۆ هەڵگرتن و گواستنەوە جێگیر دەکات.',
    'story.steps.frying.title': 'سووراندن و بڵاوبوونەوە',
    'story.steps.frying.description': 'پێلێت بڵاو دەبێتەوە بۆ شێوازی کۆتایی ترسکەی خۆی.',
    'story.steps.ready.title': 'ئامادەیە بۆ براندی تۆ',
    'story.steps.ready.description': 'ئامادەیە بۆ تامدان، بەستەبەندی، براندی تایبەت یان بەرهەمهێنانی خۆتان.',
    'home.certs.eyebrow': 'بڕوانامەکان',
    'home.certs.h2': 'لە هەموو قۆناغێکدا پشکنراو، بڕوانامەدار و بەڵگەنامەکراوە.',
    'home.cta.h2': 'ئامادەیت هێڵێکی خواردنی سووکی پێلێت لەگەڵمان دیاری بکەیت؟',
    'home.cta.p': 'شێواز و تام و ڕێژەی مەبەستتان بۆمان بنێرن — تیمی تەکنیکیمان لە ماوەی ٣ ڕۆژی کاردا بە ڕێسە و کاتی گەیاندنەوە وەڵامتان دەداتەوە.',
    'home.cta.btn1': 'داواکردنی نرخ',
    'home.cta.btn2': 'گەڕان بە کاتالۆگدا',

    'products.hero.eyebrow': 'کاتالۆگی بەرهەمەکان',
    'products.hero.h1': 'پێنج هێڵی پێلێت. یەک ستانداردی جێگیری ماددەی خاو.',
    'products.hero.p': 'هەر ڕێسەیەک لە خوارەوە لەگەڵ بەڵگەنامەیەکی تەواوی تایبەتمەندی دەنێردرێت — ڕێژەی هەڵم، چڕی کۆمەڵ، ڕێژەی بڵاوبوونەوە و پارامیترەکانی سووراندنی پێشنیازکراو — تاکو تیمی بەرهەمهێنانتان بتوانێت پێش گەیشتنی یەکەم کۆنتەینەر پشتڕاستی بکاتەوە.',
    'products.calc.eyebrow': 'داواکارییەکەت پلان بکە',
    'products.calc.h2': 'ژمێرەری بارکردنی کۆنتەینەر',
    'products.calc.p': 'ڕێژەی کۆنتەینەرەکانی پێویستی داواکارییەکەت بژمێرە. هێڵی بەرهەم و شێوازی بەستەبەندی و بڕی مەبەست هەڵبژێرە — ئێمە چڕی کۆمەڵی ئاسایی بەراورد دەکەین لەگەڵ سنووری کێش و قەبارەی هەر کۆنتەینەرێک.',
    'products.cta.h2': 'پێش وەرگرتنی بڕیار پێویستت بە بەڵگەنامەی تایبەتمەندییە؟',
    'products.cta.p': 'زانیاری هەڵم و چڕی و پارامیتری سووراندن بۆ هەر هێڵێکی سەرەوە دەنێرین، سەرباری نموونەیەک لە کاتی داواکردندا.',
    'products.cta.btn': 'داواکردنی نموونە',

    'services.hero.eyebrow': 'چارەسەرەکانمان',
    'services.hero.h1': 'کاتێک هێڵی پرۆسە بە تەواوی متمانەپێکراو بێت، هەمیشە باشترە.',
    'services.hero.p': 'هێڵێکی پرۆسەی متمانەپێکراو — لە وەرگرتنی ماددەی خاوەوە تاکو پاڵێتێکی مۆرکراو و پێناسەکراو — ئەوەیە جیاوازی دەخاتەوە لەنێوان دابینکەرێکی باشی پێلێت و دابینکەرێک کە بەڕاستی دەتوانیت پلانی بەرهەمێکی لەگەڵدا بونیاد بنێیت.',
    'services.cta.h2': 'پێمان بڵێ هێڵەکەت پێویستی بە چییە.',
    'services.cta.p': 'جا گۆڕانکاری ڕێسە بێت، شێوازێکی بەستەبەندی نوێ بێت، یان یەکەم داواکاریت بێت — دەست بە گفتوگۆ بکە، نەک فۆرمێک.',
    'services.cta.btn': 'قسە لەگەڵ تیمەکەمان بکە',

    'about.hero.eyebrow': 'دەربارەی گۆڵد پێلێت',
    'about.hero.h1': 'هاوبەشی هێڵی پرۆسەت لە خواردنی سووکی پێلێتدا.',
    'about.hero.p': 'گۆڵد پێلێت لە ساڵی ١٩٩٨دا دامەزراوە، و پەیوەندی دابینکردنی درێژخایەن لەگەڵ براندی خۆراکی و هاوبەشانی بەستەبەندی بونیاد دەنێت — نەک داواکاری یەک جارە.',
    'about.cta.h2': 'دەتەوێت کارگەکە ببینیت؟',
    'about.cta.p': 'ئێمە گەشتی کارگە بۆ کڕیارانی بەتوانا بە کاتی پێشوەخت ئامادە دەکەین. پەیوەندیمان پێوە بکە بۆ ڕێکخستنی سەردانێک.',
    'about.cta.btn': 'پەیوەندیمان پێوە بکە',

    'news.hero.eyebrow': 'ڕووداو و هەواڵ',
    'news.hero.h1': 'لەکوێ دەتوانیت بمانبینیت، و چی گۆڕاوە لە هێڵەکەدا.',
    'news.hero.p': 'بەشداریکردن لە پێشانگا بازرگانیەکان، نوێکردنەوەی بڕوانامەکان و ملیۆنی گرنگی بەرهەمهێنان — نوێ ڕاگیراوە بۆ کڕیارانێک کە چاودێری توانا و بارودۆخی ڕێکخستنمان دەکەن.',
    'news.cta.h2': 'لە پێشانگایەکی بازرگانیدا لەگەڵمان دەبیندرێیت؟',
    'news.cta.p': 'پێشوەخت پێمان بڵێ و ئێمە نموونە و بەڵگەنامەی تایبەتمەندی بۆ بەرهەمی مەبەستت ئامادە دەکەین.',
    'news.cta.btn': 'کۆبوونەوەیەک ڕێکبخە',

    'contact.hero.eyebrow': 'پەیوەندیمان پێوە بکە',
    'contact.hero.h1': 'داوای نرخ، نموونە، یان بەڵگەنامەی تایبەتمەندی بکە.',
    'contact.hero.p': 'پێمان بڵێ چی بەرهەم دەهێنیت و بە شێوازی نزیک چەندت پێویستە — تیمی فرۆشتنی تەکنیکیمان لە ماوەی ٣ ڕۆژی کاردا بە ڕێسە و کاتی گەیاندنەوە وەڵام دەداتەوە.',
    'contact.form.eyebrow': 'داواکردنی نرخ / پرسیاری بازرگانی',
    'contact.form.h2': 'داواکردنی نرخ',
    'contact.form.submit': 'ناردنی داواکاری',
  },
};

function getStoredLang() {
  let stored = null;
  try {
    stored = localStorage.getItem(I18N_STORAGE_KEY);
  } catch (err) {
    /* localStorage unavailable (private mode, etc.) — fall back to English */
  }
  return SUPPORTED_LANGS.includes(stored) ? stored : 'en';
}

function applyTranslations(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
}

function updateSwitcherUI(lang) {
  const codeEl = document.getElementById('lang-current-code');
  if (codeEl) codeEl.textContent = lang.toUpperCase();
  document.querySelectorAll('#lang-switcher-menu [role="option"]').forEach((li) => {
    li.setAttribute('aria-selected', String(li.dataset.lang === lang));
  });
}

function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = 'en';
  try {
    localStorage.setItem(I18N_STORAGE_KEY, lang);
  } catch (err) {
    /* ignore — language still applies for this page view */
  }
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
  applyTranslations(lang);
  updateSwitcherUI(lang);
}

function initLangSwitcher() {
  const wrapper = document.getElementById('lang-switcher');
  const btn = document.getElementById('lang-switcher-btn');
  const menu = document.getElementById('lang-switcher-menu');
  if (!wrapper || !btn || !menu) return;

  const closeMenu = () => {
    wrapper.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = wrapper.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  menu.querySelectorAll('[role="option"]').forEach((li) => {
    li.addEventListener('click', () => {
      setLanguage(li.dataset.lang);
      closeMenu();
    });
  });

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLangSwitcher();
  setLanguage(getStoredLang());
});
