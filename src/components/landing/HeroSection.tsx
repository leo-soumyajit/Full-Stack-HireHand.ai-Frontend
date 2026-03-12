import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, ArrowRight } from "lucide-react";
import { MagicButton } from "@/components/ui/magic-button";
import { LogoMarquee } from "@/components/landing/LogoMarquee";
import profileAlex from "@/assets/profile-alex.jpg";
import profileSarah from "@/assets/profile-sarah.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-between overflow-hidden px-4 py-8 md:py-20 pb-4 md:pb-20 bg-background">
      {/* Dot Grid Pattern Background - on top of solid bg */}
      <div className="absolute inset-0 bg-dot-grid" />
      
      {/* Central gradient glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-transparent blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4 md:space-y-8"
          >
            {/* Two-Tone Industrial Typography */}
            <div className="space-y-0.5 md:space-y-1">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9]"
              >
                <span className="text-foreground">HireHand AI.</span>
              </motion.h1>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] text-muted-foreground/40"
              >
                Recruiting Reinvented.
              </motion.h2>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm md:text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              The only AI-powered platform that parses JDs, generates interview questions, and ranks talent instantly.
            </motion.p>

            {/* Magic Border Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/login">
                <MagicButton>
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </MagicButton>
              </Link>
            </motion.div>

            {/* Trust Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-1 md:space-y-2"
            >
              <p className="text-muted-foreground font-medium">
                Trusted by <span className="text-foreground">50k+ users</span>
              </p>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 md:h-5 md:w-5 ${i < 4 ? "fill-primary text-primary" : "fill-primary/50 text-primary/50"}`}
                    />
                  ))}
                </div>
                <span className="text-foreground font-semibold text-sm md:text-base">4.5/5</span>
                <span className="text-muted-foreground text-sm md:text-base">(14k Reviews)</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Profile Images with Connecting Line (Desktop) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:flex justify-center items-center min-h-[500px]"
          >
            {/* Top Profile - Alex Chen */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="text-right mb-3 self-start -ml-24">
                <p className="text-foreground font-semibold">Alex Chen</p>
                <p className="text-muted-foreground text-sm">Senior Architect</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 blur-md scale-110" />
                <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-primary/30 ring-2 ring-accent/20 ring-offset-4 ring-offset-background">
                  <img
                    src={profileAlex}
                    alt="Alex Chen - Senior Architect"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Profile - Sarah Jenkins */}
            <div className="absolute bottom-8 right-12 flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/50 to-primary/50 blur-md scale-110" />
                <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-accent/30 ring-2 ring-primary/20 ring-offset-4 ring-offset-background">
                  <img
                    src={profileSarah}
                    alt="Sarah Jenkins - Talent Acquisition Lead"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="text-center mt-3">
                <p className="text-foreground font-semibold">Sarah Jenkins</p>
                <p className="text-muted-foreground text-sm">Talent Acquisition Lead</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile Profile Images Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:hidden relative mt-6 md:mt-12 flex justify-center items-center min-h-[280px] sm:min-h-[320px]"
        >
          {/* Top Profile - Alex Chen */}
          <div className="absolute top-0 left-6 sm:left-8 flex flex-col items-center">
            <div className="text-left mb-1.5">
              <p className="text-foreground font-semibold text-xs sm:text-sm">Alex Chen</p>
              <p className="text-muted-foreground text-[10px] sm:text-xs">Senior Architect</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 blur-md scale-110" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 sm:border-4 border-primary/30 ring-1 sm:ring-2 ring-accent/20 ring-offset-1 sm:ring-offset-2 ring-offset-background">
                <img
                  src={profileAlex}
                  alt="Alex Chen - Senior Architect"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Bottom Profile - Sarah Jenkins */}
          <div className="absolute bottom-0 right-6 sm:right-8 flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/50 to-primary/50 blur-md scale-110" />
              <div className="relative w-14 h-14 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 sm:border-4 border-accent/30 ring-1 sm:ring-2 ring-primary/20 ring-offset-1 sm:ring-offset-2 ring-offset-background">
                <img
                  src={profileSarah}
                  alt="Sarah Jenkins - Talent Acquisition Lead"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="text-center mt-1.5">
              <p className="text-foreground font-semibold text-xs sm:text-sm">Sarah Jenkins</p>
              <p className="text-muted-foreground text-[10px] sm:text-xs">Talent Acquisition Lead</p>
            </div>
          </div>
        </motion.div>

        {/* Logo Marquee */}
        {/* Logo Marquee - pushed to bottom with mt-auto */}
        <div className="mt-auto pt-4 md:pt-0">
          <LogoMarquee />
        </div>
      </div>
    </section>
  );
}
