import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Mail,
  Lock,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/shared/FormField';
import { useToast } from '@/components/shared/Toast';
import { useAuthStore } from '@/store/authStore';
import { authenticateWithBackend, AUTH_API_URL, pingWebhook } from '@/api/auth';
import { Zap } from 'lucide-react';

// Sign In Validation Schema
const signInSchema = z.object({
  email: z.string().email('Please enter a valid business email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(true),
});

type SignInFormData = z.infer<typeof signInSchema>;

// Sign Up Validation Schema (Explicitly collecting business_name, email, password; no Admin role selection)
const signUpSchema = z
  .object({
    business_name: z.string().min(2, 'Business / Company name must be at least 2 characters'),
    email: z.string().email('Please enter a valid business email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to terms of service',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

export const AuthPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  const modeParam = searchParams.get('mode');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(
    modeParam === 'signup' ? 'signup' : 'signin'
  );

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useTestWebhook, setUseTestWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookPingResult, setWebhookPingResult] = useState<{ success: boolean; message: string } | null>(null);

  // Webhook Endpoints
  const productionWebhookUrl = AUTH_API_URL;
  const testWebhookUrl = productionWebhookUrl.replace('/webhook/', '/webhook-test/');
  const currentWebhookUrl = useTestWebhook ? testWebhookUrl : productionWebhookUrl;

  const handleTestPing = async () => {
    setIsTestingWebhook(true);
    setWebhookPingResult(null);
    try {
      const email = (activeTab === 'signin' ? signInForm.watch('email') : signUpForm.watch('email')) || 'admin@rystafmcg.com';
      const password = (activeTab === 'signin' ? signInForm.watch('password') : signUpForm.watch('password')) || 'admin123';
      const action = activeTab === 'signin' ? 'login' : 'signup';

      console.log(`[Test Trigger] Sending ${action} test with email and password to ${currentWebhookUrl}`);

      const result = await pingWebhook(currentWebhookUrl, {
        test: true,
        action,
        email: email.trim(),
        password: password,
        pass: password,
        business_name: activeTab === 'signup' ? signUpForm.watch('business_name') || 'Rysta Enterprise' : undefined,
        timestamp: new Date().toISOString(),
      });
      setWebhookPingResult(result);
      toast({
        title: result.success ? '⚡ Webhook Triggered!' : 'Webhook Notice',
        description: `Dispatched ${action} payload (with email & password) to webhook. Status: ${result.status}`,
        variant: result.success ? 'success' : 'destructive',
      });
    } catch (err: any) {
      setWebhookPingResult({ success: false, message: err.message || 'Failed to ping webhook' });
      toast({ title: 'Ping Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Sync tab with URL
  useEffect(() => {
    if (modeParam === 'signup' && activeTab !== 'signup') {
      setActiveTab('signup');
    } else if (modeParam !== 'signup' && activeTab !== 'signin') {
      setActiveTab('signin');
    }
  }, [modeParam]);

  const switchTab = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setSearchParams({ mode: tab === 'signup' ? 'signup' : 'login' });
  };

  // Sign In Form
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  // Sign Up Form
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      business_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: true,
    },
  });

  // Handle Sign In submission
  const onSignInSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log(`[Sign In] Submitting credentials to webhook: email=${data.email.trim()}, passwordLength=${data.password?.length}`);
      const result = await authenticateWithBackend(
        {
          action: 'login',
          email: data.email.trim(),
          password: data.password,
        },
        currentWebhookUrl
      );

      if (result.authenticated === true) {
        const token = result.token || `auth-jwt-${Date.now()}`;
        const user = result.user || {
          id: `usr-${Date.now()}`,
          name: data.email.split('@')[0],
          business_name: data.email.split('@')[0],
          email: data.email,
          role: 'USER',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        setAuth(token, user);
        toast({
          title: 'Sign In Successful',
          description: result.message || 'Welcome back to Rysta Finance.',
          variant: 'success',
        });
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error('Invalid email or password. Account not found.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password. Account not found.';
      setErrorMessage(msg);
      toast({
        title: 'Sign In Failed',
        description: msg,
        variant: 'destructive',
      });
      // Strict rule: DO NOT redirect, stay on /auth
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up submission
  const onSignUpSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await authenticateWithBackend(
        {
          action: 'signup',
          business_name: data.business_name,
          email: data.email,
          password: data.password,
        },
        currentWebhookUrl
      );

      if (result.authenticated === true) {
        const token = result.token || `auth-jwt-${Date.now()}`;
        const user = result.user || {
          id: `usr-${Date.now()}`,
          name: data.business_name || data.email.split('@')[0],
          business_name: data.business_name,
          email: data.email,
          role: 'USER',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        setAuth(token, user);
        toast({
          title: 'Account Created',
          description: result.message || 'Your business account has been initialized.',
          variant: 'success',
        });
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error('This account already exists. Please sign in instead.');
      }
    } catch (err: any) {
      // 1. If Sign Up request fails, returns duplicate key, or returns without authenticated: true
      // Display clean friendly message: 'This account already exists. Please sign in instead.'
      const msg = 'This account already exists. Please sign in instead.';
      setErrorMessage(msg);
      toast({
        title: 'Registration Notice',
        description: msg,
        variant: 'destructive',
      });
      // Strict rule: DO NOT redirect, stay on /auth
    } finally {
      setIsLoading(false);
    }
  };

  // Demo bypass for user if backend is not yet returning authenticated: true
  const handleDemoAccess = () => {
    const mockUser = {
      id: 'demo-user-1',
      name: 'Rysta Demo Merchant',
      email: 'demo@rystafmcg.com',
      role: 'sales' as const,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    };
    setAuth('demo-jwt-token', mockUser);
    toast({
      title: 'Demo Access Granted',
      description: 'Entering Rysta Finance in offline demo preview mode.',
      variant: 'default',
    });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="w-full max-w-lg mx-auto py-4">
      {/* Tab Switcher */}
      <div className="flex bg-muted/70 p-1 rounded-xl mb-6 border border-border/50">
        <button
          type="button"
          onClick={() => switchTab('signin')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'signin'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => switchTab('signup')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'signup'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sign Up / Register
        </button>
      </div>

      <Card className="shadow-xl border-border/80">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {activeTab === 'signin' ? 'Sign In to Rysta' : 'Create Business Account'}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestPing}
                disabled={isTestingWebhook}
                className="h-7 text-[11px] gap-1 px-2 border-primary/30 text-primary hover:bg-primary/10"
                title="Send a live test payload with email and password to the webhook"
              >
                <Zap className="h-3 w-3" />
                {isTestingWebhook ? 'Testing...' : 'Test Webhook'}
              </Button>
              <Badge variant="outline" className="text-[11px] font-medium text-primary border-primary/30">
                {useTestWebhook ? 'Test Endpoint' : 'Secure API'}
              </Badge>
              <button
                type="button"
                onClick={() => setUseTestWebhook(!useTestWebhook)}
                className="text-[10px] text-muted-foreground hover:text-foreground font-medium"
                title={useTestWebhook ? 'Switch to Production Endpoint' : 'Switch to Test Endpoint (for n8n test runs)'}
              >
                ({useTestWebhook ? 'use Live' : 'use Test'})
              </button>
            </div>
          </div>
          <CardDescription>
            {activeTab === 'signin'
              ? 'Enter your work email and password to access cash flow and invoice analytics'
              : 'Register your FMCG enterprise to begin automated reconciliation & shortage forecasting'}
          </CardDescription>

          {webhookPingResult && (
            <div
              className={`text-[11px] p-2 rounded-md border text-left mt-2 ${
                webhookPingResult.success
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
              }`}
            >
              <div className="font-semibold">{webhookPingResult.success ? '🟢 Webhook Response' : '⚠️ Webhook Notice'}:</div>
              <div>{webhookPingResult.message}</div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* User-friendly Authentication Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm space-y-1">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-destructive" />
                <div className="flex-1">
                  <p className="font-semibold text-xs tracking-wide uppercase">
                    {activeTab === 'signup' ? 'Account Notice' : 'Sign In Notice'}
                  </p>
                  <p className="text-xs leading-relaxed mt-0.5">{errorMessage}</p>
                  {activeTab === 'signup' && (
                    <button
                      type="button"
                      onClick={() => switchTab('signin')}
                      className="mt-2 text-xs font-semibold text-primary underline block hover:opacity-85"
                    >
                      Sign In to your existing account &rarr;
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SIGN IN FORM */}
          {activeTab === 'signin' && (
            <form onSubmit={signInForm.handleSubmit(onSignInSubmit)} className="space-y-4">
              <FormField label="Work Email Address" error={signInForm.formState.errors.email?.message} required>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...signInForm.register('email')}
                    type="email"
                    placeholder="finance@yourcompany.com"
                    className="pl-9"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </FormField>

              <FormField label="Password" error={signInForm.formState.errors.password?.message} required>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...signInForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={signInForm.watch('rememberMe')}
                    onCheckedChange={(checked) => signInForm.setValue('rememberMe', Boolean(checked))}
                  />
                  <span className="text-muted-foreground">Keep me signed in</span>
                </label>
                <Link to="/forgot-password" className="text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 shadow-md shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
              <FormField label="Business / Company Name" error={signUpForm.formState.errors.business_name?.message} required>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...signUpForm.register('business_name')}
                    placeholder="e.g. Apex FMCG Distributors LLP"
                    className="pl-9"
                    disabled={isLoading}
                    autoComplete="organization"
                  />
                </div>
              </FormField>

              <FormField label="Work Email Address" error={signUpForm.formState.errors.email?.message} required>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...signUpForm.register('email')}
                    type="email"
                    placeholder="owner@apexdistributors.com"
                    className="pl-9"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </FormField>

              <FormField label="Password" error={signUpForm.formState.errors.password?.message} required>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...signUpForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    className="pl-9 pr-9"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <FormField label="Confirm Password" error={signUpForm.formState.errors.confirmPassword?.message} required>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...signUpForm.register('confirmPassword')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    className="pl-9"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </FormField>

              {/* Requirement: Do not allow choosing Admin role */}
              <div className="p-2.5 rounded-lg bg-muted/60 border border-border/60 flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  New accounts are provisioned with <strong>Standard Business Organization</strong> privileges. Admin access can be granted internally by your corporate organization supervisor.
                </span>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs select-none">
                  <Checkbox
                    checked={signUpForm.watch('agreeTerms')}
                    onCheckedChange={(checked) => signUpForm.setValue('agreeTerms', Boolean(checked))}
                    className="mt-0.5"
                  />
                  <span className="text-muted-foreground">
                    I agree to the Rysta Finance terms of service and acknowledge automated webhook data processing.
                  </span>
                </label>
                {signUpForm.formState.errors.agreeTerms && (
                  <p className="text-[11px] text-destructive mt-1">
                    {signUpForm.formState.errors.agreeTerms.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 shadow-md shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Business Account
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2 border-t border-border/40 text-xs text-muted-foreground">
          <div className="flex items-center justify-between w-full">
            <span>Security:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> 256-bit Encrypted
            </span>
          </div>

          {/* Quick Offline Demo Bypass link if backend is unreachable */}
          <div className="w-full pt-1 flex items-center justify-between border-t border-dashed border-border/50 text-[11px]">
            <span>Need to preview dashboard offline?</span>
            <button
              type="button"
              onClick={handleDemoAccess}
              className="text-primary hover:underline font-semibold"
            >
              Enter Demo Mode
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
