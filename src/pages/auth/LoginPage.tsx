import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/shared/FormField';
import { useToast } from '@/components/shared/Toast';
import { loginUser, pingWebhook } from '@/api/auth';
import { API_BASE_URL } from '@/api/client';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid work email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(true),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useTestWebhook, setUseTestWebhook] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookPingResult, setWebhookPingResult] = useState<{ success: boolean; message: string } | null>(null);
  const [searchParams] = useSearchParams();

  const isExpired = searchParams.get('expired') === 'true';

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  const productionUrl = 'https://api.agents.snsihub.ai/webhook/2e301a35-6212-434d-a902-9cba86d82c47';
  const testUrl = 'https://api.agents.snsihub.ai/webhook-test/2e301a35-6212-434d-a902-9cba86d82c47';
  const currentWebhookUrl = useTestWebhook ? testUrl : productionUrl;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@rystafmcg.com',
      password: 'admin123',
      rememberMe: true,
    },
  });

  const rememberMe = watch('rememberMe');

  const handleTestPing = async () => {
    setIsTestingWebhook(true);
    setWebhookPingResult(null);
    try {
      const email = watch('email') || 'admin@rystafmcg.com';
      const password = watch('password') || 'admin123';
      const result = await pingWebhook(currentWebhookUrl, {
        test: true,
        action: 'login',
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

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await loginUser(
        {
          email: data.email,
          password: data.password,
        },
        currentWebhookUrl
      );

      // ONLY navigate to dashboard if the response returned authenticated: true
      if (response?.authenticated !== true) {
        const errorMsg = 'Authentication denied: n8n webhook did not return authenticated: true.';
        setErrorMessage(errorMsg);
        toast({
          title: 'Login Denied',
          description: errorMsg,
          variant: 'destructive',
        });
        return;
      }

      setAuth(response.token, response.user, data.rememberMe, 8);

      toast({
        title: `Welcome back, ${response.user.name}!`,
        description: `Signed in as ${response.user.role.toUpperCase()} with 8-hour secure session.`,
        variant: 'success',
      });

      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify your email and password.';
      setErrorMessage(msg);
      toast({
        title: 'Authentication Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <Card className="w-full shadow-lg border-border/60">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Sign In to FMCG Portal</CardTitle>
        <CardDescription className="flex flex-col items-center gap-2">
          <span>Enter your corporate credentials to manage supply, invoices and ledgers</span>
          
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
        {isExpired && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Your previous session has expired. Please sign in again.</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 flex items-start gap-2 p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in-50">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          </FormField>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setValue('rememberMe', !!checked)}
              />
              <Label htmlFor="rememberMe" className="text-xs cursor-pointer font-normal text-muted-foreground">
                Remember me (keep session)
              </Label>
            </div>
            <Link
              to="/forgot-password"
              className="text-primary hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full h-10 font-medium" isLoading={isLoading}>
            Sign In to Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-6 pt-5 border-t">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">
            Quick Fill Demo Roles
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('admin@rystafmcg.com', 'admin123')}
              className="px-2 py-1.5 text-xs rounded border bg-muted/40 hover:bg-muted text-center font-medium transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('accountant@rystafmcg.com', 'acc123')}
              className="px-2 py-1.5 text-xs rounded border bg-muted/40 hover:bg-muted text-center font-medium transition-colors"
            >
              Accountant
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('sales@rystafmcg.com', 'sales123')}
              className="px-2 py-1.5 text-xs rounded border bg-muted/40 hover:bg-muted text-center font-medium transition-colors"
            >
              Sales
            </button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-center border-t py-4 text-xs text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="ml-1 text-primary hover:underline font-medium">
          Create an account
        </Link>
      </CardFooter>
    </Card>
  );
};
