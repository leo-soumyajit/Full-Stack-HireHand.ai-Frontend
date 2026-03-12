import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "/login" },
    { label: "API", href: "/login" },
    { label: "Showcase", href: "/login" },
  ],
  company: [
    { label: "About Us", href: "/login" },
    { label: "Careers", href: "/login" },
    { label: "Blog", href: "/login" },
    { label: "Contact", href: "/login" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/login" },
    { label: "Terms of Service", href: "/login" },
    { label: "Cookie Policy", href: "/login" },
  ],
  socials: [
    { label: "Twitter/X", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "GitHub", href: "#" },
    { label: "Instagram", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="relative z-50 bg-[#050505] overflow-hidden">
      {/* Subtle top border */}
      <div className="border-t border-white/10" />
      
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-24">
          {/* Left: Branding */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">HireHand AI</span>
            </Link>
            <p className="text-sm text-gray-500">
              © 2026 HireHand AI. All rights reserved.
            </p>
          </div>

          {/* Right: Link Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {/* Product */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Socials */}
            <div>
              <h4 className="font-semibold text-white mb-4">Socials</h4>
              <ul className="space-y-3">
                {footerLinks.socials.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Giant Watermark Text */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[20%] pointer-events-none select-none"
        aria-hidden="true"
      >
        <span className="text-[8rem] sm:text-[12rem] lg:text-[16rem] font-display font-bold text-white/[0.03] whitespace-nowrap tracking-tight">
          HireHand
        </span>
      </div>
    </footer>
  );
}
