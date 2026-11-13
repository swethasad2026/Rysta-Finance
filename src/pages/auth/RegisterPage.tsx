import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Zap, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { useToast } from '@/components/shared/Toast';
import { registerUser, pingWebhook } from '@/api/auth';
import { SIGNUP_WEBHOOK_URL } from '@/api/client';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid work email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must match'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function calculatePasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: 'Empty', color: 'bg-muted' };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score <= 3) return { score, label: 'Fair', color: 'bg-amber-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

export const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [useTestWebhook, setUseTestWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookPingResult, setWebhookPingResult] = useState<{ success: boolean; message: string } | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const productionUrl = 'https://api.agents.snsihub.ai/webhook/2e301a35-6212-434d-a902-9cba86d82c47';
  const testUrl = 'https://api.agents.snsihub.ai/webhook-test/2e301a35-6212-434d-a902-9cba86d82c47';
  const currentWebhookUrl = useTestWebhook ? testUrl : productionUrl;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password', '');
  const strength = calculatePasswordStrength(passwordValue);

  const handleTestPing = async () => {
    setIsTestingWebhook(true);
    setWebhookPingResult(null);
    try {
      const email = watch('email') || 'trigger-test@rystafmcg.com';
      const password = watch('password') || 'Password123!';
      const name = watch('name') || 'Test Trigger';
      const result = await pingWebhook(currentWebhookUrl, {
        test: true,
        action: 'register',
        name: name,
        email: email.trim(),
        password: password,
        pass: password,
        timestamp: new Date().toISOString(),
      });
      setWebhookPingResult(result);
      toast({
        title: result.success ? '⚡ Webhook Triggered!' : 'Webhook Notice',
        description: result.message,
        variant: result.success ? 'success' : 'destructive',
      });
    } catch (err: any) {
      setWebhookPingResult({ success: false, message: err.message || 'Failed to ping webhook' });
      toast({ title: 'Ping Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await registerUser(
        {
          name: data.name,
          email: data.email,
          password: data.password,
        },
        currentWebhookUrl
      );

      setIsSuccess(true);
      toast({
        title: 'Account Registered',
        description: res.message || 'Account created successfully. Please sign in.',
        variant: 'success',
      });

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      if (err.status === 409) {
        setErrorMessage('An account with this email address already exists. Please log in instead.');
      } else if (err.status === 400) {
        setErrorMessage(err.message || 'Invalid registration details provided.');
      } else {
        setErrorMessage(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg border-border/60">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Create Corporate Account</CardTitle>
        <CardDescription className="flex flex-col items-center gap-2">
          <span>Join your FMCG enterprise distribution and financial network</span>
          
          <div className="flex flex-col items-center gap-1.5 w-full pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 max-w-full truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">URL: {currentWebhookUrl.replace('https://', '')}</span>
            </span>

            {/* Test Trigger Helper Bar */}
            <div className="flex items-center justify-center gap-2 pt-1 text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestPing}
                isLoading={isTestingWebhook}
                className="h-7 text-[11px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Zap className="h-3 w-3" />
                Test Trigger Now
              </Button>

              <button
                type="button"
                onClick={() => {
                  setUseTestWebhook(!useTestWebhook);
                  setWebhookPingResult(null);
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground underline decoration-dotted"
                title="Switch between live production URL and canvas test URL"
              >
                Switch to {useTestWebhook ? 'Production Mode (/webhook/)' : 'Canvas Test Mode (/webhook-test/)'}
              </button>
            </div>

            {webhookPingResult && (
              <div
                className={`text-[11px] p-2 rounded-md border w-full text-left mt-1 ${
                  webhookPingResult.success
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                }`}
              >
                <div className="font-semibold">{webhookPingResult.success ? '🟢 Response 200 OK' : '⚠️ Response Notice'}:</div>
                <div>{webhookPingResult.message}</div>
              </div>
            )}
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">Account Created!</h3>
            <p className="text-sm text-muted-foreground">
              Redirecting you to the sign-in page...
            </p>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="mb-4 flex items-start gap-2 p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in-50">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField label="Full Name" htmlFor="name" required error={errors.name?.message}>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Rajesh Sharma"
                    className="pl-9"
                    {...register('name')}
                    error={!!errors.name}
                  />
                </div>
              </FormField>

              <FormField label="Work Email Address" htmlFor="email" required error={errors.email?.message}>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className="pl-9"
                    {...register('email')}
                    error={!!errors.email}
                  />
                </div>
              </FormField>

              <FormField
                label="Password"
                htmlFor="password"
                required
                error={errors.password?.message}
              >
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

                {/* Password Strength Meter */}
                {passwordValue && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-muted-foreground">Strength:</span>
                      <span className="font-semibold">{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${(strength.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </FormField>

              <FormField
                label="Confirm Password"
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
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </CardContent>

      <CardFooter className="justify-center border-t py-4 text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="ml-1 text-primary hover:underline font-medium">
          Sign In
        </Link>
      </CardFooter>
    </Card>
  );
};
