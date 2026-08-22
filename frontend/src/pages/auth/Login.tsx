import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff } from 'lucide-react';
import { useLogin } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from '@/layouts/AuthLayout';
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
    <AuthLayout>
      <h1>Sign in</h1>
      <div className="auth-switch">Don't have an account? <Link href="/signup">Sign up</Link></div>
      
      <form className="auth-form" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="auth-field-wrap">
          <input 
            type="text" 
            placeholder="Email or employee ID" 
            {...form.register('identifier')} 
          />
          {form.formState.errors.identifier && <p className="form-error">{form.formState.errors.identifier.message}</p>}
        </div>
        
        <div className="auth-field-wrap">
          <input 
            type={showPassword ? 'text' : 'password'} 
            placeholder="Enter your password" 
            {...form.register('password')} 
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', padding: 0, margin: 0, outline: 'none' }}>
             {showPassword ? <EyeOff className="password-icon" size={16} /> : <Eye className="password-icon" size={16} />}
          </button>
          {form.formState.errors.password && <p className="form-error">{form.formState.errors.password.message}</p>}
        </div>
        
        <label className="auth-check-label">
          <input type="checkbox" /> Keep me signed in
        </label>
        
        <button type="submit" className="full-btn" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      
      <div className="auth-divider">Or sign in with</div>
      <div className="social-logins">
        <button type="button" className="social-btn">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" width={16} alt="Google" /> Google
        </button>
        <button type="button" className="social-btn">
          <img src="https://www.svgrepo.com/show/511330/apple-173.svg" width={16} alt="Apple" style={{filter: 'invert(1)'}} /> Apple
        </button>
      </div>
    </AuthLayout>
  );
}
