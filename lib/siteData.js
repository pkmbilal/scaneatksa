import {
  ScanLine,
  NotebookPen,
  MessageCircleMore,
  Smartphone,
  Languages,
  Store,
  Clock3,
  Wallet,
  BadgeCheck,
  QrCode,
  ArrowLeftRight,
  CircleHelp,
  Star,
} from "lucide-react";

export const heroData = {
  badge: "Smart QR menus for modern restaurants",
  title: "Professional QR Menu & Ordering System for",
  highlight: "Restaurants, Cafes & Food Brands",
  description:
    "Let customers scan, browse your menu, and place orders instantly. No app downloads. No printed menu hassle. Just a faster, cleaner, more modern restaurant experience.",
  primaryCta: {
    label: "Start Free Trial",
    href: "/auth/signup",
  },
  secondaryCta: {
    label: "Explore Restaurants",
    href: "/restaurants",
  },
  points: ["No app required", "Launch in minutes", "WhatsApp-friendly workflow"],
};

export const contactData = {
  phone: "+966531826230",
  displayPhone: "+966 531826230",
  whatsappNumber: "+966531826230",
  displayWhatsapp: "+966 531826230",
  email: "hello@codesudio.com",
  availability: "Sunday to Thursday · 9:00 AM to 6:00 PM",
  serviceArea: "Restaurants across Saudi Arabia",
};

export const trustStripData = {
  eyebrow: "Built for modern hospitality",
  title: "Everything your restaurant needs to go digital with QR menus",
  stats: [
    { value: "0", label: "Setup Fee" },
    { value: "5 min", label: "To Launch" },
    { value: "24/7", label: "Support" },
  ],
};

export const howItWorksData = {
  eyebrow: "How it works",
  title: "Get started in 3 simple steps",
  description:
    "A smooth ordering experience for customers and a simple workflow for restaurant owners.",
  steps: [
    {
      icon: QrCode,
      title: "1. Scan QR Code",
      description:
        "Customers scan the QR code using their phone camera and instantly open your menu.",
    },
    {
      icon: NotebookPen,
      title: "2. Browse the Menu",
      description:
        "Guests view items, prices, photos, and descriptions on a clean mobile-first menu.",
    },
    {
      icon: ArrowLeftRight,
      title: "3. Order Instantly",
      description:
        "Orders are sent directly through WhatsApp for quick, familiar, low-friction ordering.",
    },
  ],
};

export const featuresData = {
  eyebrow: "Core features",
  title: "Everything needed for a modern QR menu system",
  description:
    "Built to help restaurants launch faster, update menus easily, and serve customers better.",
  items: [
    {
      icon: ScanLine,
      title: "QR Code Per Table",
      description:
        "Generate unique QR codes for every table so customers can scan and start ordering instantly.",
    },
    {
      icon: NotebookPen,
      title: "Live Menu Updates",
      description:
        "Change prices, items, photos, and availability anytime without reprinting physical menus.",
    },
    {
      icon: MessageCircleMore,
      title: "WhatsApp Ordering",
      description:
        "Orders are sent directly through WhatsApp for a fast and familiar workflow.",
    },
    {
      icon: Smartphone,
      title: "Mobile-First Experience",
      description:
        "Menus are designed for phones first, with a smooth browsing and ordering experience.",
    },
    {
      icon: Languages,
      title: "Multi-Language Ready",
      description:
        "Serve local and international customers with multilingual digital menus.",
    },
    {
      icon: Store,
      title: "Built for Restaurants",
      description:
        "Perfect for cafes, restaurants, bakeries, food trucks, and dine-in table ordering.",
    },
  ],
};

export const benefitsData = {
  eyebrow: "Why restaurants choose ScanEat",
  title: "Designed to reduce friction and improve service",
  description:
    "ScanEat helps restaurants modernize menu access, reduce manual effort, and create a cleaner customer journey from table scan to completed order.",
  items: [
    {
      icon: Clock3,
      title: "Faster Service",
      text: "Guests browse and order without waiting for printed menus or staff availability.",
    },
    {
      icon: Wallet,
      title: "Lower Costs",
      text: "No recurring printing costs for menu updates, promotions, or seasonal changes.",
    },
    {
      icon: BadgeCheck,
      title: "More Professional",
      text: "Give your restaurant a clean, modern, branded digital ordering experience.",
    },
  ],
  panel: {
    title: "What owners care about",
    subtitle: "Restaurant success snapshot",
    stats: [
      { value: "Instant", text: "Menu access through QR scan" },
      { value: "Easy", text: "Manage items and pricing anytime" },
      { value: "Direct", text: "WhatsApp-based order flow" },
      { value: "Modern", text: "Professional digital experience" },
    ],
  },
};

