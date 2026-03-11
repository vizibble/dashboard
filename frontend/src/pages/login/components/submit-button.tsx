import React from 'react';

import { ClipLoader } from 'react-spinners';

interface SubmitButtonProps {
  isPending: boolean;
  children: React.ReactNode;
}

export const SubmitButton = ({ isPending, children }: SubmitButtonProps) => (
  <button
    id="login-submit"
    type="submit"
    disabled={isPending}
    className="bg-blue-500 hover:bg-blue-600 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-3xl py-2 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all sm:py-2.5 text-lg"
  >
    {isPending ? (
      <ClipLoader color="#ffffff" size={20} />
    ) : (
      <span>{children}</span>
    )}
  </button>
);
