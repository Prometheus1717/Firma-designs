import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockSaveBirthData = vi.fn();
const mockSignOut = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    saveBirthData: mockSaveBirthData,
    signOut: mockSignOut,
    hasBirthData: false,
    profile: null,
    user: { id: 'test-user', email: 'test@test.com' },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import BirthDataPage from '../pages/BirthDataPage';

function renderPage() {
  return render(<MemoryRouter><BirthDataPage /></MemoryRouter>);
}

describe('BirthDataPage', () => {
  beforeEach(() => { vi.clearAllMocks(); global.fetch = vi.fn(); });

  it('renders form with all fields, branding, and info text', () => {
    renderPage();
    expect(screen.getByText('NATAL NAVIGATOR')).toBeInTheDocument();
    expect(screen.getByText('ENTER YOUR BIRTH DATA')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Optional')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('18.03.1995')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('14:30')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('London, New York, Sydney...')).toBeInTheDocument();
    expect(screen.getByText('GENERATE MY NATAL CHART')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
    expect(screen.getByText(/For accurate astrocartography lines/)).toBeInTheDocument();
  });

  it('auto-formats date (dd.mm.yyyy) and time (HH:MM) with 12h display', async () => {
    renderPage();
    const dateInput = screen.getByPlaceholderText('18.03.1995');
    await userEvent.type(dateInput, '15061990');
    expect(dateInput.value).toBe('15.06.1990');

    const timeInput = screen.getByPlaceholderText('14:30');
    await userEvent.type(timeInput, '1430');
    expect(timeInput.value).toBe('14:30');
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
  });

  it('shows error when submitting without city', async () => {
    renderPage();
    await userEvent.type(screen.getByPlaceholderText('18.03.1995'), '15061990');
    await userEvent.type(screen.getByPlaceholderText('14:30'), '1430');
    await userEvent.click(screen.getByText('GENERATE MY NATAL CHART'));
    expect(screen.getByText('Please search and select your birth city.')).toBeInTheDocument();
  });

  it('city search triggers API call after typing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([{
        type: 'city', class: 'place', name: 'London', lat: '51.51', lon: '-0.13',
        display_name: 'London, England, UK', address: { city: 'London', country_code: 'gb' },
      }]),
    });
    renderPage();
    await userEvent.type(screen.getByPlaceholderText('London, New York, Sydney...'), 'London');
    await waitFor(() => expect(global.fetch).toHaveBeenCalled(), { timeout: 1000 });
  });

  it('calls signOut when clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByText('Sign out'));
    expect(mockSignOut).toHaveBeenCalled();
  });
});
