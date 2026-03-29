import React, { useState, useRef, useCallback, useEffect } from "react";
import { GripVertical } from "lucide-react";

interface JDComparisonSliderProps {
  beforeContent: React.ReactNode;
  afterContent: React.ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
}

export function JDComparisonSlider({
  beforeContent,
  afterContent,
  beforeLabel = "Before",
  afterLabel = "After",
}: JDComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newPosition = ((clientX - rect.left) / rect.width) * 100;
      newPosition = Math.max(2, Math.min(98, newPosition));
      setSliderPosition(newPosition);
    },
    [isDragging]
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const handleTouchStart = () => setIsDragging(true);
  const handleTouchEnd = () => setIsDragging(false);
  const handleTouchMove = (e: React.TouchEvent) =>
    handleMove(e.touches[0].clientX);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  return (
    <div className="relative w-full select-none rounded-xl overflow-hidden border border-border/50">
      {/* Labels */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between pointer-events-none">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-br-lg"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--destructive)/0.15), hsl(var(--destructive)/0.05))",
            color: "hsl(var(--destructive))",
            border: "1px solid hsl(var(--destructive)/0.2)",
            borderTop: "none",
            borderLeft: "none",
          }}
        >
          {beforeLabel}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-bl-lg"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary)/0.15), hsl(var(--primary)/0.05))",
            color: "hsl(var(--primary))",
            border: "1px solid hsl(var(--primary)/0.2)",
            borderTop: "none",
            borderRight: "none",
          }}
        >
          {afterLabel}
        </span>
      </div>

      {/* Container */}
      <div
        ref={containerRef}
        className="relative w-full cursor-ew-resize"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Before (full width, bottom layer) */}
        <div className="w-full pt-8">{beforeContent}</div>

        {/* After (overlaid, clipped from left) */}
        <div
          className="absolute top-0 left-0 h-full w-full overflow-hidden pt-8"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          {afterContent}
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 z-30 flex items-center justify-center"
          style={{
            left: `${sliderPosition}%`,
            transform: "translateX(-50%)",
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Vertical line */}
          <div className="absolute top-0 bottom-0 w-[2px] bg-primary/60" />

          {/* Handle knob */}
          <div
            className={`relative z-10 flex items-center justify-center h-10 w-10 rounded-full border-2 border-primary/60 bg-background shadow-lg transition-all duration-200 ease-in-out ${
              isDragging
                ? "scale-110 shadow-[0_0_20px_-5px_hsl(var(--primary))] border-primary"
                : "hover:border-primary hover:shadow-[0_0_15px_-5px_hsl(var(--primary))]"
            }`}
          >
            <GripVertical className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
