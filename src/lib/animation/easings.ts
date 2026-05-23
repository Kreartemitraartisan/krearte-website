// 🎬 ELEGANT EASING CURVES
// Custom cubic-bezier values for smooth, premium feel animations

export const easings = {
  // Smooth start & end (most versatile)
  easeOut: [0.25, 1, 0.5, 1] as const,
  
  // Quick start, smooth end (for enter animations)
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  
  // Smooth start, quick end (for exit animations)
  easeInExpo: [0.7, 0, 0.84, 0] as const,
  
  // Balanced smooth (for continuous motion)
  easeInOut: [0.65, 0, 0.35, 1] as const,
  
  // Subtle bounce (for micro-interactions)
  easeOutBack: [0.34, 1.56, 0.64, 1] as const,
  
  // Natural deceleration (for scroll-based)
  easeOutCirc: [0, 0.55, 0.45, 1] as const,
  
  // Quick snap (for UI feedback)
  easeOutQuad: [0.25, 0.46, 0.45, 0.94] as const,
};

// 🎯 PRESET DURATIONS (in milliseconds)
export const durations = {
  instant: 0,
  fast: 200,
  normal: 350,
  slow: 500,
  slower: 700,
  deliberate: 1000,
};

// 📦 EXPORT COMBINED TRANSITION CONFIG
export const createTransition = (
  duration: keyof typeof durations = "normal",
  easing: keyof typeof easings = "easeOut"
) => ({
  duration: durations[duration] / 1000, // Convert to seconds for Framer Motion
  ease: easings[easing],
});