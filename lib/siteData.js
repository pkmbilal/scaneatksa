// Text content for hero/trustStrip/howItWorks/features/benefits/featuredRestaurants/
// faq/finalCta/footer now lives in messages/{en,ar}/home.json (namespace "home"),
// read directly in each components/home/* component via getTranslations(). Icons for
// those sections are defined locally in the components that render them.
// The privacy policy sections now live in messages/{en,ar}/privacyPolicy.json.
// The objects below only keep non-text data (hrefs, keys) that stays the same
// across locales and is still passed in as props.

export const heroData = {
  primaryCta: {
    href: "/auth/signup",
  },
  secondaryCta: {
    href: "/restaurants",
  },
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

export const featuredRestaurantsData = {
  cta: {
    href: "/restaurants",
  },
};

export const finalCtaData = {
  primaryCta: {
    href: "/auth/signup",
  },
  secondaryCta: {
    href: "/restaurants",
  },
};

export const footerData = {
  productLinks: [
    { key: "about", href: "/about" },
    { key: "restaurants", href: "/restaurants" },
    { key: "signUp", href: "/auth/signup" },
    { key: "signIn", href: "/auth/login" },
  ],
  companyLinks: [
    { key: "helpCenter", href: "#" },
    { key: "contactUs", href: "#" },
    { key: "privacyPolicy", href: "/privacy-policy" },
  ],
};

