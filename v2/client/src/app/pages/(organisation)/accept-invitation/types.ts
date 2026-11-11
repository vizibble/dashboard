export type InvitationState =
  | { status: 'checking' }
  | { status: 'authentication-required' }
  | { status: 'accepting' }
  | { status: 'error'; message: string };
