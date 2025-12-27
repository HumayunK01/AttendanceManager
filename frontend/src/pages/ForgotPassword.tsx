import { useState } from 'react';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await authAPI.forgotPassword(email);
            setIsSent(true);
            toast({
                title: 'Email Sent',
                description: 'If an account exists, you will receive a reset link shortly.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Something went wrong. Please try again later.',
            });
        } finally {
            setIsLoading(false);
        }
    };

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
                            <Mail className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight mb-2">Forgot Password?</h1>
                        <p className="text-muted-foreground text-sm">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {!isSent ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-background/50 border border-input rounded-lg pl-10 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    'Sending...'
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Send Reset Link <Send className="w-4 h-4" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="bg-green-500/10 text-green-500 p-4 rounded-lg text-sm border border-green-500/20">
                                Check your email for the reset link.
                            </div>
                            <Button variant="outline" className="w-full" onClick={() => setIsSent(false)}>
                                Try another email
                            </Button>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Attendly Systems.
            </div>
        </div>
    );
};

export default ForgotPassword;
