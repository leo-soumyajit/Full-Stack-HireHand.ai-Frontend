import { motion } from "framer-motion";
import testimonialMichael from "@/assets/testimonial-michael.jpg";
import testimonialEmily from "@/assets/testimonial-emily.jpg";
import testimonialDavid from "@/assets/testimonial-david.jpg";
import testimonialLisa from "@/assets/testimonial-lisa.jpg";

const testimonials = [
  {
    quote: "This platform drastically reduced our time-to-hire. The candidate quality is consistently impressive, and the interface is intuitive.",
    name: "Michael Roan",
    role: "CTO, TechFlow",
    image: testimonialMichael,
  },
  {
    quote: "Finding specialized developers used to be a struggle. Now, we can connect with pre-vetted talent that perfectly fits our project needs.",
    name: "Emily Davis",
    role: "Product Manager, Innovate Labs",
    image: testimonialEmily,
  },
  {
    quote: "The AI matching technology is a game-changer. It's like having a dedicated recruiter working for us 24/7. Highly recommended.",
    name: "David Kim",
    role: "Founder, StartUp Dynamics",
    image: testimonialDavid,
  },
  {
    quote: "An essential tool for our HR team. It simplifies everything from sourcing to scheduling, making the entire process efficient and seamless.",
    name: "Lisa Torres",
    role: "Director of HR, Global Solutions",
    image: testimonialLisa,
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="min-h-screen py-16 md:py-24 px-4 bg-background rounded-t-[2.5rem] shadow-2xl">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="font-display text-3xl font-bold sm:text-4xl lg:text-6xl tracking-tight">
            <span className="text-foreground">What Users</span>{" "}
            <span className="text-muted-foreground/40">Say.</span>
          </h2>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            See how our platform has transformed hiring for companies of all sizes.
          </p>
        </motion.div>

        {/* Testimonial Grid - Staggered Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
          {/* Left Column */}
          <div className="space-y-4 md:space-y-8">
            {/* Card 1 - Top Left */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <TestimonialCard testimonial={testimonials[0]} />
            </motion.div>

            {/* Card 3 - Bottom Left */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <TestimonialCard testimonial={testimonials[2]} />
            </motion.div>
          </div>

          {/* Right Column - Offset */}
          <div className="space-y-4 md:space-y-8 md:pt-16">
            {/* Card 2 - Top Right */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <TestimonialCard testimonial={testimonials[1]} />
            </motion.div>

            {/* Card 4 - Bottom Right */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <TestimonialCard testimonial={testimonials[3]} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  testimonial: {
    quote: string;
    name: string;
    role: string;
    image: string;
  };
}

function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="group bg-secondary rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-border cursor-pointer transform-gpu transition-all duration-300 ease-out hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]">
      <p className="text-sm md:text-base text-foreground leading-relaxed mb-4 md:mb-6">
        "{testimonial.quote}"
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden ring-2 ring-transparent transition-all duration-300 group-hover:ring-primary/50 group-hover:ring-offset-2 group-hover:ring-offset-secondary flex-shrink-0">
          <img
            src={testimonial.image}
            alt={testimonial.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <div>
          <p className="font-semibold text-sm md:text-base text-foreground transition-colors duration-300 group-hover:text-primary">{testimonial.name}</p>
          <p className="text-xs md:text-sm text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
    </div>
  );
}
