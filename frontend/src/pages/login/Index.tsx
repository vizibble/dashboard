import { Eye, EyeOff } from 'lucide-react';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { LoginFormData } from '@/pages/login/api/login-user';
import { useLogin } from '@/pages/login/hooks/login-user';
import { togglePasswordVisibility } from '@/pages/login/utils/toggle-password-visibility';

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<LoginFormData>();
  const { mutate, isPending } = useLogin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4 font-sans">
      <Card className="w-full max-w-sm shadow-2xl border-none">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">
            Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            id="login-form"
            onSubmit={form.handleSubmit((data) => mutate(data))}
          >
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-email">Email address</FieldLabel>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="m@example.com"
                      autoFocus
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                }}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        aria-invalid={fieldState.invalid}
                        {...field}
                        ref={(e) => {
                          field.ref(e);
                          passwordRef.current = e;
                        }}
                      />
                      <Button
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          togglePasswordVisibility(
                            passwordRef.current,
                            showPassword,
                            setShowPassword
                          )
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </Button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
                rules={{
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                }}
              />

              <Button
                className="w-full h-11 text-base font-semibold transition-all hover:translate-y-[-1px]"
                type="submit"
                disabled={isPending}
                form="login-form"
              >
                {isPending ? <Spinner /> : 'Login'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
