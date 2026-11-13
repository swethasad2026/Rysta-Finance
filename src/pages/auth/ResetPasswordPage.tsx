import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { useToast } from '@/components/shared/Toast';
import { resetPassword } from '@/api/auth';

const schema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must match'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export const ResetPasswordPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    await resetPassword(data.password);
    setIsLoading(false);
    setIsDone(true);
    toast({
      title: 'Password Updated',
      description: 'Your new password is set. Please sign in.',
      variant: 'success',
    });
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  return (
    <Card className="w-full shadow-lg border-border/60">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Set New Password</CardTitle>
        <CardDescription>
          Create a secure new password for your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isDone ? (
          <div className="py-4 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">Password Successfully Reset</h3>
            <p className="text-xs text-muted-foreground">Redirecting to sign-in...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="New Password" htmlFor="password" required error={errors.password?.message}>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  {...register('password')}
                  error={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            <FormField
              label="Confirm New Password"
              htmlFor="confirmPassword"
              required
              error={errors.confirmPassword?.message}
            >
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-9"
                  {...register('confirmPassword')}
                  error={!!errors.confirmPassword}
                />
              </div>
            </FormField>

            <Button type="submit" className="w-full h-10 font-medium" isLoading={isLoading}>
              Update Password
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center border-t py-4 text-xs text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline font-medium">
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
};
