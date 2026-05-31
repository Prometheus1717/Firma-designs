import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    saveBirthData: vi.fn(),
    signOut: vi.fn(),
  }),
}));

import BirthDataModal from '../components/BirthDataModal';

const flushClose = async () => { await act(async () => { await new Promise(r => setTimeout(r, 250)); }); };

describe('BirthDataModal close behaviour', () => {
  beforeEach(() => { document.body.style.overflow = ''; });

  it('renders an accessible dialog with a labelled close button', () => {
    render(<BirthDataModal onDismiss={vi.fn()} onComplete={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /close/i });
    expect(btn).toBeInTheDocument();
    // Tap target must be large enough to actually hit (>= 32px square)
    const w = parseFloat(btn.style.width || '0');
    const h = parseFloat(btn.style.height || '0');
    expect(w).toBeGreaterThanOrEqual(32);
    expect(h).toBeGreaterThanOrEqual(32);
  });

  it('calls onDismiss when the close button is clicked', async () => {
    const onDismiss = vi.fn();
    render(<BirthDataModal onDismiss={onDismiss} onComplete={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    await flushClose();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when the backdrop is clicked', async () => {
    const onDismiss = vi.fn();
    render(<BirthDataModal onDismiss={onDismiss} onComplete={vi.fn()} />);
    fireEvent.mouseDown(screen.getByRole('dialog'));
    await flushClose();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onDismiss when clicking inside the card', async () => {
    const onDismiss = vi.fn();
    render(<BirthDataModal onDismiss={onDismiss} onComplete={vi.fn()} />);
    fireEvent.mouseDown(screen.getByRole('heading', { level: 2 }));
    await flushClose();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('calls onDismiss on ESC key', async () => {
    const onDismiss = vi.fn();
    render(<BirthDataModal onDismiss={onDismiss} onComplete={vi.fn()} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    await flushClose();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('locks body scroll while mounted and restores on unmount', () => {
    const { unmount } = render(<BirthDataModal onDismiss={vi.fn()} onComplete={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
