"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "scaneat:installPromptDismissed";

// Custom "Add to Home Screen" banner. The manifest/icons (app/manifest.js,
// app/icon.png, app/apple-icon.png) already make the site installable, but
// browsers don't surface that on their own -- this listens for the native
// beforeinstallprompt event and offers it explicitly. That event is Chromium
// -only (not fired by iOS/desktop Safari), so this is a no-op there rather
// than showing anything broken.
export default function InstallPrompt() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  // Mirrors MobileTabBar's gating: only offer the install banner on routes
  // where that bar (and the safe-area math below) already applies.
  const hidePrompt =
    pathname?.startsWith("/auth/") ||
    pathname === "/dashboard" ||
    pathname?.startsWith("/dashboard/admin") ||
    pathname?.startsWith("/dashboard/owner") ||
    pathname?.startsWith("/dashboard/kitchen") ||
    pathname?.startsWith("/dashboard/waiter") ||
    pathname?.startsWith("/menu/");

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {}

    if (dismissed) return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    const handleAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {}
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (hidePrompt) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-x-4 z-40 md:hidden"
          style={{ bottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="flex items-center gap-3 rounded-2xl border bg-background/95 p-3 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.25)] backdrop-blur">
            <Image
              src="/scaneat-logo.png"
              alt="ScanEat"
              width={40}
              height={40}
              className="shrink-0 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{t("install.title")}</p>
              <p className="truncate text-xs text-muted-foreground">{t("install.description")}</p>
            </div>
            <button
              type="button"
              onClick={handleInstall}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white"
            >
              <Download className="size-3.5" />
              {t("install.installButton")}
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label={t("install.dismissButton")}
              className="shrink-0 text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
