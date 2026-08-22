import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff } from 'lucide-react';
import { useLogin } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      // Determine if identifier is an email or employee ID
      const isEmail = data.identifier.includes('@');
      const payload = isEmail 
        ? { email: data.identifier, password: data.password }
        : { loginId: data.identifier, password: data.password };

      const response = await loginMutation.mutateAsync(payload);
      
      if (response.success && response.token) {
        login(response.token, response.user);
        toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
        setLocation('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-container glass">
        <div className="brand-mark mb-6">D</div>
        <h1 className="text-2xl font-semibold mb-2">Log in to Dayflow</h1>
        <p className="text-muted-foreground mb-6">Enter your email or employee ID to continue.</p>

        <form className="auth-form" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="auth-field-wrap mb-4">
            <input 
              type="text" 
              placeholder="Email or Employee ID" 
              className={`w-full p-3 rounded border ${form.formState.errors.identifier ? 'border-red-500' : 'border-border'} bg-background`}
              {...form.register('identifier')} 
            />
            {form.formState.errors.identifier && <span className="text-red-500 text-sm mt-1">{form.formState.errors.identifier.message}</span>}
          </div>

          <div className="auth-field-wrap mb-6 relative">
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Password" 
              className={`w-full p-3 rounded border ${form.formState.errors.password ? 'border-red-500' : 'border-border'} bg-background pr-10`}
              {...form.register('password')} 
            />
            <button type="button" className="absolute right-3 top-3 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {form.formState.errors.password && <span className="text-red-500 text-sm mt-1">{form.formState.errors.password.message}</span>}
          </div>

          <Button type="submit" className="w-full mb-4 py-6" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <div className="auth-switch text-center text-sm text-muted-foreground">
          Don't have an account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
