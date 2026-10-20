// All page copy lives here so text edits never touch layout code.

export const CONTACT = {
  email: 'mailto:hello@example.com',
  linkedin: '#',
  github: '#',
};

export interface Product {
  status: string;
  title: string;
  description: string;
  href?: string;
  /** Latin titles render left-to-right but stay aligned right. */
  ltr?: boolean;
}

/** Status lines with a live link are highlighted in the accent colour. */
export const isLive = (p: Product) => p.href !== undefined;

export const partnerProducts: Product[] = [
  {
    status: 'متاح الآن · trynaqua.com',
    title: 'حاسبة التطهير',
    description: 'احسب تطهير أسهمك السعودية بناء على بيانات موثوقة. ',
    href: 'https://trynaqua.com',
  },
  {
    status: 'متاح الآن · api.trynaqua.com',
    title: 'Naqua API',
    description: 'واجهة برمجية تتيح للمطورين والجهات دمج حساب تطهير الأسهم في منتجاتهم.',
    href: 'https://api.trynaqua.com/',
    ltr: true,
  },
  {
    status: 'منتج خاص',
    title: 'المتتبع',
    description: 'متابعة جميع أسهمك في صفحة واحدة.',
  },
];

export const teamProducts: Product[] = [
  {
    status: 'متاح الآن · wjihub.com',
    title: 'موقع WJIHub',
    description: 'الموقع الرئيسي لمجمع وادي جدة للابتكار، التابع لشركة وادي جدة، الذراع الاستثماري لجامعة الملك عبدالعزيز.',
    href: 'https://wjihub.com',
  },
  {
    status: 'متاح الآن · leadership.wjihub.com',
    title: 'مقياس المؤسس',
    description: 'تقييم ذاتي عربي مبني على IPIP-NEO، يساعد المؤسس على فهم نمطه القيادي ومجالات تأثيره.',
    href: 'https://leadership.wjihub.com',
  },
  {
    status: 'قريبًا',
    title: 'منصة التوظيف «وجيه»',
    description: 'تربط الشركات الناشئة بالباحثين عن فرص تدريب وتوظيف تعزز مساراتهم المهنية.',
  },
  {
    status: 'نسخة تجريبية داخلية',
    title: 'وكيل واتساب «وجيه»',
    description: 'دعم فني للمستفيدين مدعوم بالذكاء الاصطناعي',
  },
  {
    status: 'منتج داخلي',
    title: 'منتج الحاضنة',
    description: 'متابعة الشركات في حاضنة وادي جدة والربط مع المستشارين مع غرفة بيانات مخصصة لكل شركة',
  },
  {
    status: 'منتج داخلي',
    title: 'منصة حجز القاعات',
    description: 'منصة لحجز قاعات الاجتماعات للموظفين والشركات والزوار.',
  },
];

export const teamStats = [
  { value: '18', label: 'منتجًا في المحفظة' },
  { value: '12', label: 'عضوًا في الفريق' },
];

export const featuredSolo = {
  status: 'موقع · founder-path.com',
  title: 'مسار المؤسس',
  description: 'خطة تعلّم منهجية لبناء شركتك الناشئة من محتوى Y Combinator، بلا تسجيل دخول، ويُحفظ تقدمك تلقائيًا في المتصفح.',
  href: 'https://founder-path.com',
};

export const soloProducts: Product[] = [
  {
    status: 'تطبيق Mac · استخدام شخصي، يُطلق للجمهور قريبًا',
    title: 'Sequence',
    description: 'للاستماع إلى روايات أكسفورد، يجمع الفصول تلقائيًا لتجربة استماع أسهل.',
    ltr: true,
  },
  {
    status: 'تطبيق Mac · استخدام شخصي، يُطلق للجمهور قريبًا',
    title: 'نسق',
    description: 'محرر عربي لملفات ماركداون، بتجربة كتابة عربية أفضل.',
  },
];

export interface Role {
  period: string;
  /** Current roles get the accent colour on their date. */
  current?: boolean;
  title: string;
  org: string;
  description?: string;
}

export const roles: Role[] = [
  {
    period: '2025 حتى الآن',
    current: true,
    title: 'شريك مؤسس ومدير المنتجات',
    org: 'نقوة',
    description: 'إدارة الفريق والمنتجات والتسويق، وتنمية الإيرادات وقاعدة المستخدمين.',
  },
  {
    period: 'منذ يونيو 2026',
    current: true,
    title: 'مدير منتجات',
    org: 'مجمع وادي جدة للابتكار',
    description: 'محفظة من 18 منتجًا، وفريق من 12 عضوًا.',
  },
  {
    period: 'يناير – يونيو 2026 · جدة',
    title: 'برامج ريادة الأعمال',
    org: 'مجمع وادي جدة للابتكار',
    description: 'عضو في فريق تصميم الحاضنة، ومقيّم للشركات الناشئة، ومرشد في هاكاثون Jeddah AI بالتعاون مع Replit وCXSeed.',
  },
  {
    period: 'يونيو – أغسطس 2025 · جدة',
    title: 'متدرب تطوير الأعمال',
    org: 'شركة الريادة الاجتماعية',
  },
  {
    period: 'يونيو – أغسطس 2025',
    title: 'متدرب نمو المنتج',
    org: 'تطبيق نديم',
  },
  {
    period: 'فبراير – يوليو 2025',
    title: 'عضو مؤسس',
    org: 'نخلة · موسمي',
    description: 'تصميم الهوية، وإدارة العمليات اليومية، وتأسيس الحضور في وسائل التواصل، ثم تفرغت لتنمية نقوة.',
  },
];

/** Header links and the scene indexes during which each one is highlighted. */
export const navLinks = [
  { label: 'المنتجات', href: '#products', scenes: [1, 2, 3] },
  { label: 'الجهات', href: '#orgs', scenes: [4] },
];
