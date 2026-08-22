import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff } from 'lucide-react';
import { useSignup } from '@/api';
import { AuthLayout } from '@/layouts/AuthLayout';
import { useToast } from '@/hooks/use-toast';

const signupSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  companyName: z.string().min(2, 'Company is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Minimum 8 chars'),
  department: z.string().min(2, 'Required'),
  jobPosition: z.string().min(2, 'Required'),
  phone: z.string().default(''),
  address: z.string().default(''),
  role: z.string().default('EMPLOYEE'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const signupMutation = useSignup();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '', email: '', password: '',
      companyName: '', department: '', jobPosition: '', phone: '', address: '', role: 'EMPLOYEE'
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      const response = await signupMutation.mutateAsync(data);
      if (response.success) {
        toast({ title: 'Account created!', description: 'Please log in with your new credentials.' });
        setLocation('/login');
      }
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.response?.data?.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthLayout>
      <h1>Create an account</h1>
      <div className="auth-switch">Already have an account? <Link href="/login">Log in</Link></div>
      
      <form className="auth-form" onSubmit={form.handleSubmit(onSubmit)}>
        
        <div className="form-row">
          <div className="auth-field-wrap">
            <input type="text" placeholder="Full name" {...form.register('name')} />
            {form.formState.errors.name && <p className="form-error">{form.formState.errors.name.message}</p>}
          </div>
          <div className="auth-field-wrap">
            <input type="text" placeholder="Company" {...form.register('companyName')} />
            {form.formState.errors.companyName && <p className="form-error">{form.formState.errors.companyName.message}</p>}
          </div>
        </div>

        <div className="auth-field-wrap">
          <input type="email" placeholder="Email" {...form.register('email')} />
          {form.formState.errors.email && <p className="form-error">{form.formState.errors.email.message}</p>}
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

        <div className="form-row">
          <div className="auth-field-wrap">
            <input type="text" placeholder="Department" {...form.register('department')} />
            {form.formState.errors.department && <p className="form-error">{form.formState.errors.department.message}</p>}
          </div>
          <div className="auth-field-wrap">
            <input type="text" placeholder="Job position" {...form.register('jobPosition')} />
            {form.formState.errors.jobPosition && <p className="form-error">{form.formState.errors.jobPosition.message}</p>}
          </div>
        </div>

        <label className="auth-check-label">
          <input type="checkbox" required /> I agree to the Terms & Conditions
        </label>
        
        <button type="submit" className="full-btn" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="auth-divider">Or register with</div>
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
