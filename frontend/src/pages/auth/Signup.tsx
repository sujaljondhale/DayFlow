import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff } from 'lucide-react';
import { useSignup } from '@/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  companyName: z.string().min(2, 'Company name is required'),
  department: z.string().min(2, 'Department is required'),
  jobPosition: z.string().min(2, 'Job position is required'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  address: z.string().min(5, 'Address is required'),
  role: z.string().default('EMPLOYEE'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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
      name: '', email: '', password: '', confirmPassword: '',
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
    <div className="auth-layout min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="brand-mark mb-6 mx-auto flex justify-center text-4xl">D</div>
        <h2 className="text-center text-3xl font-extrabold text-foreground mb-2">Create an account</h2>
        <p className="text-center text-sm text-muted-foreground">
          Join Dayflow and manage your workday seamlessly.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input type="text" className={`w-full p-2.5 rounded border ${form.formState.errors.name ? 'border-red-500' : 'border-border'} bg-background`} {...form.register('name')} />
                {form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className={`w-full p-2.5 rounded border ${form.formState.errors.email ? 'border-red-500' : 'border-border'} bg-background`} {...form.register('email')} />
                {form.formState.errors.email && <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <input type="text" className={`w-full p-2.5 rounded border ${form.formState.errors.companyName ? 'border-red-500' : 'border-border'} bg-background`} {...form.register('companyName')} />
                {form.formState.errors.companyName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.companyName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="text" className={`w-full p-2.5 rounded border ${form.formState.errors.phone ? 'border-red-500' : 'border-border'} bg-background`} {...form.register('phone')} />
                {form.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <input type="text" className={`w-full p-2.5 rounded border ${form.formState.errors.department ? 'border-red-500' : 'border-border'} bg-background`} {...form.register('department')} />
                {form.formState.errors.department && <p className="text-red-500 text-xs mt-1">{form.formState.errors.department.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Job Position</label>
                <input type="text" className={`w-full p-2.5 rounded border ${form.formState.errors.jobPosition ? 'border-red-500' : 'border-border'} bg-background`} {...form.register('jobPosition')} />
                {form.formState.errors.jobPosition && <p className="text-red-500 text-xs mt-1">{form.formState.errors.jobPosition.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input type="text" className={`w-full p-2.5 rounded border ${form.formState.errors.address ? 'border-red-500' : 'border-border'} bg-background`} {...form.register('address')} />
              {form.formState.errors.address && <p className="text-red-500 text-xs mt-1">{form.formState.errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Password</label>
                <input type={showPassword ? 'text' : 'password'} className={`w-full p-2.5 rounded border ${form.formState.errors.password ? 'border-red-500' : 'border-border'} bg-background pr-10`} {...form.register('password')} />
                <button type="button" className="absolute right-3 top-9 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {form.formState.errors.password && <p className="text-red-500 text-xs mt-1">{form.formState.errors.password.message}</p>}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} className={`w-full p-2.5 rounded border ${form.formState.errors.confirmPassword ? 'border-red-500' : 'border-border'} bg-background pr-10`} {...form.register('confirmPassword')} />
                {form.formState.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{form.formState.errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full py-6" disabled={signupMutation.isPending}>
                {signupMutation.isPending ? 'Creating account...' : 'Create account'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
