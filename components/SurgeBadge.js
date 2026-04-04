// components/SurgeBadge.js
import { motion } from 'framer-motion';

export default function SurgeBadge({ multiplier, isAnimated = true }) {
  if (multiplier <= 1.0) return null;
  
  const badge = (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 rounded-full text-white text-xs font-semibold shadow-lg">
      <span className="text-yellow-300">⚡</span>
      <span>{multiplier.toFixed(1)}x Surge</span>
    </div>
  );
  
  if (isAnimated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500 }}
        whileHover={{ scale: 1.05 }}
      >
        {badge}
      </motion.div>
    );
  }
  
  return badge;
}