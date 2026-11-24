import type { DocsTranslations } from './types';

export const docsAr: DocsTranslations = {
  common: {
    guideTitle: 'الدليل التعليمي',
    stepsCountLabel: '4 خطوات عملية',
    backToGenerator: 'العودة للمولّد',
    previousStep: 'الخطوة السابقة',
    nextStep: 'الخطوة التالية',
    startGeneratingCta: 'ابدأ توليد مفتاحك الحقيقي',
    stepOfFourPrefix: 'الخطوة',
    stepOfFourConnector: 'من 4',
    whatForHeading: 'ما الهدف من هذه الخطوة؟',
    demoBannerTitle: 'بيانات تجريبية للشرح فقط — لا تستخدمها في تطبيقك الحقيقي',
    demoBannerBody:
      'جميع القيم أدناه أمثلة ثابتة للتعلم فقط، ولا يتم توليد أي مفاتيح حقيقية في هذه الصفحة.',
    sampleLabel: 'مثال',
    requiredLabel: 'إلزامي',
    optionalLabel: 'اختياري',
    copyBtn: 'نسخ المثال',
    copiedBtn: 'تم النسخ',
  },
  nav: {
    step1Short: 'المفتاح والأمان',
    step2Short: 'بيانات الشهادة',
    step3Short: 'التوليد المحلي',
    step4Short: 'التحميل والاستخدام',
  },
  overview: {
    title: 'الدليل العملي لمفاتيح أندرويد',
    subtitle:
      'أربع خطوات مختصرة تشرح كل حقل، وكيفية عمل التوليد دون إنترنت، وطريقة استخدام الملف الناتج في مشروعك قبل إنشاء مفتاحك الفعلي.',
    startStep1Cta: 'ابدأ الخطوة 1',
    stepSummaries: [
      {
        num: '1',
        title: 'المفتاح والأمان',
        summary: 'اختر اسماً مستعاراً واضحاً، وحجم RSA (2048 أو 4096)، وكلمة مرور آمنة لـ Gradle.',
      },
      {
        num: '2',
        title: 'بيانات الشهادة (DN)',
        summary: 'تعبئة بيانات الناشر (CN و O و C) وضبط مدة الصلاحية لما بعد عام 2033.',
      },
      {
        num: '3',
        title: 'المراجعة والتوليد المحلي',
        summary: 'كيف ينشئ المتصفح مفتاحك محلياً دون أي اتصال بالإنترنت أو خوادم خارجية.',
      },
      {
        num: '4',
        title: 'التحميل والاستخدام',
        summary: 'حفظ ملف .p12 بأمان (أو تحويله محلياً إلى .jks عند الحاجة)، إضافة بصمات SHA، وتكوين Gradle و keytool.',
      },
    ],
  },
  lesson1: {
    stepNum: '1',
    title: 'المفتاح والأمان',
    whatForBody:
      'تُحدّد في هذه الخطوة اسم مفتاح التوقيع، وقوة التشفير، وكلمة المرور التي تحميه. سيطلب منك Android Studio و Gradle هذه البيانات نفسها عند بناء كل إصدار رسمي لتطبيقك.',
    breakdownHeading: 'شرح الحقول بالتفصيل',
    fields: [
      {
        name: 'الاسم المستعار للمفتاح (Key Alias)',
        required: true,
        sample: 'demo-upload-key',
        why: 'اسم فريد يميّز مفتاحك داخل ملف الـ Keystore ويُستخدم في حقل \u2066keyAlias\u2069 داخل Gradle.',
      },
      {
        name: 'حجم مفتاح RSA',
        required: true,
        sample: '2048-bit RSA (Recommended)',
        why: 'حجم 2048-bit يطابق متطلبات Google Play ويتولّد خلال ثانيتين تقريباً؛ بينما 4096-bit يعطي هامش أمان أعلى بوقت حساب أطول.',
      },
      {
        name: 'كلمة مرور المتجر والمفتاح',
        required: true,
        sample: 'DemoOnly#NotForProd2026!',
        why: 'تحمي الملف والمفتاح معاً في \u2066Java 17+ PKCS#12\u2069. استخدم أحرف ASCII فقط دون علامات تنصيص أو رموز تسبب أخطاء في Gradle.',
      },
    ],
    rsaCompareLabel: 'مقارنة سريعة',
    rsa2048Note: '2048-bit: الخيار الموصى به لمفاتيح رفع Google Play، سريع (1 إلى 2 ثانية).',
    rsa4096Note: '4096-bit: أعلى قوة تقليدية لمفاتيح RSA، يستغرق وقتاً أطول (5 إلى 20 ثانية).',
    showPasswordLabel: 'إظهار كلمة المرور التجريبية',
    hidePasswordLabel: 'إخفاء كلمة المرور التجريبية',
    tipHeading: 'خطأ شائع يجب تجنّبه',
    tipBody:
      'تجنب استخدام الرموز (\u2066" \' \\ $\u2069) في كلمة المرور لأنها تعطّل سكربتات Gradle. استخدم زر «توليد كلمة مرور آمنة» (وضع كلمة المرور بين علامتي اقتباس دائماً عند تمريرها في الطرفية) واحفظ الاسم المستعار وكلمة المرور فوراً في مدير كلمات مرور.',
  },
  lesson2: {
    stepNum: '2',
    title: 'بيانات الشهادة (DN)',
    whatForBody:
      'تحتوي كل شهادة توقيع أندرويد على بطاقة تعريفية تسمى Distinguished Name تصف الجهة الناشرة. هذه الحقول بيانات عامة داخل الشهادة ولا يشترط أن تكون شركة مسجّلة رسمياً.',
    breakdownHeading: 'شرح الحقول بالتفصيل',
    fields: [
      {
        name: 'الاسم الشائع',
        code: 'CN',
        required: true,
        sample: 'Demo Mobile Release',
        why: 'اسم المطوّر أو الفريق أو اسم الناشر الظاهر كصاحب الشهادة.',
      },
      {
        name: 'المؤسسة أو الشركة',
        code: 'O',
        required: true,
        sample: 'Example Apps Studio LLC',
        why: 'اسم الشركة أو الاستوديو (يمكن للمطوّر الفردي كتابة اسم ناشره نفسه).',
      },
      {
        name: 'الوحدة التنظيمية',
        code: 'OU',
        required: false,
        sample: 'Android Engineering',
        why: 'اسم القسم أو الفريق التقني. يمكنك تركه فارغاً دون أي مشكلة.',
      },
      {
        name: 'المدينة والمنطقة',
        code: 'L / ST',
        required: false,
        sample: 'Riyadh · Riyadh Region',
        why: 'معلومات موقع اختيارية تظهر عند فحص الشهادة بأداة keytool.',
      },
      {
        name: 'رمز الدولة',
        code: 'C',
        required: true,
        sample: 'SA',
        why: 'يجب أن يكون حرفين إنجليزيين كبيرين فقط حسب معيار ISO 3166-1 (مثل SA أو AE أو EG أو US).',
      },
      {
        name: 'مدة صلاحية الشهادة',
        required: true,
        sample: '30 years',
        why: 'يشترط Google Play أن تبقى الشهادة صالحة لما بعد 22 أكتوبر 2033 (يُنصح بـ 25 إلى 30 سنة).',
      },
    ],
    sampleExpiryLabel: 'مثال لانتهاء صلاحية 30 سنة',
    playRuleNote: 'يتجاوز الحد الأدنى المطلوب من Google Play (22 أكتوبر 2033)',
    tipHeading: 'خطأ شائع يجب تجنّبه',
    tipBody:
      'لا تكتب اسم الدولة بالكامل مثل "Saudi Arabia" في حقل رمز الدولة، بل اكتب حرفين فقط (SA أو US). أما باقي الحقول النصية فتدعم اللغة العربية بالكامل بترميز \u2066UTF-8\u2069.',
  },
  lesson3: {
    stepNum: '3',
    title: 'المراجعة والتوليد المحلي',
    whatForBody:
      'تراجع في هذه الخطوة جميع بياناتك قبل الإنشاء. عند الضغط على زر التوليد، ينشئ متصفحك زوج مفاتيح RSA وملف PKCS#12 محلياً بالكامل داخل Web Worker معزول دون إرسال أي بيانات عبر الإنترنت.',
    breakdownHeading: 'ماذا يحدث داخل متصفحك؟',
    fields: [
      {
        code: '01',
        name: 'التحقق من المدخلات',
        sample: 'Zod Schema Validation',
        why: 'يفحص الاسم المستعار، وأحرف كلمة المرور، ورمز الدولة، وتجاوز الصلاحية لعام 2033 قبل بدء التشفير.',
      },
      {
        code: '02',
        name: 'توليد المفاتيح في الخلفية',
        sample: 'RSA 2048/4096 + CSPRNG Serial',
        why: 'ينشئ المفتاح ورقماً تسلسلياً عشوائياً موجباً بطول 128-bit داخل Web Worker مستقل دون تجميد الشاشة.',
      },
      {
        code: '03',
        name: 'تجميع ملف PKCS#12 وحساب البصمات',
        sample: 'SHA256withRSA · PBES2 AES-256-CBC',
        why: 'يوقّع الشهادة ويربط المفتاح الخاص مع \u2066localKeyId\u2069 ويستخرج بصمتي \u2066SHA-1\u2069 و \u2066SHA-256\u2069 في الذاكرة فقط.',
      },
      {
        code: '04',
        name: 'منع الاتصال بالشبكة برمجياً',
        sample: "Content-Security-Policy: connect-src 'none'",
        why: 'تُجبر سياسة CSP المتصفح نفسه على حظر أي طلبات شبكة صادرة مثل \u2066fetch\u2069 أو \u2066WebSocket\u2069.',
      },
    ],
    cspSnippetLabel: 'سياسة العزل الشبكي المفعّلة',
    offlineCheckHeading: 'تحقّق بنفسك خلال 10 ثوانٍ',
    offlineCheckSteps: [
      'افتح One-Click Key مرة واحدة حتى يخزّن المتصفح الملفات محلياً.',
      'فعّل وضع الطيران على جهازك (أو اختر وضع Offline من تبويب Network في DevTools).',
      'ولّد مفتاحاً تجريبياً وتأكد من تسجيل 0 طلبات شبكة صادرة.',
    ],
    tipHeading: 'نصيحة عملية لأقصى درجات الأمان',
    tipBody:
      'يمكنك فصل الواي فاي أو تفعيل وضع الطيران قبل الضغط على زر التوليد مباشرة في الخطوة 3؛ جميع مكتبات التشفير والخطوط مضمّنة محلياً وتعمل بكفاءة كاملة دون اتصال.',
  },
  lesson4: {
    stepNum: '4',
    title: 'التحميل والاستخدام',
    whatForBody:
      'بعد اكتمال التوليد تحصل على ملف المفتاح الجاهز للتحميل، وبصمات SHA لإضافتها في Firebase و Google Play، ونص Base64 لـ GitHub Actions، وإعدادات Gradle الجاهزة للنسخ.',
    breakdownHeading: 'شرح المخرجات وأين تستخدمها',
    fields: [
      {
        name: 'ملف المفتاح (.p12 · PKCS#12)',
        sample: 'demo-upload-key-keystore.p12',
        why: 'يحمّل حاوية \u2066RFC 7292 PKCS#12\u2069 حقيقية مدعومة مباشرة في \u2066Java 9+\u2069 و \u2066Android Studio\u2069 و \u2066Gradle\u2069. وإذا اشترطت أداة قديمة صيغة \u2066JKS\u2069، يمكنك تحويل الملف محلياً عبر \u2066keytool -importkeystore\u2069.',
      },
      {
        name: 'بصمة SHA-1',
        sample: 'DE:AD:BE:EF:10:20:30:40:50:60:70:80:90:AA:BB:CC:DD:EE:FF:01',
        why: 'تجزئة عامة تُضاف في Firebase Console لتفعيل تسجيل الدخول بحساب Google وخدمات OAuth.',
      },
      {
        name: 'بصمة SHA-256',
        sample:
          '01:23:45:67:89:AB:CD:EF:10:20:30:40:50:60:70:80:90:A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F',
        why: 'تُستخدم لروابط Android App Links و Play Integrity وللتأكد من تطابق مفتاح الرفع في Google Play Console.',
      },
      {
        name: 'نص Base64 (لـ GitHub Actions)',
        sample: 'KEYSTORE_BASE64 -> base64 --decode',
        why: 'صيغة نصية آمنة لحفظ المفتاح داخل GitHub Secrets وفك ترميزه مؤقتاً أثناء بناء الإصدار فقط.',
      },
    ],
    gradleHeading: 'مثال إعدادات Gradle signingConfigs',
    githubActionsLabel: 'مثال فك الترميز في GitHub Actions',
    keytoolLabel: 'مثال التحقق المحلي عبر Java 17+ keytool',
    tipHeading: 'خطأ خطير يجب تجنّبه',
    tipBody:
      'لا ترفع ملف \u2066.p12\u2069 (أو ملف \u2066.jks\u2069 المحوّل) أو كلمة المرور إلى Git أبداً حتى في المستودعات الخاصة. احتفظ بنسختين احتياطيتين مشفّرتين، واضغط «مسح الذاكرة وإعادة التعيين» فور الانتهاء من التحميل.',
  },
};
