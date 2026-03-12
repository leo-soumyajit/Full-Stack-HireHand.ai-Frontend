import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef, ReactNode } from "react";

interface StickySectionProps {
  children: ReactNode;
  className?: string;
  zIndex: number;
  isLast?: boolean;
}

function useParallaxTransform(value: MotionValue<number>, isLast: boolean) {
  const scale = useTransform(value, [0, 0.5, 1], [1, 1, 0.92]);
  const opacity = useTransform(value, [0, 0.6, 1], [1, 1, 0.4]);
  const y = useTransform(value, [0, 1], [0, -30]);
  
  if (isLast) {
    return { scale: 1, opacity: 1, y: 0 };
  }
  
  return { scale, opacity, y };
}

export function StickySection({ children, className = "", zIndex, isLast = false }: StickySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  const transforms = useParallaxTransform(scrollYProgress, isLast);

  return (
    <div 
      ref={sectionRef}
      className="sticky-section w-full will-change-transform"
      style={{ 
        position: 'sticky',
        /* Critical fix: This formula ensures the section only sticks when its 
           BOTTOM edge touches the viewport bottom. Allows scrolling through 
           entire content of tall sections before freezing. */
        top: 'calc(100vh - 100%)',
        zIndex,
        minHeight: '100vh',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <motion.div
        style={isLast ? {} : transforms}
        className={`w-full origin-top ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
