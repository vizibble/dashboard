import { useNavigate } from 'react-router-dom';

import { loginRequest } from '@/pages/login/api/login-user';
import { useMutation } from '@tanstack/react-query';

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: () => {
      navigate('/');
    },
  });
}
