// components/ui/AnimatedSection.tsx
"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function AnimatedSection({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }} // 👈 Chỉ chạy khi 30% component vào view
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
