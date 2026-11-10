import { Link, useNavigate, NavLink } from 'react-router-dom';
import { Briefcase, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useSeekerStore } from '@/store/seekerStore';
import { cn } from '@/lib/utils';

export function SeekerNav() {
  const { isAuthenticated, seeker, logout } = useSeekerStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/jobs" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0369A1] text-white">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            HireHand<span className="text-[#0369A1]"> Jobs</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink
            to="/jobs"
            end
            className={({ isActive }) => cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              isActive ? 'bg-[#0369A1]/8 text-[#0369A1]' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Browse jobs
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink
                to="/seeker/dashboard"
                className={({ isActive }) => cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-[#0369A1]/8 text-[#0369A1]' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </NavLink>

              <Link
                to="/seeker/onboarding"
                className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-slate-200 hover:ring-[#0369A1]/40"
                title="Profile"
              >
                {seeker?.avatar_url
                  ? <img src={seeker.avatar_url} alt="me" className="h-8 w-8 rounded-full object-cover" />
                  : <User className="h-4 w-4 text-slate-600" />}
              </Link>
              <button
                onClick={() => { logout(); navigate('/jobs'); }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/seeker/login"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900">
                Sign in
              </Link>
              <Link to="/seeker/signup"
                className="rounded-full bg-[#0369A1] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#0C4A6E]">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
