/**
 * SeekerLayout — scoped design system wrapper for all job-seeker pages.
 *
 * Why scoped: HR dashboard keeps its own theme/dark-mode toggle untouched.
 * The seeker side of the product is a public, trust-driven job portal that
 * (like LinkedIn and Naukri) is always rendered in a professional light
 * theme with a sky/blue palette and Lexend/Source Sans 3 typography.
 *
 * The wrapper:
 *   • forces .light color-scheme regardless of the outer ThemeProvider
 *   • swaps shadcn tokens (--background, --primary, --card, …) to the
 *     Flat-Design sky palette inside its DOM subtree only
 *   • loads Lexend + Source Sans 3 once per session
 */
import { useEffect } from 'react';
import '@/styles/seeker.css';

export function SeekerLayout({ children }: { children: React.ReactNode }) {
  // Lazy-load Google Fonts exactly once across the app
  useEffect(() => {
    const id = 'seeker-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  return (
    <div className="seeker-scope" data-theme="light">
      {children}
    </div>
  );
}
