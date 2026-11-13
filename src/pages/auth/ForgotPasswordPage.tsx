import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { forgotPassword } from '@/api/auth';

const schema = z.object({
  email: z.string().email('Please enter a valid work email address'),
});

type FormData = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    await forgotPassword(data.email);
    setIsLoading(false);
    setSubmittedEmail(data.email);
  };

  return (
    <Card className="w-full shadow-lg border-border/60">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Reset Password</CardTitle>
        <CardDescription>
          Enter your email to receive password recovery instructions
        </CardDescription>
      </CardHeader>

      <CardContent>
        {submittedEmail ? (
          <div className="py-4 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">Check Your Inbox</h3>
            <p className="text-xs text-muted-foreground">
              We sent a password reset link to <strong className="text-foreground">{submittedEmail}</strong>.
            </p>
            <div className="pt-2">
              <Link to="/reset-password">
                <Button variant="outline" size="sm" className="w-full">
                  Proceed to Reset Screen (Demo)
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Email Address" htmlFor="email" required error={errors.email?.message}>
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

            <Button type="submit" className="w-full h-10 font-medium" isLoading={isLoading}>
              Send Reset Link
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center border-t py-4 text-xs text-muted-foreground">
        <Link to="/login" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
};
