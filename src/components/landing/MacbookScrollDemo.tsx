import React from "react";
import { MacbookScroll } from "@/components/ui/macbook-scroll";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { Sparkles } from "lucide-react";
import dashboardImage from "@/assets/dashboard-preview.png";

export function MacbookScrollDemo() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-[#050505]"
    >
      {/* Radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.15)_0%,_transparent_70%)]" />
      
      <div className="relative z-10">
        <MacbookScroll
          title={
            <div className="flex flex-col items-center gap-4">
              <span className="text-4xl md:text-5xl font-bold text-white font-display tracking-tight">
                The Ultimate{" "}
                <PointerHighlight
                  rectangleClassName="bg-primary/25 border border-primary/40"
                  pointerClassName="text-primary"
                >
                  AI Recruiting Engine
                </PointerHighlight>
                .
              </span>
              <span className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                Scroll to see how HireHand AI transforms a simple JD into a complete interview kit.
              </span>
            </div>
          }
          badge={
            <div className="flex items-center gap-2 -rotate-12 transform bg-gradient-to-r from-primary to-accent px-4 py-2 rounded-full shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-white font-semibold text-sm">HIREHAND AI</span>
            </div>
          }
          src={dashboardImage}
          showGradient={true}
        />
      </div>
    </section>
  );
}
