import { ThemeToggle } from "@/components/ThemeToggle";

export function DashboardHeader() {
  return (
    <header className="h-16 border-b border-border/50 glass flex items-center justify-between px-4 md:px-6">
      {/* Left side - with padding for mobile hamburger menu */}
      <div className="flex items-center gap-4 pl-12 md:pl-0">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
      </div>
      {/* Right side - theme toggle and avatar */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium">
            U
          </div>
        </div>
      </div>
    </header>
  );
}