export const featuredRestaurantsData = {
  eyebrow: "Featured restaurants",
  title: "Discover live restaurants using ScanEat",
  description:
    "Browse a few active restaurants and see how digital menus can look in the real world.",
  cta: {
    label: "View all restaurants",
    href: "/restaurants",
  },
  emptyState: {
    title: "No restaurants yet",
    description: "Be the first to join the platform and launch your digital menu.",
  },
};

export const faqData = {
  eyebrow: "FAQ",
  title: "Common questions from restaurant owners",
  icon: CircleHelp,
  items: [
    {
      q: "Do customers need to install an app?",
      a: "No. Customers simply scan the QR code using their phone camera and the menu opens in the browser.",
    },
    {
      q: "Can I update my menu anytime?",
      a: "Yes. You can edit items, prices, photos, and availability at any time from your dashboard.",
    },
    {
      q: "Can each table have its own QR code?",
      a: "Yes. You can generate QR codes for individual tables so orders can be associated more accurately.",
    },
    {
      q: "How long does setup take?",
      a: "Most restaurants can get started in minutes by creating an account, adding menu items, and generating QR codes.",
    },
    {
      q: "Is this suitable for small restaurants and cafes?",
      a: "Yes. ScanEat is ideal for cafes, restaurants, bakeries, and small food businesses that want a simple digital menu workflow.",
    },
  ],
};

export const finalCtaData = {
  icon: Star,
  title: "Ready to launch your restaurant QR menu?",
  description:
    "Start free, create your menu, generate QR codes, and give your customers a faster dining experience in just a few minutes.",
  primaryCta: {
    label: "Get Started Free",
    href: "/auth/signup",
  },
  secondaryCta: {
    label: "Browse Restaurants",
    href: "/restaurants",
  },
};

export const footerData = {
  brandName: "ScanEat",
  description:
    "ScanEat helps restaurants create professional digital menus and simple QR ordering experiences without the friction of traditional systems.",
  productLinks: [
    { label: "About", href: "/about" },
    { label: "Restaurants", href: "/restaurants" },
    { label: "Sign Up", href: "/auth/signup" },
    { label: "Sign In", href: "/auth/login" },
  ],
  companyLinks: [
    { label: "Help Center", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "Privacy Policy", href: "/privacy-policy" },
  ],
  copyright: "© 2026 ScanEat. All rights reserved.",
};

