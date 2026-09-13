# 🍽️ ScanEat KSA

**QR-Based Digital Menu & WhatsApp Ordering Platform for Restaurants**

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp_Ordering-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://www.whatsapp.com/)

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-qr--food--menu--orpin.vercel.app-6366F1?style=flat-square)](https://qr-food-menu-orpin.vercel.app)

---

## 📋 Overview

**ScanEat KSA** is a SaaS platform built for the Saudi restaurant industry, letting customers scan a QR code to browse a digital menu and place orders directly via **WhatsApp** — no app download required. Built and maintained by **[Codesudio](https://www.codesudio.com)**.

---

## ✨ Features

ScanEat KSA is a full multi-role restaurant SaaS — a public ordering experience for diners, plus dedicated dashboards for owners, kitchen & waiter staff, and the platform admin.

### 🧑‍🍳 For Customers

**🔍 Discover Restaurants**
- Browse a searchable restaurant directory with filters for city, cuisine, and "pure veg only"
- Search by restaurant name or directly by dish

**📱 Digital Menu & QR Ordering**
- Contactless, mobile-friendly menu with hero banner, categories, photos, and veg/non-veg tags
- Live menu search, category filters, and per-item average ratings
- Scan a table QR code for automatic dine-in detection — no app download required

**🛒 Cart & Checkout**
- Persistent cart with dine-in, pickup, or delivery selection
- Guest checkout or place orders as a logged-in account for full order tracking
- Live price & availability re-check before the order is placed

**🔔 Order Tracking & Notifications**
- Real-time order status updates (new → preparing → ready → delivered) with sound/toast alerts
- One-tap **WhatsApp** hand-off — no app or account needed to hear back from the restaurant

**⭐ Ratings & Reviews**
- Rate the restaurant and individual dishes after an order, edit reviews later
- See the owner's public replies to reviews

**❤️ Favorites**
- Save favorite restaurants for quick reordering from the customer dashboard

**👤 Accounts & Profiles**
- Email sign-up with OTP verification, login, forgot/reset password
- Personal dashboard: order history, favorites, profile & password management
- **Request a Restaurant** — ask to have a new restaurant onboarded to the platform

**🌐 Multi-language & Theming**
- Full bilingual UI (English / Arabic) with right-to-left layout support
- Light & dark theme toggle

---

### 🏪 For Restaurant Owners & Staff

**🍔 Menu Management**
- Full CRUD for menu items and categories — name, price, description, photo, veg/non-veg
- Instant availability and "sold out" toggles without deleting items
- Responsive management views for desktop and mobile

**🧾 Order & Kitchen Workflow**
- Owner order inbox with card/list views, date-range filters, and channel badges (dine-in/pickup/delivery)
- Role-gated status workflow enforced server-side, with dedicated **Kitchen** (new → preparing → ready) and **Waiter** (ready → delivered) screens
- One-click WhatsApp message to the customer on every status change
- Live order sync across owner, kitchen, and waiter dashboards via Supabase Realtime — no refresh needed

**🎫 Tables & QR Codes**
- Bulk-generate tables with unique codes, plus a general online-ordering link
- Branded, printable per-table QR codes (preview, download, print)
- Activate, deactivate, or remove tables at any time

**📊 Analytics & Reviews**
- Revenue, order count, average order value, and channel-breakdown dashboards with trend charts
- Top-selling items report
- Restaurant & per-dish review inbox with reply-to-review

**👥 Staff & Roles**
- Owners create and manage Kitchen and Waiter staff accounts directly (enable/disable, no invite flow)
- Four distinct roles (Owner, Kitchen, Waiter, Admin) each with their own dashboard, scoped strictly to their own restaurant

**💳 Subscription & Billing**
- 30-day free trial, automatically started for every new restaurant
- 7-day grace period after expiry so the menu stays live while renewing
- Self-service "Request Renewal," with the platform admin notified in real time
- Full audit trail of every subscription action (trial started, extended, paid, suspended)

**🎨 Restaurant Profile & Branding**
- Editable name, phone/WhatsApp number, address, city, cover image, and cuisine tags
- Independent delivery/pickup toggles and a shareable public menu link

**🛠️ Platform Admin Console**
- Approve or reject restaurant onboarding requests, with full request history
- Manage users (roles, enable/disable, delete) and restaurants platform-wide
- Manual billing console — extend/comp subscriptions, record payments & references, suspend accounts
- Maintain master data for cities and cuisines used across the platform

---

## 🧱 Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI |
| Realtime & Data | Supabase (Postgres, Auth, Realtime, Storage) |
| Internationalization | next-intl (English / Arabic, RTL) |
| Theming | next-themes (light/dark) |
| QR Codes | `qrcode` + `html-to-image` (generate, preview, download, print) |
| UI Details | lucide-react icons, Sonner toasts |
| Hosting | Vercel |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/pkmbilal/scaneatksa.git
cd scaneatksa
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result. 🎉

You can start editing the page by modifying `app/page.js` — the page auto-updates as you edit.

---

## ☁️ Deployment

This project is deployed on **[Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)**.

Live at → **[qr-food-menu-orpin.vercel.app](https://qr-food-menu-orpin.vercel.app)**

For more on deploying Next.js apps, see the [official deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs) — learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) — an interactive Next.js tutorial

---

## 🏗️ Built & Maintained by

### [Codesudio](https://www.codesudio.com)
**Custom Software Development • Jubail, Saudi Arabia**

[![Website](https://img.shields.io/badge/🌐_Website-codesudio.com-2ea44f?style=for-the-badge)](https://www.codesudio.com)

© 2026 Codesudio. All rights reserved.
