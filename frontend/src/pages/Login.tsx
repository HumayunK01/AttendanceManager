import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      
      // Get user from localStorage after login
      const token = localStorage.getItem('token');
      if (token) {
        const { jwtDecode } = await import('jwt-decode');
        const decoded = jwtDecode<{ role: UserRole }>(token);
        
        const roleRoutes: Record<UserRole, string> = {
          ADMIN: '/admin',
          FACULTY: '/faculty',
          STUDENT: '/student',
        };

        toast({
          title: 'Login Successful',
          description: 'Redirecting to your dashboard...',
        });

        navigate(roleRoutes[decoded.role]);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid credentials. Please try again.';
      toast({
        title: 'Login Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="lg:flex-1 relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-background p-8 lg:p-12 flex flex-col justify-between">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">AttendanceMS</span>
          </div>
        </div>

        <div className="relative z-10 hidden lg:block">
          <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6">
            Streamline Your
            <br />
            <span className="text-gradient">Academic Attendance</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
            A comprehensive solution for managing student attendance, faculty schedules, 
            and academic records with precision and ease.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="glass-card p-4 hover-lift">
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted-foreground">Students Tracked</div>
            </div>
            <div className="glass-card p-4 hover-lift">
              <div className="text-2xl font-bold text-foreground">50+</div>
              <div className="text-sm text-muted-foreground">Faculty Members</div>
            </div>
            <div className="glass-card p-4 hover-lift">
              <div className="text-2xl font-bold text-foreground">98%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 hidden lg:block">
          <p className="text-sm text-muted-foreground">
            © 2024 Attendance Management System. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-card/50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              Sign in to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-secondary/50 border-border focus:border-primary focus:ring-primary pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 glow"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-secondary/30 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-medium text-foreground">Demo Access:</span>
              <br />
              Contact your administrator for login credentials
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground lg:hidden">
            © 2024 Attendance Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
