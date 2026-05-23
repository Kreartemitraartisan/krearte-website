import { easings, durations } from "./easings";

// 🎨 FADE IN VARIANTS (Most common)
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: durations.normal / 1000,
      ease: easings.easeOut,
    },
  },
};

// 📤 FADE IN UP (For content reveal)
export const fadeInUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slow / 1000,
      ease: easings.easeOutExpo,
    },
  },
};

// 📥 FADE IN DOWN (For headers/navigation)
export const fadeInDownVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.slow / 1000,
      ease: easings.easeOutExpo,
    },
  },
};

// 🔍 SCALE IN (For cards/modals)
export const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.normal / 1000,
      ease: easings.easeOut,
    },
  },
};

// ➡️ SLIDE IN RIGHT (For drawers/sidebars)
export const slideInRightVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: durations.slow / 1000,
      ease: easings.easeOutExpo,
    },
  },
};

// 📦 STAGGER CONTAINER (For lists/grids)
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// 🎯 ITEM VARIANT (Use with stagger container)
export const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.normal / 1000,
      ease: easings.easeOut,
    },
  },
};