export const sections = [
  {
    title: "1. Introduction",
    content: `ScanEat (“we,” “our,” or “us”) respects your privacy and is committed to protecting personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use our website, platform, QR menu system, and related services.

This Privacy Policy applies to:
• restaurant owners, managers, and staff who create or manage ScanEat accounts;
• customers who browse restaurant menus or place orders through ScanEat-powered pages;
• visitors who interact with our website or support channels.`,
  },
  {
    title: "2. Information We Collect",
    content: `Depending on how you use ScanEat, we may collect the following categories of personal data:

A. Account and business information
• full name
• email address
• login credentials
• restaurant or business details
• support communications

B. Customer order and interaction data
• order details submitted through a ScanEat-powered menu
• table number or table identifier
• restaurant selection and menu interactions
• WhatsApp order routing details where applicable

C. Technical and usage data
• IP address
• browser type and device information
• pages viewed and actions taken on the platform
• date/time of access
• referral and diagnostic information
• cookies or similar technologies, where used

D. Password recovery and authentication data
• email address used for password reset
• security-related logs associated with authentication attempts

You should review your actual backend and analytics stack and add any extra data categories you collect, such as phone number, billing data, or location data, if applicable.`,
  },
  {
    title: "3. How We Collect Information",
    content: `We collect information:
• directly from you when you sign up, sign in, reset a password, submit restaurant information, or contact us;
• when customers browse menus or place orders through ScanEat-powered pages;
• automatically through the operation of the website, logs, cookies, and platform analytics;
• from integrations or third-party services you choose to use, such as WhatsApp-based workflows.`,
  },
  {
    title: "4. Why We Use Personal Data",
    content: `We use personal data to:
• create and manage accounts;
• provide QR menu, restaurant listing, and ordering functionality;
• route or facilitate customer orders;
• support restaurant onboarding and account administration;
• respond to support requests and service inquiries;
• secure the platform, detect abuse, and prevent fraud;
• improve performance, usability, and service quality;
• maintain operational records and comply with applicable legal obligations;
• communicate important product, service, or account-related notices.`,
  },
  {
    title: "5. Legal Basis and Compliance",
    content: `Where applicable, we process personal data in accordance with the laws and regulations of the Kingdom of Saudi Arabia, including the Personal Data Protection Law (PDPL) and related implementing regulations.

Where required, we will rely on an appropriate lawful basis for processing, including:
• performance of a contract or requested service;
• compliance with legal obligations;
• legitimate business purposes that do not override data subject rights;
• consent, where consent is required by applicable law.`,
  },
  {
    title: "6. Sharing of Information",
    content: `We do not sell personal data.

We may share personal data only where necessary with:
• service providers that help us host, maintain, secure, or operate the platform;
• communications providers or integrations used to facilitate ordering workflows, including WhatsApp-related processes where applicable;
• restaurant operators using ScanEat, to the extent necessary to process customer menu requests or orders;
• legal, regulatory, or governmental authorities where required by law or to protect rights, safety, and security;
• professional advisers in connection with legal, compliance, or corporate matters.

Any sharing should be limited to what is necessary for the specific purpose.`,
  },
  {
    title: "7. Cookies and Analytics",
    content: `We may use cookies, log files, pixels, or similar technologies to:
• keep users signed in;
• remember preferences;
• understand traffic and usage patterns;
• improve site performance and user experience;
• support security and troubleshooting.

If you use analytics tools, advertising pixels, session replay, or third-party tracking services, they should be specifically identified here.`,
  },
  {
    title: "8. Data Retention",
    content: `We retain personal data only for as long as reasonably necessary to fulfill the purposes described in this Privacy Policy, including service delivery, dispute resolution, security, recordkeeping, and legal compliance.

Retention periods may vary depending on:
• the nature of the data;
• whether the account remains active;
• legal or regulatory obligations;
• fraud prevention and platform security needs.`,
  },
  {
    title: "9. Data Security",
    content: `We implement reasonable technical, administrative, and organizational safeguards designed to protect personal data against unauthorized access, disclosure, alteration, loss, or misuse.

However, no website, platform, or internet transmission method is completely secure. We therefore cannot guarantee absolute security.`,
  },
  {
    title: "10. International Data Transfers",
    content: `If personal data is processed or stored outside the Kingdom of Saudi Arabia, we will take appropriate steps to ensure such transfers are made in accordance with applicable legal requirements and adequate safeguards.

If all your infrastructure is hosted inside Saudi Arabia, you can adjust this section accordingly.`,
  },
  {
    title: "11. Your Rights",
    content: `Subject to applicable law, individuals may have rights regarding their personal data, including the right to:
• request access to personal data;
• request correction or updating of inaccurate or incomplete data;
• request deletion where legally applicable;
• withdraw consent where processing is based on consent;
• inquire about how personal data is processed;
• submit complaints to the competent authority where permitted by law.

To exercise any privacy-related request, please contact us using the details below.`,
  },
  {
    title: "12. Restaurant Data and Customer Responsibility",
    content: `ScanEat may enable restaurants to present menus and facilitate customer ordering workflows. Restaurants using the platform may act as independent controllers of certain customer data they collect through their ScanEat-powered pages.

If you are a restaurant customer and have a question about a specific order, item, or restaurant handling of your information, you may also need to contact the relevant restaurant directly.`,
  },
  {
    title: "13. Children’s Privacy",
    content: `ScanEat is not intended for children, and we do not knowingly collect personal data from children in violation of applicable law. If you believe that a child has provided personal data through the platform, please contact us so we can review and take appropriate action.`,
  },
  {
    title: "14. Changes to This Privacy Policy",
    content: `We may update this Privacy Policy from time to time to reflect service changes, legal developments, or operational requirements. When we do, we will update the “Last Updated” date on this page. Your continued use of the service after any updates becomes effective will be subject to the revised policy.`,
  },
  {
    title: "15. Contact Us",
    content: `If you have any questions, requests, or complaints regarding this Privacy Policy or our handling of personal data, please contact us at:

Email: privacy@scaneatksa.com
Website: https://www.scaneatksa.com

You should replace the email above with your real privacy/support email and add your legal entity name and business address if available.`,
  },
];

export const principles = [
  {
    title: "Operational simplicity",
    text: "Restaurants need systems that reduce friction during service, not create more of it.",
  },
  {
    title: "Fast mobile experiences",
    text: "Guest interactions should feel instant, intuitive, and natural on any device.",
  },
  {
    title: "Practical product design",
    text: "Every feature should solve a real workflow problem for staff, managers, or guests.",
  },
];

export const items = [
  "Fast digital menu access for guests",
  "Cleaner ordering journey on mobile",
  "Flexible content updates for restaurant teams",
  "A more modern presentation layer for hospitality brands",
];

export const highlights = [
  "QR-powered digital menus",
  "Faster guest ordering flow",
  "Clean mobile-first interface",
  "Simple restaurant-side management",
];

