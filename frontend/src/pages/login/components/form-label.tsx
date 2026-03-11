import React from 'react';

export const FormLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-medium text-gray-600 mb-2 ml-1">
    {children}
  </label>
);
