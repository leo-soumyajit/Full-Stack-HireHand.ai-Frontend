import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, X, FileText, Check, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SeekerNav } from '@/components/seeker/SeekerNav';
import { seekerApi } from '@/lib/seekerApi';
import { useSeekerStore, type Seeker } from '@/store/seekerStore';

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const JOB_TYPES = ['', 'Full-time', 'Part-time', 'Internship', 'Remote', 'Contract'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { seeker, setSeeker } = useSeekerStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Seeker>(seeker || ({} as Seeker));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    seekerApi.getProfile().then((p) => { setForm(p); setSeeker(p); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof Seeker>(k: K, v: Seeker[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setPref = (k: string, v: any) => setForm((f) => ({ ...f, preferences: { ...(f.preferences || {}), [k]: v } }));

  const onResume = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) { toast({ title: 'PDF only', variant: 'destructive' }); return; }
    setUploading(true);
    try {
      const b64 = await toBase64(file);
      const { profile, parsed } = await seekerApi.uploadResume(b64, file.name);
      setForm(profile); setSeeker(profile);
      toast({ title: parsed ? 'Resume parsed ✨' : 'Resume uploaded', description: parsed ? 'We pre-filled your profile — review below.' : 'Add your details below.' });
    } catch (err) {
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !(form.skills || []).some((x) => x.toLowerCase() === s.toLowerCase())) {
      set('skills', [...(form.skills || []), s]);
    }
    setSkillInput('');
  };

  const save = async (goDashboard: boolean) => {
    setSaving(true);
    try {
      const patch: Partial<Seeker> = {
        name: form.name, headline: form.headline, location: form.location,
        current_role: form.current_role, total_experience_years: form.total_experience_years,
        summary: form.summary, skills: form.skills, phone: form.phone,
        preferences: form.preferences, social_links: form.social_links,
      };
      const updated = await seekerApi.updateProfile(patch);
      setForm(updated); setSeeker(updated);
      toast({ title: 'Profile saved' });
      if (goDashboard) navigate('/seeker/dashboard');
    } catch (err) {
      toast({ title: 'Save failed', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <SeekerNav />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">Build your profile</h1>
        <p className="text-sm text-muted-foreground">Upload your resume — our AI fills the rest. The better your profile, the better your matches.</p>

        {/* Resume uploader */}
        <div className="mt-6 rounded-2xl border border-dashed border-border/70 bg-card/40 p-6 text-center">
          <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => onResume(e.target.files?.[0])} />
          {form.has_resume ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-600 dark:text-emerald-400"><Check className="h-4 w-4" /> Resume on file</div>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="mr-1 h-4 w-4" /> Replace resume</>}
              </Button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex w-full flex-col items-center gap-2 py-4">
              {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <FileText className="h-8 w-8 text-primary" />}
              <span className="font-medium">{uploading ? 'Parsing your resume…' : 'Upload your resume (PDF)'}</span>
              <span className="text-xs text-muted-foreground">AI extracts your skills & experience automatically</span>
            </button>
          )}
        </div>

        {/* Profile form */}
        <div className="mt-6 space-y-5 rounded-2xl border border-border/60 bg-card/50 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" value={form.name || ''} onChange={(v) => set('name', v)} />
            <Input label="Headline" placeholder="e.g. Senior Frontend Engineer" value={form.headline || ''} onChange={(v) => set('headline', v)} />
            <Input label="Current role" value={form.current_role || ''} onChange={(v) => set('current_role', v)} />
            <Input label="Location" value={form.location || ''} onChange={(v) => set('location', v)} />
            <Input label="Experience (years)" type="number" value={form.total_experience_years?.toString() || ''} onChange={(v) => set('total_experience_years', v ? Number(v) : null)} />
            <Input label="Phone" value={form.phone || ''} onChange={(v) => set('phone', v)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Professional summary</label>
            <textarea value={form.summary || ''} onChange={(e) => set('summary', e.target.value)} rows={3}
              className="w-full rounded-xl border border-border/60 bg-background/60 p-3 text-sm outline-none focus:border-primary" placeholder="2-3 sentences about you" />
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Skills</label>
            <div className="flex flex-wrap gap-2">
              {(form.skills || []).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {s}<button onClick={() => set('skills', (form.skills || []).filter((x) => x !== s))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              placeholder="Type a skill and press Enter"
              className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>

          {/* Preferences */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Desired roles (comma separated)" value={(form.preferences?.desired_roles || []).join(', ')}
              onChange={(v) => setPref('desired_roles', v.split(',').map((x) => x.trim()).filter(Boolean))} />
            <Input label="Preferred locations (comma separated)" value={(form.preferences?.preferred_locations || []).join(', ')}
              onChange={(v) => setPref('preferred_locations', v.split(',').map((x) => x.trim()).filter(Boolean))} />
            <div className="space-y-2">
              <label className="text-sm font-medium">Job type</label>
              <select value={form.preferences?.job_type || ''} onChange={(e) => setPref('job_type', e.target.value || null)}
                className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary">
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t || 'Any'}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button>
          <Button onClick={() => save(true)} disabled={saving} className="gradient-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-1 h-4 w-4" /> Save & see my matches <ArrowRight className="ml-1 h-4 w-4" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary" />
    </div>
  );
}
