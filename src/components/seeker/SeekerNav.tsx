import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, LayoutDashboard, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSeekerStore } from '@/store/seekerStore';

export function SeekerNav() {
  const { isAuthenticated, seeker, logout } = useSeekerStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/jobs" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">HireHand <span className="text-primary">Jobs</span></span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/jobs"><Button variant="ghost" size="sm">Browse jobs</Button></Link>
          {isAuthenticated ? (
            <>
              <Link to="/seeker/dashboard">
                <Button variant="ghost" size="sm"><LayoutDashboard className="mr-1 h-4 w-4" /> Dashboard</Button>
              </Link>
              <Link to="/seeker/onboarding" className="hidden sm:block">
                <Button variant="ghost" size="icon" className="rounded-full">
                  {seeker?.avatar_url
                    ? <img src={seeker.avatar_url} alt="me" className="h-8 w-8 rounded-full object-cover" />
                    : <User className="h-4 w-4" />}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/jobs'); }} title="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/seeker/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/seeker/signup"><Button size="sm" className="gradient-primary">Get started</Button></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
