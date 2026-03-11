import { useRef, useState } from 'react';

import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';

import type { LoginFormData } from '@/pages/login/api/login-user';
import { InputField } from '@/pages/login/components/form-input-field';
import { FormLabel } from '@/pages/login/components/form-label';
import { SubmitButton } from '@/pages/login/components/submit-button';
import { useLogin } from '@/pages/login/hooks/login-user';
import { togglePasswordVisibility } from '@/pages/login/utils/toggle-password-visibility';

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();
  const { mutate, isPending } = useLogin();

  const onSubmit = (data: LoginFormData) => {
    mutate(data);
  };

  // Merge react-hook-form ref with our manual ref
  const { ref: passwordFieldRef, ...passwordRegister } = register('password', {
    required: 'Password is required',
    minLength: {
      value: 6,
      message: 'Password must be at least 6 characters',
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-500 p-4 font-sans text-slate-700">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:p-10 p-4 border border-gray-50">
        <h1 className="text-3xl font-semibold text-blue-500 text-center mb-8">
          Login
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <FormLabel>Email address</FormLabel>
            <InputField
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="text"
              autoFocus
              placeholder="Enter email"
              error={errors.email?.message}
            />
          </div>

          <div>
            <FormLabel>Password</FormLabel>
            <InputField
              {...passwordRegister}
              ref={(e) => {
                passwordFieldRef(e);
                passwordRef.current = e;
              }}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              error={errors.password?.message}
              suffix={
                <button
                  type="button"
                  onClick={() =>
                    togglePasswordVisibility(
                      passwordRef.current,
                      showPassword,
                      setShowPassword
                    )
                  }
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
          </div>

          <SubmitButton isPending={isPending}>Login</SubmitButton>
        </form>
      </div>
    </div>
  );
};
