import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { loginRequest } from '@/pages/login/api/login-user';
import { useMutation } from '@tanstack/react-query';

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: () => {
      toast.success('Login successful');
      navigate('/');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
