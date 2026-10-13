"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Header({
  lang,
  items,
}: {
  lang: string;
  items: { href: string; label: string }[];
}) {
  const locales = [
    { href: "/zh", label: "简" },
    { href: "/zh-Hant", label: "繁" },
    { href: "/en", label: "EN" },
  ];

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <Link href={`/${lang}`} className="pointer-events-auto text-sm font-black tracking-[0.28em] text-white">
        AROMA
      </Link>
      <nav className="pointer-events-auto flex items-center justify-end gap-x-3 sm:gap-x-5">
        {locales.map((item) => (
          <motion.div key={item.href} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 420, damping: 18 }}>
            <Link
              href={item.href}
              className={`text-[11px] font-bold tracking-wide sm:tracking-widest ${item.href === `/${lang}` ? "text-white" : "text-white/45"}`}
            >
              {item.label}
            </Link>
          </motion.div>
        ))}
        {items.map((item) => (
          <motion.div key={item.href} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 420, damping: 18 }}>
            <Link href={item.href} className="text-[11px] font-bold tracking-wide text-white/80 hover:text-white sm:text-xs sm:tracking-widest">
              {item.label}
            </Link>
          </motion.div>
        ))}
      </nav>
    </header>
  );
}
