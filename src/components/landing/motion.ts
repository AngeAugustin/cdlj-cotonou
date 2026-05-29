import type { Variants } from "framer-motion";

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.1, ease: easeOutExpo },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, delay: i * 0.08, ease: "easeOut" },
  }),
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, delay: i * 0.1, ease: easeOutExpo },
  }),
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

export const float = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
  },
};

export const floatSlow = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 7, repeat: Infinity, ease: "easeInOut" },
  },
};
