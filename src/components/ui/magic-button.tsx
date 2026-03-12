"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface MagicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function MagicButton({ children, className, ...props }: MagicButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex h-14 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-transform duration-300 hover:scale-105 active:scale-95",
        className
      )}
      {...props}
    >
      {/* Animated gradient border */}
      <motion.span
        className="absolute inset-[-1000%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{
          background: "conic-gradient(from 90deg at 50% 50%, hsl(var(--primary)) 0%, hsl(var(--accent)) 50%, hsl(var(--primary)) 100%)",
        }}
      />
      
      {/* Button content */}
      <span className="relative inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-background px-8 py-3 text-base font-bold text-foreground backdrop-blur-3xl gap-2 font-display tracking-wide">
        {children}
      </span>
    </button>
  );
}
