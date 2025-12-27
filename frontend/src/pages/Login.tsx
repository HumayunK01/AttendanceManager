import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2, ClipboardCheck, Clock, Users, LucideIcon } from 'lucide-react';
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
  <div className="space-y-1 group transition-transform hover:scale-105 duration-300">
    <div className="flex items-center gap-2 text-primary">
      <Icon className="w-5 h-5" />
      <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
    </div>
    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold opacity-80">{label}</p>
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
  <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
    <Label htmlFor={id} className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
      {label}
    </Label>
    <div className="relative group/input">
      <Input
        id={id}
        type={showToggle ? (isToggled ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 bg-white/[0.03] border-white/5 focus:border-primary/50 transition-all duration-300 text-white rounded-2xl px-5 text-base placeholder:text-gray-600"
        disabled={disabled}
        required={required}
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1.5 focus:outline-none focus:text-primary"
          aria-label={isToggled ? "Hide password" : "Show password"}
        >
          {isToggled ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </div>
  </div>
);

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const roleRoutes: Record<UserRole, string> = useMemo(() => ({
    ADMIN: '/admin',
    FACULTY: '/faculty',
    STUDENT: '/student',
  }), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);

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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#030712] selection:bg-primary/20 selection:text-primary font-sans antialiased overflow-hidden">

      {/* ─── Left Panel: Branding & Impact ─── */}
      <div className="lg:flex-1 relative overflow-hidden hidden lg:flex flex-col justify-between p-12 border-r border-white/5">
        {/* Abstract Background Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen transition-transform duration-[30s] hover:scale-105 pointer-events-none"
          style={{ backgroundImage: 'url("/login-bg.png")' }}
        />

        {/* Dynamic Gradients */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#030712] via-transparent to-primary/10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030712] pointer-events-none" />

        {/* Brand Header */}
        <header className="relative z-10 animate-in fade-in slide-in-from-left duration-1000 ease-out">
          <div className="cursor-default flex flex-col items-start">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Attendly Logo" className="w-10 h-10 object-contain" />
              <span className="text-3xl font-extrabold tracking-tighter text-white block">Attendly</span>
            </div>
          </div>
        </header>

        {/* Centered Hero Content */}
        <main className="flex-1 flex flex-col justify-center py-20 relative z-10">
          <div className="max-w-xl animate-in fade-in slide-in-from-left duration-1000 delay-300 ease-out fill-mode-both">
            <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-8 tracking-tight whitespace-pre-line">
              Manage your{'\n'}
              <span className="block mt-2 text-gradient">Class Attendance</span>
            </h1>
            <p className="text-xl text-gray-400 font-light leading-relaxed mb-12 max-w-lg">
              The high-performance tracking suite for modern campuses.
              Precision records, effortless management.
            </p>

            <div className="grid grid-cols-3 gap-10">
              <StatItem icon={Users} value="500+" label="Students" />
              <StatItem icon={ClipboardCheck} value="Digital" label="Records" />
              <StatItem icon={Clock} value="Live" label="Sync" />
            </div>
          </div>
        </main>

        <footer className="relative z-10 animate-in fade-in slide-in-from-left duration-1000 delay-500 ease-out fill-mode-both">
          <a
            href="mailto:attendly.system@gmail.com"
            className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500 hover:text-primary transition-all duration-300 flex items-center gap-2 group opacity-60 hover:opacity-100"
          >
            <span className="w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
            Can't access your account?
          </a>
        </footer>
      </div>

      {/* ─── Right Panel: Authentication ─── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden bg-white/[0.01] backdrop-blur-3xl">
        {/* Ambient Atmosphere Glows */}
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/10 blur-[130px] rounded-full pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700 ease-out-expo">
          {/* Mobile-only Branding */}
          <div className="lg:hidden flex justify-center mb-12 text-center">
            <div className="group flex flex-col items-center">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Attendly Logo" className="w-8 h-8 object-contain" />
                <span className="text-3xl font-extrabold text-white tracking-tighter">Attendly</span>
              </div>
            </div>
          </div>

          <div className="glass-card shadow-3xl">
            <div className="p-8 sm:p-12">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Sign In</h2>
                <p className="text-gray-400 font-light text-sm">Access your personal campus dashboard.</p>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-7">
                <AuthField
                  id="email"
                  label="Campus Email"
                  type="email"
                  placeholder="name@institution.edu"
                  value={formData.email}
                  onChange={(val) => setFormData(prev => ({ ...prev, email: val }))}
                  disabled={isLoading}
                  required
                />

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

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all duration-300 active:scale-[0.98] shadow-lg rounded-2xl mt-4 group relative overflow-hidden"
                  disabled={isLoading}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-base">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </form>
            </div>
          </div>

          <footer className="mt-12 text-center text-gray-600">
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30">
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
      `}</style>
    </div>
  );
};

export default Login;
