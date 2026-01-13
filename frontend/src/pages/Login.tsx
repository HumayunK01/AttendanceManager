import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2, ClipboardCheck, Clock, Users, LucideIcon, Smartphone, Download } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// --- Sub-components for cleaner structure ---

interface StatItemProps {
  icon: LucideIcon;
  value: string;
  label: string;
  delay?: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, value, label }) => (
  <div className="space-y-0.5 group transition-all duration-500 hover:-translate-y-1">
    <div className="flex items-center gap-2.5 text-primary">
      <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-2xl font-extrabold text-white tracking-tighter group-hover:text-primary transition-colors duration-300">{value}</span>
    </div>
    <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-bold ml-10 opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap">{label}</p>
  </div>
);

interface AuthFieldProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
  isToggled?: boolean;
}

const AuthField: React.FC<AuthFieldProps> = ({
  id, label, type, placeholder, value, onChange, disabled, required, showToggle, onToggle, isToggled
}) => (
  <div className="grid gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-700">
    <Label htmlFor={id} className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.25em] ml-1 mb-0.5">
      {label}
    </Label>
    <div className="relative group/input">
      <Input
        id={id}
        type={showToggle ? (isToggled ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 bg-white/[0.03] border-white/5 focus:border-primary/40 focus:ring-0 transition-all duration-300 text-white rounded-xl px-4 text-sm placeholder:text-gray-700"
        disabled={disabled}
        required={required}
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors p-1.5 focus:outline-none focus:text-primary"
          aria-label={isToggled ? "Hide password" : "Show password"}
        >
          {isToggled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  </div>
);

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Signing in...');

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // ------------------------------------------------------------------
    // WAKE-UP CALL: Ping backend immediately to mitigate Render cold starts
    // ------------------------------------------------------------------
    const wakeUpBackend = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        // Strip '/api' from the end to get the root URL for the /health endpoint
        const baseUrl = apiUrl.replace(/\/api\/?$/, '');

        // Fire and forget - we don't care about the response, just hitting the server
        await fetch(`${baseUrl}/health`, { method: 'GET' });
      } catch (err) {
        // Silently fail, it's just an optimization
      }
    };

    wakeUpBackend();
  }, []);

  const roleRoutes: Record<UserRole, string> = useMemo(() => ({
    ADMIN: '/admin',
    FACULTY: '/faculty',
    STUDENT: '/student',
  }), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;


    // Timers for feedback during cold starts
    let timer1: ReturnType<typeof setTimeout>;
    let timer2: ReturnType<typeof setTimeout>;

    setIsLoading(true);
    setLoadingText('Signing in...');

    // If it takes longer than 2s, it's likely waking up
    timer1 = setTimeout(() => setLoadingText('Booting up the matrix...'), 2000);
    // If it takes longer than 8s, be explicit
    timer2 = setTimeout(() => setLoadingText('Almost there... spinning up resources!'), 8000);

    try {
      await login(formData.email, formData.password);

      // Clear timers immediately upon success
      clearTimeout(timer1);
      clearTimeout(timer2);

      const token = localStorage.getItem('token');
      if (token) {
        const { jwtDecode } = await import('jwt-decode');
        const decoded = jwtDecode<{ role: UserRole }>(token);

        toast({ title: 'Welcome back!', description: 'Access authorized. Redirecting...' });
        navigate(roleRoutes[decoded.role]);
      }
    } catch (error: any) {
      toast({
        title: 'Authentication Failed',
        description: error.response?.data?.message || 'Check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      clearTimeout(timer1!);
      clearTimeout(timer2!);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-full flex flex-col lg:flex-row bg-[#030712] selection:bg-primary/20 selection:text-primary font-sans antialiased overflow-hidden relative">

      {/* ─── Left Panel: Branding & Impact ─── */}
      <div className="lg:flex-1 relative overflow-hidden hidden lg:flex flex-col justify-between p-12 lg:p-16 xl:p-20 border-r border-white/5">
        {/* Abstract Background Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-screen scale-110 animate-slow-zoom pointer-events-none"
          style={{ backgroundImage: 'url("/login-bg.png")' }}
        />

        {/* Dynamic Gradients */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#030712] via-transparent to-primary/10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030712] pointer-events-none" />

        {/* Brand Header */}
        <header className="relative z-10 animate-in fade-in slide-in-from-top-4 duration-1000 ease-out-expo">
          <div className="cursor-default flex flex-col items-start group">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
                <img src="/logo.png" alt="Attendly Logo" className="w-9 h-9 object-contain relative z-10 group-hover:rotate-12 transition-transform duration-500" />
              </div>
              <span className="text-3xl font-extrabold tracking-tighter text-white block">Attendly</span>
            </div>
          </div>
        </header>

        {/* Centered Hero Content */}
        <main className="flex-1 flex flex-col justify-center py-20 relative z-10">
          <div className="max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 ease-out-expo fill-mode-both">
            <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-8 tracking-tight whitespace-pre-line">
              Manage your{'\n'}
              <span className="block mt-2 text-gradient">Class Attendance</span>
            </h1>
            <p className="text-lg text-gray-400/80 font-medium leading-relaxed mb-12 max-w-lg border-l-2 border-primary/20 pl-6">
              The high-performance tracking suite for modern campuses.
              Precision records, effortless management.
            </p>

            <div className="grid grid-cols-3 gap-8">
              <StatItem icon={Users} value="500+" label="Students" />
              <StatItem icon={ClipboardCheck} value="Digital" label="Records" />
              <StatItem icon={Clock} value="Live" label="Sync" />
            </div>
          </div>
        </main>

        <footer className="relative z-10 animate-in fade-in slide-in-from-bottom duration-1000 delay-500 ease-out-expo fill-mode-both">
          <Link
            to="/forgot-password"
            className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-500 hover:text-primary transition-all duration-300 flex items-center gap-2.5 group opacity-60 hover:opacity-100"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-all duration-300 group-hover:scale-125" />
            Can't access your account?
          </Link>
        </footer>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 xl:p-24 relative overflow-hidden bg-[#030712] lg:bg-transparent">
        {/* Mobile Background Layer (only visible on small/medium screens) */}
        <div
          className="lg:hidden absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 mix-blend-screen scale-110 animate-slow-zoom pointer-events-none"
          style={{ backgroundImage: 'url("/login-bg.png")' }}
        />

        {/* Dynamic Mobile Gradients */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-tr from-[#030712] via-transparent to-primary/5 pointer-events-none" />
        <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-transparent via-[#030712]/50 to-[#030712] pointer-events-none" />

        {/* Ambient Atmosphere Glows */}
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/5 blur-[130px] rounded-full pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-primary/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="w-full max-w-[400px] lg:max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-1000 ease-out-expo">
          {/* Mobile-only Branding */}
          <div className="lg:hidden flex justify-center mb-10 text-center">
            <div className="group flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
                  <img src="/logo.png" alt="Attendly Logo" className="w-9 h-9 object-contain relative z-10" />
                </div>
                <span className="text-3xl font-extrabold text-white tracking-tighter">Attendly</span>
              </div>
              <p className="mt-1.5 text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Digital Attendance System</p>
            </div>
          </div>

          <div className="glass-card shadow-3xl border-white/[0.08]">
            <div className="p-8 sm:p-11">
              <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
                <h2 className="text-3xl font-bold text-white tracking-tighter mb-2">Sign In</h2>
                <p className="text-gray-500 font-medium text-xs">Access your personal dashboard.</p>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-7">
                <AuthField
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="name@institution.com"
                  value={formData.email}
                  onChange={(val) => setFormData(prev => ({ ...prev, email: val }))}
                  disabled={isLoading}
                  required
                />

                <div className="space-y-2">
                  <AuthField
                    id="password"
                    label="Password"
                    type="password"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(val) => setFormData(prev => ({ ...prev, password: val }))}
                    disabled={isLoading}
                    required
                    showToggle
                    isToggled={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                  />
                  <div className="flex justify-end pr-0.5 animate-in fade-in duration-1000 delay-500">
                    <Link to="/forgot-password" className="text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:text-primary transition-all duration-300">
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  name="signin-button"
                  className="w-full h-11 bg-primary hover:bg-primary/95 text-primary-foreground font-bold transition-all duration-500 active:scale-[0.97] shadow-[0_0_20px_rgba(16,185,129,0.15)] rounded-xl mt-2 group relative overflow-hidden"
                  disabled={isLoading}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2.5 text-sm tracking-tight">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="animate-pulse">{loadingText}</span>
                      </>
                    ) : (
                      <>
                        Sign In to Dashboard
                        <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1.5" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-[1100ms] fill-mode-both">
            <a
              href="/Attendly.apk"
              download
              className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-500 group"
            >
              <div className="p-2.5 rounded-xl bg-white/[0.03] group-hover:bg-primary/10 text-gray-400 group-hover:text-primary transition-all duration-500">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] group-hover:text-primary/70 transition-colors">Available for Android</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-tight">Download Mobile App</span>
                </div>
              </div>
            </a>
          </div>

          <footer className="mt-12 text-center animate-in fade-in duration-1000 delay-1000 fill-mode-both">
            <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-gray-700/50">
              © 2026 Attendly • Digital Learning System
            </p>
          </footer>
        </div>
      </div>

      <style>{`
        .text-gradient {
          background: linear-gradient(135deg, #09D597 0%, #10b981 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .ease-out-expo { transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1); }
        .fill-mode-both { animation-fill-mode: both; }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        @keyframes slow-zoom {
          0% { transform: scale(1.1); }
          100% { transform: scale(1.2); }
        }
        .animate-slow-zoom { animation: slow-zoom 30s infinite alternate ease-in-out; }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Login;
