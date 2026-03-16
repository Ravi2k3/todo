"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";

const STAGGER_DELAY = 0.02;

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * STAGGER_DELAY,
      duration: 0.15,
      ease: "easeOut",
    },
  }),
};

const expandCollapse: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.15, ease: "easeOut" },
  },
};

export { motion, AnimatePresence, fadeInUp, expandCollapse, fadeIn };
