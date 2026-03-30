import React, { useState, useRef, useCallback, useEffect } from "react";
import { GripVertical, LayoutTemplate, Rows3, SlidersHorizontal } from "lucide-react";

interface JDComparisonSliderProps {
  beforeContent: React.ReactNode;
  afterContent: React.ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
}

type ViewMode = "slider" | "tabs" | "split";

export function JDComparisonSlider({
  beforeContent,
  afterContent,
  beforeLabel = "Original",
  afterLabel = "Enhanced",
}: JDComparisonSliderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [activeTab, setActiveTab] = useState<"before" | "after">("after");

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
  const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Settings Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 border border-border/50 rounded-xl px-4 py-3">
        <h4 className="text-sm font-semibold text-muted-foreground">View Mode</h4>
        <div className="flex bg-muted/40 p-1 rounded-lg border border-border/40">
          <button
            onClick={() => setViewMode("slider")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === "slider" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Advance View
          </button>
          <button
            onClick={() => setViewMode("tabs")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === "tabs" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Rows3 className="h-3.5 w-3.5" />
            Tab View
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === "split" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            Split View
          </button>
        </div>
      </div>

      {/* RENDER MODES */}
      
      {viewMode === "tabs" && (
        <div className="w-full border border-border/50 rounded-xl overflow-hidden shadow-sm">
          <div className="flex bg-muted/20 border-b border-border/50">
            <button
              onClick={() => setActiveTab("before")}
              className={`flex-1 flex justify-center py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                activeTab === "before" 
                  ? "bg-[hsl(var(--destructive)/0.05)] text-destructive border-b-2 border-destructive" 
                  : "text-muted-foreground hover:bg-muted/30"
              }`}
            >
              {beforeLabel}
            </button>
            <button
              onClick={() => setActiveTab("after")}
              className={`flex-1 flex justify-center py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                activeTab === "after" 
                  ? "bg-[hsl(var(--primary)/0.05)] text-primary border-b-2 border-primary" 
                  : "text-muted-foreground hover:bg-muted/30"
              }`}
            >
              {afterLabel}
            </button>
          </div>
          <div className="p-1">
            {activeTab === "before" ? beforeContent : afterContent}
          </div>
        </div>
      )}

      {viewMode === "split" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-destructive/20 rounded-xl overflow-hidden relative bg-background/50">
            <div className="bg-[hsl(var(--destructive)/0.05)] border-b border-destructive/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-destructive">
              {beforeLabel}
            </div>
            {beforeContent}
          </div>
          <div className="border border-primary/20 rounded-xl overflow-hidden relative bg-background/50">
            <div className="bg-[hsl(var(--primary)/0.05)] border-b border-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary">
              {afterLabel}
            </div>
            {afterContent}
          </div>
        </div>
      )}

      {viewMode === "slider" && (
        <div className="relative w-full select-none rounded-xl overflow-hidden border border-border/50 shadow-sm">
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-between pointer-events-none">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-br-lg"
              style={{
                background: "linear-gradient(135deg, hsl(var(--destructive)/0.15), hsl(var(--destructive)/0.05))",
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
                background: "linear-gradient(135deg, hsl(var(--primary)/0.15), hsl(var(--primary)/0.05))",
                color: "hsl(var(--primary))",
                border: "1px solid hsl(var(--primary)/0.2)",
                borderTop: "none",
                borderRight: "none",
              }}
            >
              {afterLabel}
            </span>
          </div>

          <div
            ref={containerRef}
            className="relative w-full cursor-ew-resize min-h-[700px]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-full pt-8">{beforeContent}</div>

            <div
              className="absolute top-0 left-0 h-full w-full overflow-hidden pt-8"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              {afterContent}
            </div>

            <div
              className="absolute top-0 bottom-0 z-30 flex items-center justify-center"
              style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <div className="absolute top-0 bottom-0 w-[2px] bg-primary/60" />
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
      )}
    </div>
  );
}
