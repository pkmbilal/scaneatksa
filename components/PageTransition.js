"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// Subtle native-app-style fade/slide between route changes. Kept to a small
// translate + opacity (no layout animation) so it can't affect scroll
// position or fixed-position siblings like Navbar/MobileTabBar.
export default function PageTransition({ children }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
