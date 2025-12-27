
import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false);

    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const checkToken = async () => {
            if (!token) {
                setIsVerifying(false);
                return;
            }

            try {
                await authAPI.verifyToken(token);
                setIsTokenValid(true);
            } catch (error) {
                setIsTokenValid(false);
            } finally {
                setIsVerifying(false);
            }
        };

        checkToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast({
                variant: 'destructive',
                title: 'Weak Password',
                description: 'Password must be at least 6 characters long.',
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Mismatch',
                description: 'Passwords do not match.',
            });
            return;
        }

        setIsLoading(true);
        try {
            await authAPI.resetPassword(token!, password);

            toast({
                title: 'Success!',
                description: 'Your password has been reset. Please login.',
            });

            // Redirect to login after 2 seconds
            setTimeout(() => navigate('/'), 2000);

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to reset password. The link may have expired.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Verifying link...</p>
                </div>
            </div>
        );
    }

    if (!token || !isTokenValid) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center space-y-6 max-w-sm">
                    <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">Link Expired</h1>
                        <p className="text-muted-foreground">
                            This password reset link is invalid or has already been used.
                        </p>
                    </div>
                    <Button asChild className="w-full" variant="secondary">
                        <Link to="/forgot-password">Request New Link</Link>
                    </Button>
                    <div>
                        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
                            Return to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500">
                <div className="bg-card/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight mb-2">Reset Password</h1>
                        <p className="text-muted-foreground text-sm">
                            Create a new, secure password for your account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background/50 border border-input rounded-lg pl-10 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                                    placeholder="Enter new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-background/50 border border-input rounded-lg pl-10 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                                    placeholder="Repeat new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </form>
                </div>
            </div>

            <div className="absolute bottom-8 text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Attendly Systems.
            </div>
        </div>
    );
};

export default ResetPassword;
