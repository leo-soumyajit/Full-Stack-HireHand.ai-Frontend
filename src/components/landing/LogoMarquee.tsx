import { motion } from "framer-motion";

const logos = [
  {
    name: "Microsoft",
    url: "https://res.cloudinary.com/dkgwi1xvx/image/upload/v1770376090/Microsoft_logo__2012.svg_tbmrhj.png",
  },
  {
    name: "Amazon",
    url: "https://res.cloudinary.com/dkgwi1xvx/image/upload/v1770376090/amazon-rebrand-2025_dezeen_2364_col_1-1-removebg-preview_z8ny5y.png",
  },
  {
    name: "Google",
    url: "https://res.cloudinary.com/dkgwi1xvx/image/upload/v1770376090/a910d418-7123-4bc4-aa3b-ef7e25e74ae6.faa49ab5e1fff880-removebg-preview_rabrdp.png",
  },
];

// Repeat logos 6 times for smooth infinite loop
const repeatedLogos = [...logos, ...logos, ...logos, ...logos, ...logos, ...logos];

export function LogoMarquee() {
  return (
    <div className="w-full mt-12 relative overflow-hidden">
      {/* The Track */}
      <motion.div
        className="flex gap-16 items-center w-max"
        animate={{ x: [0, "-50%"] }}
        transition={{ 
          repeat: Infinity, 
          ease: "linear", 
          duration: 25,
        }}
      >
        {repeatedLogos.map((logo, idx) => (
          <div 
            key={idx} 
            className="group relative flex flex-col items-center justify-center w-28 h-16 md:w-32 md:h-20 cursor-pointer"
          >
            {/* The Logo Image with Theme Filter */}
            <img 
              src={logo.url} 
              alt={logo.name} 
              className="h-8 w-auto object-contain brightness-0 opacity-70 dark:invert group-hover:opacity-20 transition-all duration-300" 
            />
            {/* The Name Reveal */}
            <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium text-sm text-foreground pointer-events-none font-display">
              {logo.name}
            </span>
          </div>
        ))}
      </motion.div>
      
      {/* Fade Masks for Smooth Edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}