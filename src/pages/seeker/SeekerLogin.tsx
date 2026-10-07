import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSeekerStore } from '@/store/seekerStore';
import { seekerApi } from '@/lib/seekerApi';

export default function SeekerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const login = useSeekerStore((s) => s.login);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await seekerApi.login(email, password);
      login(data.seeker, data.access_token);
      toast({ title: 'Welcome back!' });
      navigate(data.seeker.profile_complete ? '/seeker/dashboard' : '/seeker/onboarding');
    } catch (err) {
      toast({ title: 'Login failed', description: err instanceof Error ? err.message : 'Invalid credentials', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-dot-grid p-4">
      <div className="w-full max-w-[400px] space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-xl">
              <Briefcase className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your job-seeker account</p>
        </div>
        <form onSubmit={submit} className="glass-strong rounded-2xl p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com"
                  className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password"
                  className="w-full pl-10 pr-10 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="ml-1 h-4 w-4" /></>}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New here? <Link to="/seeker/signup" className="text-primary font-medium hover:underline">Create an account</Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Are you a recruiter? <Link to="/login" className="hover:underline">HR login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
