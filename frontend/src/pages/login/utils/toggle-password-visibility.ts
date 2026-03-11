export const togglePasswordVisibility = (
  input: HTMLInputElement | null,
  showPassword: boolean,
  setShowPassword: (value: boolean) => void,
) => {
  if (!input) return;

  setShowPassword(!showPassword);

  // Focus back to password input after toggle and move cursor to end
  setTimeout(() => {
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }, 0);
};
