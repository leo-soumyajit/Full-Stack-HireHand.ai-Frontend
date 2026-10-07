import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSeekerStore } from '@/store/seekerStore';
import { seekerApi } from '@/lib/seekerApi';

export default function SeekerSignup() {
  const [phase, setPhase] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const login = useSeekerStore((s) => s.login);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await seekerApi.signup(name, email, password);
      setPhase('otp');
      toast({ title: 'Check your inbox', description: `We sent a 6-digit code to ${email}` });
    } catch (err) {
      toast({ title: 'Signup failed', description: err instanceof Error ? err.message : 'Try again', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await seekerApi.verifyOtp(email, otp);
      login(data.seeker, data.access_token);
      toast({ title: 'Welcome to HireHand!', description: "Let's build your profile." });
      navigate('/seeker/onboarding');
    } catch (err) {
      toast({ title: 'Verification failed', description: err instanceof Error ? err.message : 'Invalid code', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const resend = async () => {
    try { await seekerApi.resendOtp(email); toast({ title: 'Code resent' }); }
    catch (err) { toast({ title: 'Could not resend', description: err instanceof Error ? err.message : '', variant: 'destructive' }); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-dot-grid p-4">
      <div className="w-full max-w-[420px] space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-xl">
              <Briefcase className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
            {phase === 'form' ? 'Find your next role' : 'Verify your email'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {phase === 'form' ? 'Create your HireHand job-seeker account' : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {phase === 'form' ? (
          <form onSubmit={submitForm} className="glass-strong rounded-2xl p-8 space-y-5">
            <Field icon={<User className="h-4 w-4" />} label="Full name">
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none" />
            </Field>
            <Field icon={<Mail className="h-4 w-4" />} label="Email">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com"
                className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none" />
            </Field>
            <Field icon={<Lock className="h-4 w-4" />} label="Password">
              <input type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters"
                className="w-full pl-10 pr-10 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>
            <Button type="submit" disabled={loading} className="w-full gradient-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="ml-1 h-4 w-4" /></>}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/seeker/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="glass-strong rounded-2xl p-8 space-y-5">
            <Field icon={<ShieldCheck className="h-4 w-4" />} label="Verification code">
              <input required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" inputMode="numeric"
                className="w-full pl-10 pr-4 py-2 tracking-[0.5em] text-center bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-lg outline-none" />
            </Field>
            <Button type="submit" disabled={loading || otp.length !== 6} className="w-full gradient-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & continue'}
            </Button>
            <div className="flex justify-between text-sm">
              <button type="button" onClick={() => setPhase('form')} className="text-muted-foreground hover:underline">← Change email</button>
              <button type="button" onClick={resend} className="text-primary font-medium hover:underline">Resend code</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-3 text-muted-foreground">{icon}</span>
        {children}
      </div>
    </div>
  );
}
