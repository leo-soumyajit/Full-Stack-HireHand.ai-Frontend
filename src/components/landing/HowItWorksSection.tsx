import { motion, useInView, Variants } from "framer-motion";
import { FileText, Cpu, CheckCircle } from "lucide-react";
import { useRef } from "react";

const steps = [
  {
    icon: FileText,
    title: "Paste Job Description",
    description: "Simply paste your job description into our intelligent parser.",
  },
  {
    icon: Cpu,
    title: "AI Generates Questions",
    description: "Our AI analyzes the JD and creates tailored interview questions.",
  },
  {
    icon: CheckCircle,
    title: "Customize & Export",
    description: "Edit, reorder, and export your perfect question set.",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
};

const stepVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 60,
      damping: 15,
    } as const,
  },
};

const badgeVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10,
      delay: 0.2,
    } as const,
  },
};

const lineVariants: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

function ConnectingLine({ delay }: { delay: number }) {
  return (
    <motion.div
      className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] origin-left"
      variants={lineVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <div className="w-full h-full bg-gradient-to-r from-primary/60 via-accent/60 to-primary/30 rounded-full" />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-transparent rounded-full blur-sm"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  return (
    <motion.div
      variants={stepVariants}
      className="relative text-center"
    >
      {/* Connecting line */}
      {index < steps.length - 1 && (
        <ConnectingLine delay={0.4 + index * 0.3} />
      )}

      {/* Icon container */}
      <motion.div 
        className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-card border border-border overflow-hidden"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <step.icon className="relative h-10 w-10 text-primary" />
        
        {/* Animated number badge */}
        <motion.div
          variants={badgeVariants}
          className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground shadow-lg"
        >
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
          >
            {index + 1}
          </motion.span>
        </motion.div>
      </motion.div>

      <motion.h3 
        className="text-xl font-semibold text-foreground"
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { delay: 0.1 } }
        }}
      >
        {step.title}
      </motion.h3>
      <motion.p 
        className="mt-2 text-muted-foreground"
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0, transition: { delay: 0.2 } }
        }}
      >
        {step.description}
      </motion.p>
    </motion.div>
  );
}

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section 
      id="how-it-works" 
      ref={sectionRef}
      className="relative min-h-screen py-24 px-4 bg-secondary rounded-t-[2.5rem] shadow-2xl"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl font-bold sm:text-5xl lg:text-6xl tracking-tight">
            <span className="text-foreground">How It</span>{" "}
            <span className="text-muted-foreground/40">Works.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Get interview-ready in three simple steps.
          </p>
        </motion.div>

        <motion.div 
          className="grid gap-8 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {steps.map((step, index) => (
            <StepCard key={index} step={step} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
