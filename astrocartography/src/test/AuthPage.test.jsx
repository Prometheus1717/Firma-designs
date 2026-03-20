import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

import AuthPage from '../pages/AuthPage';

function renderAuthPage() {
  return render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>
  );
}

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    renderAuthPage();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min. 6 characters')).toBeInTheDocument();
    expect(screen.getByText('SIGN IN')).toBeInTheDocument();
  });

  it('renders NATAL NAVIGATOR branding', () => {
    renderAuthPage();
    expect(screen.getByText('NATAL NAVIGATOR')).toBeInTheDocument();
    expect(screen.getByText('YOUR PERSONAL ASTROCARTOGRAPHY MAP')).toBeInTheDocument();
  });

  it('switches to signup mode', async () => {
    renderAuthPage();
    await userEvent.click(screen.getByText('Sign up'));
    expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    expect(screen.getByText('CREATE ACCOUNT')).toBeInTheDocument();
  });

  it('switches to reset password mode', async () => {
    renderAuthPage();
    await userEvent.click(screen.getByText('Forgot password?'));
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByText('SEND RESET LINK')).toBeInTheDocument();
  });

  it('switches back to login from signup', async () => {
    renderAuthPage();
    await userEvent.click(screen.getByText('Sign up'));
    await userEvent.click(screen.getByText('Sign in'));
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('switches back to login from reset', async () => {
    renderAuthPage();
    await userEvent.click(screen.getByText('Forgot password?'));
    await userEvent.click(screen.getByText(/Back to sign in/));
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('calls signIn on login submit', async () => {
    mockSignIn.mockResolvedValue({});
    renderAuthPage();
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 6 characters'), 'password123');
    await userEvent.click(screen.getByText('SIGN IN'));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('calls signUp on signup submit', async () => {
    mockSignUp.mockResolvedValue({ user: { id: '1' }, session: null });
    renderAuthPage();
    await userEvent.click(screen.getByText('Sign up'));
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'new@test.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 6 characters'), 'password123');
    await userEvent.click(screen.getByText('CREATE ACCOUNT'));
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('new@test.com', 'password123');
    });
  });

  it('shows confirmation message after signup', async () => {
    mockSignUp.mockResolvedValue({ user: { id: '1' }, session: null });
    renderAuthPage();
    await userEvent.click(screen.getByText('Sign up'));
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'new@test.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 6 characters'), 'password123');
    await userEvent.click(screen.getByText('CREATE ACCOUNT'));
    await waitFor(() => {
      expect(screen.getByText(/Check your email/)).toBeInTheDocument();
    });
  });

  it('shows GO TO SIGN IN button after signup confirmation', async () => {
    mockSignUp.mockResolvedValue({ user: { id: '1' }, session: null });
    renderAuthPage();
    await userEvent.click(screen.getByText('Sign up'));
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'new@test.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 6 characters'), 'password123');
    await userEvent.click(screen.getByText('CREATE ACCOUNT'));
    await waitFor(() => {
      expect(screen.getByText('GO TO SIGN IN')).toBeInTheDocument();
    });
  });

  it('calls resetPassword on reset submit', async () => {
    mockResetPassword.mockResolvedValue({});
    renderAuthPage();
    await userEvent.click(screen.getByText('Forgot password?'));
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'forgot@test.com');
    await userEvent.click(screen.getByText('SEND RESET LINK'));
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('forgot@test.com');
    });
  });

  it('shows error on failed login', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'));
    renderAuthPage();
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'bad@test.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 6 characters'), 'wrong');
    await userEvent.click(screen.getByText('SIGN IN'));
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('has close button', () => {
    renderAuthPage();
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('shows copyright footer', () => {
    renderAuthPage();
    expect(screen.getByText(/NATAL NAVIGATOR © 2026/)).toBeInTheDocument();
  });

  it('hides password field in reset mode', async () => {
    renderAuthPage();
    await userEvent.click(screen.getByText('Forgot password?'));
    expect(screen.queryByPlaceholderText('Min. 6 characters')).not.toBeInTheDocument();
  });
});
