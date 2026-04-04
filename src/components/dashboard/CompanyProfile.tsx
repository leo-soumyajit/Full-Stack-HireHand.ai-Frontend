import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { Building2, User, Globe, Mail, Loader2, Save, Camera, Briefcase, Phone, AlignLeft, ChevronDown, Check, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface CompanySuggestion {
  name: string;
  domain: string;
  logo: string;
}

const POSITIONS = [
  "Chief Executive Officer (CEO)", "Chief Technology Officer (CTO)", "Chief Operating Officer (COO)", "Chief Financial Officer (CFO)", "Chief Marketing Officer (CMO)",
  "VP of Engineering", "Director of Engineering", "Head of Talent Acquisition", "Chief People Officer", "VP of Human Resources", 
  "Lead Recruiter", "HR Business Partner", "Senior Talent Sourcer", "Technical Recruiter",
  "Software Architect", "Machine Learning Lead", "AI Researcher", "Product Manager", "Scrum Master",
  "Design Director", "UX/UI Lead", "Recruitment Consultant", "Other"
];

const COUNTRY_CODES = [
  { code: "+1", iso: "us", label: "United States (+1)" },
  { code: "+1", iso: "ca", label: "Canada (+1)" },
  { code: "+91", iso: "in", label: "India (+91)" },
  { code: "+44", iso: "gb", label: "United Kingdom (+44)" },
  { code: "+61", iso: "au", label: "Australia (+61)" },
  { code: "+49", iso: "de", label: "Germany (+49)" },
  { code: "+33", iso: "fr", label: "France (+33)" },
  { code: "+81", iso: "jp", label: "Japan (+81)" },
  { code: "+86", iso: "cn", label: "China (+86)" },
  { code: "+971", iso: "ae", label: "UAE (+971)" },
  { code: "+65", iso: "sg", label: "Singapore (+65)" },
  { code: "+92", iso: "pk", label: "Pakistan (+92)" },
  { code: "+880", iso: "bd", label: "Bangladesh (+880)" },
  { code: "+94", iso: "lk", label: "Sri Lanka (+94)" },
  { code: "+977", iso: "np", label: "Nepal (+977)" },
  { code: "+55", iso: "br", label: "Brazil (+55)" },
  { code: "+27", iso: "za", label: "South Africa (+27)" },
  { code: "+7", iso: "ru", label: "Russia (+7)" },
  { code: "+39", iso: "it", label: "Italy (+39)" },
  { code: "+34", iso: "es", label: "Spain (+34)" },
  { code: "+82", iso: "kr", label: "South Korea (+82)" },
  { code: "+52", iso: "mx", label: "Mexico (+52)" },
  { code: "+62", iso: "id", label: "Indonesia (+62)" },
  { code: "+90", iso: "tr", label: "Turkey (+90)" },
  { code: "+31", iso: "nl", label: "Netherlands (+31)" },
  { code: "+41", iso: "ch", label: "Switzerland (+41)" },
  { code: "+46", iso: "se", label: "Sweden (+46)" },
  { code: "+48", iso: "pl", label: "Poland (+48)" },
  { code: "+32", iso: "be", label: "Belgium (+32)" },
  { code: "+47", iso: "no", label: "Norway (+47)" },
  { code: "+43", iso: "at", label: "Austria (+43)" },
  { code: "+45", iso: "dk", label: "Denmark (+45)" },
  { code: "+64", iso: "nz", label: "New Zealand (+64)" },
  { code: "+353", iso: "ie", label: "Ireland (+353)" },
  { code: "+972", iso: "il", label: "Israel (+972)" },
  { code: "+358", iso: "fi", label: "Finland (+358)" },
  { code: "+60", iso: "my", label: "Malaysia (+60)" },
  { code: "+66", iso: "th", label: "Thailand (+66)" },
  { code: "+63", iso: "ph", label: "Philippines (+63)" },
  { code: "+84", iso: "vn", label: "Vietnam (+84)" },
  { code: "+20", iso: "eg", label: "Egypt (+20)" },
  { code: "+234", iso: "ng", label: "Nigeria (+234)" },
  { code: "+254", iso: "ke", label: "Kenya (+254)" },
  { code: "+966", iso: "sa", label: "Saudi Arabia (+966)" },
  { code: "+54", iso: "ar", label: "Argentina (+54)" },
  { code: "+56", iso: "cl", label: "Chile (+56)" },
  { code: "+57", iso: "co", label: "Colombia (+57)" },
  { code: "+51", iso: "pe", label: "Peru (+51)" },
  { code: "+58", iso: "ve", label: "Venezuela (+58)" },
  { code: "+380", iso: "ua", label: "Ukraine (+380)" },
  { code: "+30", iso: "gr", label: "Greece (+30)" },
  { code: "+351", iso: "pt", label: "Portugal (+351)" },
  { code: "+420", iso: "cz", label: "Czech Republic (+420)" },
  { code: "+40", iso: "ro", label: "Romania (+40)" },
  { code: "+36", iso: "hu", label: "Hungary (+36)" },
  { code: "+93", iso: "af", label: "Afghanistan (+93)" },
  { code: "+886", iso: "tw", label: "Taiwan (+886)" },
  { code: "+852", iso: "hk", label: "Hong Kong (+852)" },
].sort((a, b) => a.label.localeCompare(b.label));

export function CompanyProfile() {
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const token = useAuthStore((state) => state.token);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    company_name: user?.company_name || '',
    company_domain: user?.company_domain || '',
    position: user?.position || '',
    phone_code: user?.phone_code || '+91',
    phone: user?.phone || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
    cover_url: user?.cover_url || ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  
  // Custom states
  const [isOtherPosition, setIsOtherPosition] = useState(
    formData.position && !POSITIONS.includes(formData.position) ? true : false
  );
  const [countryOpen, setCountryOpen] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState<CompanySuggestion[]>([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);
  const debouncedCompanyName = useDebounce(formData.company_name, 400);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const companySuggestionsRef = useRef<HTMLDivElement>(null);

  // Click outside to close company suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (companySuggestionsRef.current && !companySuggestionsRef.current.contains(event.target as Node)) {
        setShowCompanySuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clearbit company autocomplete
  useEffect(() => {
    async function fetchCompanies() {
      if (!debouncedCompanyName || debouncedCompanyName.length < 2) {
        setCompanySuggestions([]);
        return;
      }
      setIsSearchingCompany(true);
      try {
        const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(debouncedCompanyName)}`);
        if (res.ok) {
          const data = await res.json();
          setCompanySuggestions(data);
        }
      } catch {
        setCompanySuggestions([]);
      } finally {
        setIsSearchingCompany(false);
      }
    }
    fetchCompanies();
  }, [debouncedCompanyName]);

  const uploadToCloudinaryBackend = async (file: File, type: 'avatar'|'cover') => {
    if (type === 'avatar') setIsUploadingAvatar(true);
    else setIsUploadingCover(true);

    try {
      const data = new FormData();
      data.append('file', file);
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`${API_BASE}/api/auth/upload-image`, {
        method: 'POST',
        headers: {
          ...authHeader
        },
        body: data
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Upload failed');
      }
      
      const responseData = await response.json();
      setFormData(prev => ({ 
        ...prev, 
        [type === 'avatar' ? 'avatar_url' : 'cover_url']: responseData.url 
      }));
      
      toast({ title: 'Success', description: `${type === 'avatar' ? 'Profile picture' : 'Cover photo'} uploaded successfully.` });
    } catch (e: any) {
      toast({ title: 'Upload Failed', description: e.message || 'Image upload failed', variant: 'destructive' });
    } finally {
      if (type === 'avatar') setIsUploadingAvatar(false);
      else setIsUploadingCover(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      uploadToCloudinaryBackend(file, type);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Safety check, clean data
    const finalData = { ...formData };
    
    try {
      const updatedUser = await apiFetch<any>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(finalData)
      });
      
      if (token && updatedUser) {
        login(updatedUser, token);
      }
      
      toast({ title: 'Profile Updated', description: 'Your information has been successfully updated.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (e.target.name === 'position_select') {
      if (e.target.value === 'Other') {
        setIsOtherPosition(true);
        setFormData(prev => ({ ...prev, position: '' }));
      } else {
        setIsOtherPosition(false);
        setFormData(prev => ({ ...prev, position: e.target.value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };

  const selectCountryCode = (code: string) => {
    setFormData(prev => ({ ...prev, phone_code: code }));
    setCountryOpen(false);
  };

  const selectCompany = (company: CompanySuggestion) => {
    setFormData(prev => ({
      ...prev,
      company_name: company.name,
      company_domain: company.domain,
    }));
    setShowCompanySuggestions(false);
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === formData.phone_code) || COUNTRY_CODES[0];

  const initials = formData.name.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-display font-semibold tracking-tight">Professional Identity</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your corporate identity and personal settings.</p>
      </div>

      <div className="glass-strong border border-border/50 rounded-xl shadow-sm">
        
        {/* Cover Banner */}
        <div className="h-48 group relative overflow-hidden rounded-t-xl bg-[#121214]">
          {formData.cover_url ? (
            <img src={formData.cover_url} alt="Cover" className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-rose-600/30 animate-gradient" />
          )}
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
             <Button type="button" variant="secondary" size="sm" className="gap-2 font-medium" disabled={isUploadingCover} onClick={() => coverInputRef.current?.click()}>
               {isUploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
               {isUploadingCover ? 'Uploading...' : 'Upload Cover Photo'}
             </Button>
             <input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={(e) => handleFileChange(e, 'cover')} />
          </div>
        </div>

        {/* Overlapping Avatar */}
        <div className="relative px-8 flex justify-between items-end pb-4 border-b border-border/50">
          <div className="relative -mt-16 z-10 group">
             <div className="w-32 h-32 rounded-full border-4 border-[#1a1a1e] shadow-2xl glass-strong bg-[#1a1a1e] overflow-hidden flex items-center justify-center relative">
               {formData.avatar_url ? (
                 <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-3xl font-bold text-muted-foreground">{initials}</span>
               )}
               
               {/* Avatar Hover Overlay */}
               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm" onClick={() => avatarInputRef.current?.click()}>
                 {isUploadingAvatar ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
               </div>
               <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} />
             </div>
          </div>
          
          <div className="flex gap-3 relative top-4">
             {formData.company_domain && (
               <div className="flex items-center gap-2 px-3 py-1.5 glass-strong border border-border/50 rounded-full bg-background/50 text-xs font-medium text-muted-foreground">
                 <img src={`https://www.google.com/s2/favicons?domain=${formData.company_domain}&sz=64`} alt="Company Logo" className="w-4 h-4 rounded-sm bg-white shrink-0 object-contain" onError={(e) => e.currentTarget.style.display='none'} />
                 {formData.company_name}
               </div>
             )}
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          
          {/* Section 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-primary">Personal Details</h3>
              <div className="space-y-4">
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-[18px] w-[18px] text-muted-foreground" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center justify-between">
                    Email Address
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Primary</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-[18px] w-[18px] text-muted-foreground/50" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-border/50 rounded-xl text-muted-foreground text-sm outline-none cursor-not-allowed opacity-70"
                    />
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className="text-sm font-medium text-foreground">Designation</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-[18px] w-[18px] text-muted-foreground z-10" />
                    
                    {!isOtherPosition ? (
                      <select
                        name="position_select"
                        value={formData.position}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm outline-none appearance-none"
                      >
                        <option value="" disabled>Select your position</option>
                        {POSITIONS.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex gap-2">
                         <input
                           type="text"
                           name="position"
                           value={formData.position}
                           onChange={handleChange}
                           autoFocus
                           className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm outline-none"
                           placeholder="Type your custom position..."
                         />
                         <Button type="button" variant="ghost" size="sm" onClick={() => setIsOtherPosition(false)} className="px-3 shrink-0">List</Button>
                      </div>
                    )}
                    
                    {!isOtherPosition && <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />}
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-foreground">Phone Number</label>
                   <div className="flex gap-2 relative">
                     
                     {/* Radix Popover Country Dropdown */}
                     <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                       <PopoverTrigger asChild>
                         <button 
                           type="button" 
                           onClick={() => setCountryOpen(true)}
                           className="flex items-center gap-2 w-[120px] px-3 py-2 h-[38px] bg-background/50 border border-border/50 rounded-xl hover:border-primary transition-all text-sm outline-none"
                         >
                           <img src={`https://flagcdn.com/w20/${selectedCountry.iso}.png`} alt="flag" className="w-5 h-auto object-contain rounded-sm shadow-sm" />
                           <span className="font-medium text-muted-foreground mr-1">{selectedCountry.code}</span>
                         </button>
                       </PopoverTrigger>
                       <PopoverContent className="w-[240px] p-0 border-border/50 glass-strong shadow-xl" align="start">
                         <Command>
                           <CommandInput placeholder="Search country..." className="text-sm" />
                           <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">No country found</CommandEmpty>
                           <CommandList className="custom-scrollbar">
                             <CommandGroup>
                               {COUNTRY_CODES.map((country) => (
                                 <CommandItem
                                   key={country.iso}
                                   value={`${country.label} ${country.code}`}
                                   onSelect={() => selectCountryCode(country.code)}
                                   className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-white/5"
                                 >
                                   <img src={`https://flagcdn.com/w20/${country.iso}.png`} alt="flag" className="w-5 h-auto object-contain rounded-sm" />
                                   <span className="flex-1 truncate">{country.label}</span>
                                   {formData.phone_code === country.code && <Check className="w-4 h-4 text-primary" />}
                                 </CommandItem>
                               ))}
                             </CommandGroup>
                           </CommandList>
                         </Command>
                       </PopoverContent>
                     </Popover>
                     
                     <div className="relative flex-1">
                       <Phone className="absolute left-3 top-2.5 h-[18px] w-[18px] text-muted-foreground" />
                       <input
                         type="tel"
                         name="phone"
                         value={formData.phone}
                         onChange={handleChange}
                         placeholder="e.g. 9876543210"
                         className="w-full pl-10 pr-4 py-2 h-[38px] bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm outline-none"
                       />
                     </div>
                   </div>
                </div>

              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-primary">Organizational Structure</h3>
              <div className="space-y-4">
                
                <div className="space-y-2" ref={companySuggestionsRef}>
                  <label className="text-sm font-medium text-foreground">Corporate Label</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-[18px] w-[18px] text-muted-foreground z-10" />
                    <input
                      type="text"
                      name="company_name"
                      required
                      value={formData.company_name}
                      onChange={(e) => {
                        handleChange(e);
                        setShowCompanySuggestions(true);
                      }}
                      onFocus={() => companySuggestions.length > 0 && setShowCompanySuggestions(true)}
                      autoComplete="off"
                      className="w-full pl-10 pr-10 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm outline-none"
                    />
                    {isSearchingCompany && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                    
                    {/* Company Suggestions Dropdown */}
                    {showCompanySuggestions && companySuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#1a1a1e] border border-border/50 rounded-xl shadow-xl overflow-hidden max-h-[220px] overflow-y-auto custom-scrollbar">
                        {companySuggestions.map((company, i) => (
                          <button
                            key={`${company.domain}-${i}`}
                            type="button"
                            onClick={() => selectCompany(company)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left border-b border-border/30 last:border-b-0"
                          >
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${company.domain}&sz=64`} 
                              alt="" 
                              className="w-6 h-6 rounded bg-white p-0.5 object-contain shrink-0" 
                              onError={(e) => { e.currentTarget.src = ''; e.currentTarget.style.display = 'none'; }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{company.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{company.domain}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Corporate Domain</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-[18px] w-[18px] text-muted-foreground" />
                    <input
                      type="text"
                      name="company_domain"
                      value={formData.company_domain}
                      onChange={handleChange}
                      placeholder="e.g. acme.com"
                      className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium text-foreground">Professional Summary</label>
                  <div className="relative">
                    <AlignLeft className="absolute left-3 top-3 h-[18px] w-[18px] text-muted-foreground" />
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Briefly describe your role and expertise..."
                      className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm outline-none min-h-[142px] resize-none"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-6 border-t border-border/50">
            <Button type="submit" disabled={isSaving || isUploadingAvatar || isUploadingCover} className="gap-2 h-11 px-8 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 border-0 text-white font-medium shadow-lg shadow-primary/20">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Processing Update...' : 'Save Profile Details'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
