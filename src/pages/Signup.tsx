import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Building2, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { useDebounce } from '@/hooks/use-debounce';
import { motion, AnimatePresence } from 'framer-motion';

interface CompanySuggestion {
  name: string;
  domain: string;
  logo: string;
}

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    company_domain: '',
    company_logo: '',
    email: '',
    password: '',
  });
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);
  const debouncedCompanyName = useDebounce(formData.company_name, 400);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const login = useAuthStore((state) => state.login);

  // Clearbit autocomplete
  useEffect(() => {
    async function fetchCompanies() {
      if (!debouncedCompanyName || debouncedCompanyName.length < 2) {
        setSuggestions([]);
        return;
      }
      setIsSearchingCompany(true);
      try {
        const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(debouncedCompanyName)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (e) {
        setSuggestions([]);
      } finally {
        setIsSearchingCompany(false);
      }
    }
    fetchCompanies();
  }, [debouncedCompanyName]);

  const selectCompany = (company: CompanySuggestion) => {
    setFormData(prev => ({
      ...prev,
      company_name: company.name,
      company_domain: company.domain,
      company_logo: company.logo
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create account');
      }

      if (data.need_verification) {
        toast({ title: 'Verification Required', description: 'A 6-digit code has been sent to your email.' });
        setStep('verify');
        setCountdown(60);
      } else {
        // Fallback if backend skips verification
        login(data.user, data.access_token);
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Signup Failed',
        description: error instanceof Error ? error.message : 'Could not create account.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, 6).split('');
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        if (index + i < 6) newOtp[index + i] = pastedData[i];
      }
      setOtp(newOtp);
      const nextInput = document.getElementById(`otp-${Math.min(5, index + pastedData.length)}`);
      nextInput?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) return;
    
    setIsVerifying(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otpString }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Invalid OTP');

      login(data.user, data.access_token);
      toast({ title: 'Verified!', description: 'Welcome to HireHand AI.' });
      navigate('/dashboard');
    } catch (error) {
      toast({ title: 'Verification Failed', description: error instanceof Error ? error.message : 'Invalid code.', variant: 'destructive' });
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      toast({ title: 'Code Resent', description: 'Check your email for the new code.' });
      setCountdown(60);
    } catch (e) {
      toast({ title: 'Error', description: 'Could not resend code.', variant: 'destructive' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'company_name') {
      setShowSuggestions(true);
      // reset domain and logo if user modifies the name again after selection
      setFormData(prev => ({ ...prev, company_domain: '', company_logo: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-dot-grid p-4">
      <div className="w-full max-w-[450px] space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-xl">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Create an Account</h1>
          <p className="text-muted-foreground text-sm">Start hiring the top 1% correctly with AI</p>
        </div>

        <div className="relative glass-strong rounded-2xl overflow-hidden min-h-[500px]">
          <AnimatePresence mode="wait">
            {step === 'signup' ? (
              <motion.form 
                key="signup-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit} 
                className="p-8 space-y-6"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm outline-none"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      <label className="text-sm font-medium text-foreground">Company</label>
                      <div className="relative">
                        {formData.company_domain ? (
                          <img 
                            src={`https://www.google.com/s2/favicons?domain=${formData.company_domain}&sz=128`} 
                            alt="Company logo" 
                            className="absolute left-3 top-2.5 h-5 w-5 rounded-sm object-contain bg-white shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        )}
                        <input
                          type="text"
                          name="company_name"
                          required
                          value={formData.company_name}
                          onChange={handleChange}
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm outline-none"
                          placeholder="Acme Inc."
                          autoComplete="off"
                        />
                        {isSearchingCompany && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
                        )}
                      </div>
                      
                      {/* Autocomplete Dropdown */}
                      {showSuggestions && (formData.company_name.length > 1) && (
                        <div className="absolute z-50 w-full mt-1 bg-[#1a1a1e] border border-border/50 rounded-xl shadow-xl overflow-hidden glass-strong max-h-64 overflow-y-auto custom-scrollbar">
                          {suggestions.length > 0 ? (
                            <div className="p-1">
                              {suggestions.map((company) => (
                                <div 
                                  key={company.domain}
                                  onClick={() => selectCompany(company)}
                                  className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                                >
                                  <img 
                                      src={`https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`} 
                                      alt={company.name} 
                                      className="w-8 h-8 rounded bg-white object-contain shrink-0 p-0.5 border border-border/50" 
                                      onError={(e) => { 
                                        if (e.currentTarget.src !== company.logo) {
                                          e.currentTarget.src = company.logo || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                        } else {
                                          e.currentTarget.style.display = 'none';
                                        }
                                      }}
                                  />
                                  <div className="flex flex-col truncate">
                                    <span className="text-sm font-medium text-white">{company.name}</span>
                                    <span className="text-xs text-muted-foreground">{company.domain}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            !isSearchingCompany && (
                              <div className="p-3 text-xs text-center text-muted-foreground">
                                No exact match. Try typing your full company name.
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Work Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm outline-none"
                        placeholder="john@acme.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-10 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm outline-none"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 text-base font-semibold rounded-xl group relative overflow-hidden" disabled={isLoading}>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 opacity-90 transition-opacity group-hover:opacity-100" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
                    {!isLoading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                  </span>
                </Button>
              </motion.form>
            ) : (
              <motion.form 
                key="verify-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleVerifyOTP} 
                className="p-8 space-y-8 flex flex-col justify-center h-full items-center text-center mt-8"
              >
                <div className="space-y-4 max-w-sm mx-auto">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6 border border-primary/30 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)]">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Check your inbox</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We sent a secure 6-digit code to <br/><strong className="text-foreground">{formData.email}</strong>. Enter it below to verify.
                  </p>
                </div>

                <div className="flex gap-2.5 justify-center py-4 relative z-20">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      maxLength={6}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoComplete="one-time-code"
                      required
                      className="w-12 h-14 text-center text-xl font-bold bg-background border border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary transition-all outline-none"
                    />
                  ))}
                </div>

                <div className="w-full space-y-4">
                  <Button type="submit" disabled={isVerifying || otp.join('').length < 6} className="w-full h-11 text-base font-semibold rounded-xl group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 opacity-90 transition-opacity group-hover:opacity-100" />
                    <span className="relative flex items-center justify-center gap-2">
                      {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Identity'}
                    </span>
                  </Button>
                  
                  <div className="flex items-center justify-center pt-2">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={countdown > 0}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${countdown === 0 ? 'group-hover:rotate-180 transition-transform duration-500' : ''}`} />
                      {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary/80 font-semibold underline-offset-4 hover:underline transition-all">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
