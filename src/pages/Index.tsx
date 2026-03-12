import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { MacbookScrollDemo } from "@/components/landing/MacbookScrollDemo";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { Footer } from "@/components/landing/Footer";
import { StickySection } from "@/components/landing/StickySection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* 1. Hero Section */}
        <StickySection zIndex={0}>
          <HeroSection />
        </StickySection>
        
        {/* 2. Product Showcase - Macbook Scroll */}
        <MacbookScrollDemo />
        
        {/* 3. Features Section - Animated Bento Grid */}
        <FeaturesSection />
        
        {/* 4. How It Works */}
        <StickySection zIndex={20}>
          <HowItWorksSection />
        </StickySection>
        
        {/* 5. Testimonials */}
        <StickySection zIndex={30} isLast>
          <TestimonialsSection />
        </StickySection>
        
        {/* 6. FAQ - Normal scroll */}
        <FAQSection />
      </main>
      {/* 7. Footer */}
      <Footer />
    </div>
  );
};

export default Index;
