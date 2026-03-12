"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface MacbookScrollProps {
  src?: string;
  showGradient?: boolean;
  title?: React.ReactNode;
  badge?: React.ReactNode;
}

export function MacbookScroll({
  src,
  showGradient,
  title,
  badge,
}: MacbookScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (window && window.innerWidth < 768) {
      setIsMobile(true);
    }
  }, []);

  const scaleX = useTransform(
    scrollYProgress,
    [0, 0.3],
    [1.2, isMobile ? 1 : 1.5]
  );
  const scaleY = useTransform(
    scrollYProgress,
    [0, 0.3],
    [0.6, isMobile ? 1 : 1.5]
  );
  const translate = useTransform(scrollYProgress, [0, 1], [0, 1500]);
  const rotate = useTransform(scrollYProgress, [0.1, 0.12, 0.3], [-28, -28, 0]);
  const textTransform = useTransform(scrollYProgress, [0, 0.3], [0, 100]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div
      ref={ref}
      className="min-h-[200vh] flex flex-col items-center py-0 md:py-40 justify-start flex-shrink-0 [perspective:800px] transform md:scale-100 scale-[0.35] sm:scale-50"
    >
      <motion.h2
        style={{
          translateY: textTransform,
          opacity: textOpacity,
        }}
        className="dark:text-white text-neutral-800 text-3xl font-bold mb-20 text-center"
      >
        {title || (
          <span>
            This Macbook is built with Tailwindcss. <br /> No kidding.
          </span>
        )}
      </motion.h2>
      {/* Lid */}
      <Lid
        src={src}
        scaleX={scaleX}
        scaleY={scaleY}
        rotate={rotate}
        translate={translate}
      />
      {/* Base area */}
      <div className="h-[22rem] w-[32rem] bg-gray-200 dark:bg-[#272729] rounded-2xl overflow-hidden relative -z-10">
        {/* Above keyboard bar */}
        <div className="h-10 w-full relative">
          <div className="absolute inset-x-0 mx-auto w-[80%] h-4 bg-[#050505]" />
        </div>
        <div className="flex relative">
          <div className="mx-auto w-[10%] overflow-hidden h-full">
            <SpeakerGrid />
          </div>
          <div className="mx-auto w-[80%] h-full">
            <Keypad />
          </div>
          <div className="mx-auto w-[10%] overflow-hidden h-full">
            <SpeakerGrid />
          </div>
        </div>
        <Trackpad />
        <div className="h-2 w-20 mx-auto inset-x-0 absolute bottom-0 bg-gradient-to-t from-[#272729] to-[#050505] rounded-tr-3xl rounded-tl-3xl" />
        {showGradient && (
          <div className="h-40 w-full absolute bottom-0 inset-x-0 bg-gradient-to-t dark:from-black from-white via-white dark:via-black to-transparent z-50" />
        )}
        {badge && <div className="absolute bottom-4 left-4">{badge}</div>}
      </div>
    </div>
  );
}

export const Lid = ({
  scaleX,
  scaleY,
  rotate,
  translate,
  src,
}: {
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
  rotate: MotionValue<number>;
  translate: MotionValue<number>;
  src?: string;
}) => {
  return (
    <div className="relative [perspective:800px]">
      <div
        style={{
          transform: "perspective(800px) rotateX(-25deg) translateZ(0px)",
          transformOrigin: "bottom",
          transformStyle: "preserve-3d",
        }}
        className="h-[12rem] w-[32rem] bg-[#010101] rounded-2xl p-2 relative"
      >
        <div
          style={{
            boxShadow: "0px 2px 0px 2px var(--neutral-900) inset",
          }}
          className="absolute inset-0 bg-[#010101] rounded-lg flex items-center justify-center"
        >
          <span className="text-white font-display font-bold text-[3rem] opacity-[0.04] tracking-tight">
            HIREHAND AI
          </span>
        </div>
      </div>
      <motion.div
        style={{
          scaleX: scaleX,
          scaleY: scaleY,
          rotateX: rotate,
          translateY: translate,
          transformStyle: "preserve-3d",
          transformOrigin: "top",
        }}
        className="h-96 w-[32rem] absolute inset-0 bg-[#010101] rounded-2xl p-2"
      >
        <div className="absolute inset-0 bg-[#272729] rounded-lg" />
        <img
          src={src || "/placeholder.svg"}
          alt="Dashboard preview"
          className="object-cover object-left-top absolute rounded-lg inset-0 h-full w-full"
        />
      </motion.div>
    </div>
  );
};

export const Trackpad = () => {
  return (
    <div
      className="w-[40%] mx-auto h-32 rounded-xl my-1"
      style={{
        boxShadow: "0px 0px 1px 1px #00000020 inset",
      }}
    ></div>
  );
};

