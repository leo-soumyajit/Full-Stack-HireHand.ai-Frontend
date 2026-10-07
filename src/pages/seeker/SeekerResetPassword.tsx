import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Loader2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { seekerFetch } from '@/lib/seekerApi';

export default function SeekerResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await seekerFetch('/api/seeker/auth/reset-password', {
        method: 'POST', skipAuth: true, body: JSON.stringify({ token, new_password: pw }),
      });
      toast({ title: 'Password reset', description: 'You can now sign in.' });
      navigate('/seeker/login');
    } catch (err) {
      toast({ title: 'Reset failed', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-dot-grid p-4">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary"><Briefcase className="h-7 w-7 text-primary-foreground" /></div>
          <h1 className="text-2xl font-bold font-display">Set a new password</h1>
        </div>
        {!token ? (
          <p className="text-center text-sm text-muted-foreground">Invalid link. <Link to="/seeker/login" className="text-primary hover:underline">Back to login</Link></p>
        ) : (
          <form onSubmit={submit} className="glass-strong rounded-2xl p-8 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">New password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary text-sm outline-none" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset password'}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
