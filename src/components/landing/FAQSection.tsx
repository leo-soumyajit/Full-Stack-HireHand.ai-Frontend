import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does HireHand AI generate questions?",
    answer:
      "Our advanced AI analyzes your Job Description's keywords, required skills, and experience level to craft tailored technical and behavioral questions instantly.",
  },
  {
    question: "Can I customize the difficulty level?",
    answer:
      "Yes! You can toggle between Junior, Mid-Level, and Senior complexity to ensure the questions match the candidate's profile perfectly.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We process Job Descriptions in real-time and do not store sensitive hiring data on our servers. Your privacy is our priority.",
  },
  {
    question: "Can I export the questions?",
    answer:
      "Yes, you can copy individual questions or export the entire interview script to PDF or Notion with a single click.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="relative z-30 py-24 px-4 bg-background"
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl font-bold sm:text-5xl lg:text-6xl tracking-tight">
            <span className="text-foreground">Frequently Asked</span>{" "}
            <span className="text-muted-foreground/40">Questions.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about HireHand AI.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="divide-y divide-border">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="py-6"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between text-left group"
              >
                <span className="text-xl sm:text-2xl font-medium text-foreground pr-8 transition-colors duration-200 group-hover:text-primary">
                  {faq.question}
                </span>
                <motion.span
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="h-6 w-6 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="pt-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