export const Keypad = () => {
  return (
    <div className="h-full rounded-md bg-[#050505] mx-1 p-1">
      {/* Row 1 */}
      <Row>
        <KBtn className="w-10 items-end justify-start pl-[4px] pb-[2px]">esc</KBtn>
        {Array.from({ length: 12 }).map((_, i) => (
          <KBtn key={i}>
            <span className="block">F{i + 1}</span>
          </KBtn>
        ))}
        <KBtn><span className="block">⏻</span></KBtn>
      </Row>

      {/* Row 2 */}
      <Row>
        <KBtn><span>~</span><span>`</span></KBtn>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((n) => (
          <KBtn key={n}><span>{n}</span></KBtn>
        ))}
        <KBtn><span>-</span></KBtn>
        <KBtn><span>=</span></KBtn>
        <KBtn className="w-10 items-end justify-end pr-[4px] pb-[2px]">delete</KBtn>
      </Row>

      {/* Row 3 */}
      <Row>
        <KBtn className="w-10 items-end justify-start pl-[4px] pb-[2px]">tab</KBtn>
        {["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map((l) => (
          <KBtn key={l}><span>{l}</span></KBtn>
        ))}
        <KBtn><span>[</span></KBtn>
        <KBtn><span>]</span></KBtn>
        <KBtn><span>\</span></KBtn>
      </Row>

      {/* Row 4 */}
      <Row>
        <KBtn className="w-[2.8rem] items-end justify-start pl-[4px] pb-[2px]">caps</KBtn>
        {["A", "S", "D", "F", "G", "H", "J", "K", "L"].map((l) => (
          <KBtn key={l}><span>{l}</span></KBtn>
        ))}
        <KBtn><span>;</span></KBtn>
        <KBtn><span>'</span></KBtn>
        <KBtn className="w-[2.85rem] items-end justify-end pr-[4px] pb-[2px]">return</KBtn>
      </Row>

      {/* Row 5 */}
      <Row>
        <KBtn className="w-[3.65rem] items-end justify-start pl-[4px] pb-[2px]">shift</KBtn>
        {["Z", "X", "C", "V", "B", "N", "M"].map((l) => (
          <KBtn key={l}><span>{l}</span></KBtn>
        ))}
        <KBtn><span>,</span></KBtn>
        <KBtn><span>.</span></KBtn>
        <KBtn><span>/</span></KBtn>
        <KBtn className="w-[3.65rem] items-end justify-end pr-[4px] pb-[2px]">shift</KBtn>
      </Row>

      {/* Row 6 */}
      <Row>
        <KBtn className="w-8"><span>fn</span></KBtn>
        <KBtn className="w-8"><span>⌃</span></KBtn>
        <KBtn className="w-8"><span>⌥</span></KBtn>
        <KBtn className="w-8"><span>⌘</span></KBtn>
        <KBtn className="w-[8.2rem]"></KBtn>
        <KBtn className="w-8"><span>⌘</span></KBtn>
        <KBtn className="w-8"><span>⌥</span></KBtn>
        <div className="w-[4.9rem] mt-[2px] h-6 p-[0.5px] rounded-[4px] flex flex-col justify-end items-center">
          <KBtn className="w-6 h-3"><span>▲</span></KBtn>
          <div className="flex">
            <KBtn className="w-6 h-3"><span>◀</span></KBtn>
            <KBtn className="w-6 h-3"><span>▼</span></KBtn>
            <KBtn className="w-6 h-3"><span>▶</span></KBtn>
          </div>
        </div>
      </Row>
    </div>
  );
};

export const Row = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex gap-[2px] mb-[2px] w-full flex-shrink-0">{children}</div>
  );
};

export const KBtn = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "p-[0.5px] rounded-[4px]",
        "bg-gradient-to-b from-white/10 to-transparent",
        className
      )}
    >
      <div
        className="h-6 bg-[#0A090D] rounded-[3.5px] flex items-center justify-center"
        style={{
          boxShadow:
            "0px -0.5px 2px 0 #0D0D0F inset, -0.5px 0px 2px 0 #0D0D0F inset",
        }}
      >
        <div className="text-[5px] w-full flex justify-center items-center flex-col text-neutral-200">
          {children}
        </div>
      </div>
    </div>
  );
};

export const SpeakerGrid = () => {
  return (
    <div
      className="flex px-[0.5px] gap-[2px] mt-2 h-40"
      style={{
        backgroundImage:
          "radial-gradient(circle, #08080A 0.5px, transparent 0.5px)",
        backgroundSize: "3px 3px",
      }}
    ></div>
  );
};
