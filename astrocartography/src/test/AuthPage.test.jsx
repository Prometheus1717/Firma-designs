import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockResetPassword = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    resetPassword: mockResetPassword,
    user: null,
    loading: false,
    hasBirthData: false,
  }),
}));

const mockSignInWithOtp = vi.fn();
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { signInWithOtp: (...args) => mockSignInWithOtp(...args) } },
}));

import AuthPage from '../pages/AuthPage';

function renderAuthPage(mode = 'login') {
  window.history.pushState({}, '', `/auth?mode=${mode}`);
  return render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>
  );
}

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('renders passwordless login form with branding, fields, and footer', () => {
    renderAuthPage();
    expect(screen.getByText('NATAL NAVIGATOR')).toBeInTheDocument();
    expect(screen.getByText('YOUR PERSONAL ASTROCARTOGRAPHY MAP')).toBeInTheDocument();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    // Passwordless is the default: no password field, magic-link CTA instead.
    expect(screen.queryByPlaceholderText('Min. 6 characters')).not.toBeInTheDocument();
    expect(screen.getByText('EMAIL ME A LOGIN LINK')).toBeInTheDocument();
    expect(screen.getByText('Sign in with password instead')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
    expect(screen.getByText(/NATAL NAVIGATOR © 2026/)).toBeInTheDocument();
  });

  it('sends a magic link on passwordless login submit', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    renderAuthPage();
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'Test@Test.com');
    await userEvent.click(screen.getByText('EMAIL ME A LOGIN LINK'));
    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@test.com',
        options: expect.objectContaining({ shouldCreateUser: false }),
      });
      expect(screen.getByText(/Login link sent/)).toBeInTheDocument();
    });
  });

  it('switches between login, signup, and reset modes', async () => {
    renderAuthPage();
    // → signup
    await userEvent.click(screen.getByText('NEW HERE? CREATE ACCOUNT'));
    expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    expect(screen.getByText('CREATE ACCOUNT')).toBeInTheDocument();
    // → back to login
    await userEvent.click(screen.getByText('Sign in'));
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    // → password mode reveals the reset entry point
    await userEvent.click(screen.getByText('Sign in with password instead'));
    expect(screen.getByPlaceholderText('Min. 6 characters')).toBeInTheDocument();
    // → reset
    await userEvent.click(screen.getByText('Forgot password?'));
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByText('SEND RESET LINK')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Min. 6 characters')).not.toBeInTheDocument();
    // → back to login
    await userEvent.click(screen.getByText(/Back to sign in/));
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('calls signIn on password login submit', async () => {
    mockSignIn.mockResolvedValue({});
    renderAuthPage();
    await userEvent.click(screen.getByText('Sign in with password instead'));
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 6 characters'), 'password123');
    await userEvent.click(screen.getByText('SIGN IN'));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'password123'));
  });

  it('calls signUp and shows confirmation with GO TO SIGN IN', async () => {
    mockSignUp.mockResolvedValue({ user: { id: '1' }, session: null });
    renderAuthPage('signup');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'new@test.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 6 characters'), 'password123');
    await userEvent.click(screen.getByText('CREATE ACCOUNT'));
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('new@test.com', 'password123');
      expect(screen.getByText(/Check your email/)).toBeInTheDocument();
      expect(screen.getByText('GO TO SIGN IN')).toBeInTheDocument();
    });
  });

  it('calls resetPassword on reset submit', async () => {
    mockResetPassword.mockResolvedValue({});
    renderAuthPage();
    await userEvent.click(screen.getByText('Sign in with password instead'));
    await userEvent.click(screen.getByText('Forgot password?'));
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'forgot@test.com');
    await userEvent.click(screen.getByText('SEND RESET LINK'));
    await waitFor(() => expect(mockResetPassword).toHaveBeenCalledWith('forgot@test.com'));
  });

  it('shows error on failed password login', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'));
    renderAuthPage();
    await userEvent.click(screen.getByText('Sign in with password instead'));
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'bad@test.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 6 characters'), 'wrong');
    await userEvent.click(screen.getByText('SIGN IN'));
    await waitFor(() => expect(screen.getByText(/No account found with these credentials/)).toBeInTheDocument());
  });
});
