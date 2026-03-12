import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50);
    });
    return () => unsubscribe();
  }, [scrollY]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
    >
      <motion.nav
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          flex items-center justify-between rounded-full border shadow-lg gap-6
          ${isScrolled 
            ? "max-w-4xl w-[90%] md:w-[65%] py-2.5 px-5 md:px-8 bg-background/70 backdrop-blur-xl border-border/20" 
            : "max-w-5xl w-[95%] md:w-[75%] py-3.5 px-6 md:px-10 bg-background/30 backdrop-blur-md border-border/10"
          }
        `}
      >
        {/* Left - Brand Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <motion.div 
            layout
            className={`flex items-center justify-center rounded-lg gradient-primary ${isScrolled ? "h-7 w-7" : "h-8 w-8"}`}
          >
            <Sparkles className={`text-primary-foreground ${isScrolled ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
          </motion.div>
          <motion.span 
            layout
            className={`font-extrabold tracking-tight gradient-text ${isScrolled ? "text-base" : "text-lg md:text-xl"}`}
          >
            HireHand AI
          </motion.span>
        </Link>

        {/* Center - Navigation Links (Desktop only, hidden when scrolled on tablet) */}
        <motion.div 
          layout
          className={`hidden items-center gap-8 ${isScrolled ? "lg:flex" : "md:flex"}`}
        >
          <a 
            href="#features" 
            className="relative text-sm text-muted-foreground transition-all duration-300 whitespace-nowrap hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
          >
            Features
          </a>
          <a 
            href="#testimonials" 
            className="relative text-sm text-muted-foreground transition-all duration-300 whitespace-nowrap hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
          >
            Testimonials
          </a>
          <a 
            href="#how-it-works" 
            className="relative text-sm text-muted-foreground transition-all duration-300 whitespace-nowrap hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
          >
            How It Works
          </a>
        </motion.div>

        {/* Right - Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <Link to="/login">
            <motion.div layout>
              <Button
                className={`rounded-full gradient-primary text-primary-foreground hover:opacity-90 whitespace-nowrap ${
                  isScrolled ? "px-4 text-xs h-8" : "px-5 md:px-6 text-sm h-9"
                }`}
              >
                Get Started
              </Button>
            </motion.div>
          </Link>
        </div>
      </motion.nav>
    </motion.header>
  );
}
