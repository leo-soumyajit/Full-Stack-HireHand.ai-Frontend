import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Briefcase,
  Users,
  CalendarDays,
  BarChart3,
  Package,
  Settings,
  Shield,
  LogOut,
  Sparkles,
  ChevronLeft,
  Menu,
  FileText,
  KeyRound,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuthStore } from "@/store/authStore";
import { ChangePasswordModal } from "./ChangePasswordModal";

const mainNav = [
  { icon: Home, label: "Home", path: "/dashboard", section: "home" },
  { icon: Briefcase, label: "Positions", path: "/dashboard", section: "positions" },
  { icon: Users, label: "Candidates", path: "/dashboard", section: "candidates" },
  { icon: CalendarDays, label: "Scheduling", path: "/dashboard", section: "scheduling" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard", section: "analytics" },
  { icon: Package, label: "Decision Packs", path: "/dashboard", section: "decision-packs" },
];

const adminNav = [
  { icon: User, label: "Profile & Settings", action: "profile" },
  { icon: Settings, label: "Config", action: "config" },
  { icon: Shield, label: "Audit & Governance", action: "audit" },
  { icon: KeyRound, label: "Change Password", action: "password" },
];

interface DashboardSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  onPasteJD?: () => void;
}

export function DashboardSidebar({
  isCollapsed,
  onToggle,
  activeSection = "home",
  onSectionChange,
  onPasteJD,
}: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shrink-0">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold gradient-text font-display"
          >
            HireHand AI
          </motion.span>
        )}
      </div>

      {/* Primary CTA */}
      <div className="px-3 mt-2">
        <button
          onClick={() => {
            onPasteJD?.();
            isMobile && setMobileOpen(false);
          }}
          className={cn(
            "w-full flex items-center gap-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold transition-all duration-300 hover:opacity-90 hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.6)] glow-sm",
            isCollapsed ? "justify-center p-2.5" : "px-4 py-3 text-sm"
          )}
        >
          <FileText className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>✨ Paste Job Description</span>}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 p-3 mt-4 space-y-1 overflow-y-auto">
        <p className={cn("text-[10px] uppercase tracking-widest text-muted-foreground mb-2", isCollapsed && "sr-only")}>
          Menu
        </p>
        {mainNav.map((item) => {
          const isActive = activeSection === item.section;
          return (
            <button
              key={item.label}
              onClick={() => {
                onSectionChange?.(item.section);
                isMobile && setMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-sm font-medium",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* Admin Section */}
        <div className="pt-4">
          <p className={cn("text-[10px] uppercase tracking-widest text-muted-foreground mb-2", isCollapsed && "sr-only")}>
            Admin
          </p>
          {adminNav.map((item) => {
            const isActive = activeSection === item.action;
            return (
            <button
              key={item.label}
              onClick={() => {
                if (item.action === "password") {
                  setPasswordModalOpen(true);
                } else if (item.action === "profile") {
                  onSectionChange?.("profile");
                }
                if (isMobile) setMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 text-sm font-medium",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border/30">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-foreground text-sm",
            isCollapsed && "justify-center"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {mobileOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-border/30 flex flex-col">
              <SidebarContent />
            </div>
          </motion.div>
        )}
      </>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 256 }}
      className="sticky top-0 h-screen bg-sidebar border-r border-border/30 flex flex-col shrink-0"
    >
      <SidebarContent />

      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-background shadow-sm"
        onClick={onToggle}
      >
        <ChevronLeft
          className={cn(
            "h-4 w-4 transition-transform",
            isCollapsed && "rotate-180"
          )}
        />
      </Button>
      <ChangePasswordModal open={passwordModalOpen} onOpenChange={setPasswordModalOpen} />
    </motion.aside>
  );
}
