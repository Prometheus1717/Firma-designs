import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import BirthDataPage from '../pages/BirthDataPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <BirthDataPage />
    </MemoryRouter>
  );
}

describe('BirthDataPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the form with all fields', () => {
    renderPage();
    expect(screen.getByText('ENTER YOUR BIRTH DATA')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Optional')).toBeInTheDocument(); // name
    expect(screen.getByPlaceholderText('18.03.1995')).toBeInTheDocument(); // date
    expect(screen.getByPlaceholderText('14:30')).toBeInTheDocument(); // time
    expect(screen.getByPlaceholderText('London, New York, Sydney...')).toBeInTheDocument(); // city
  });

  it('shows NATAL NAVIGATOR branding', () => {
    renderPage();
    expect(screen.getByText('NATAL NAVIGATOR')).toBeInTheDocument();
  });

  it('has submit button', () => {
    renderPage();
    expect(screen.getByText('GENERATE MY NATAL CHART')).toBeInTheDocument();
  });

  it('has sign out link', () => {
    renderPage();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('auto-formats date input (dd.mm.yyyy)', async () => {
    renderPage();
    const dateInput = screen.getByPlaceholderText('18.03.1995');
    await userEvent.type(dateInput, '15061990');
    expect(dateInput.value).toBe('15.06.1990');
  });

  it('auto-formats time input (HH:MM)', async () => {
    renderPage();
    const timeInput = screen.getByPlaceholderText('14:30');
    await userEvent.type(timeInput, '1430');
    expect(timeInput.value).toBe('14:30');
  });

  it('shows 12-hour time display after valid time input', async () => {
    renderPage();
    const timeInput = screen.getByPlaceholderText('14:30');
    await userEvent.type(timeInput, '1430');
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
  });

  it('shows error when submitting without city', async () => {
    renderPage();
    const dateInput = screen.getByPlaceholderText('18.03.1995');
    const timeInput = screen.getByPlaceholderText('14:30');
    await userEvent.type(dateInput, '15061990');
    await userEvent.type(timeInput, '1430');
    await userEvent.click(screen.getByText('GENERATE MY NATAL CHART'));
    expect(screen.getByText('Please search and select your birth city.')).toBeInTheDocument();
  });

  it('shows accuracy information text', () => {
    renderPage();
    expect(screen.getByText(/For accurate astrocartography lines/)).toBeInTheDocument();
  });

  it('city search triggers API call after typing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([
        {
          type: 'city',
          class: 'place',
          name: 'London',
          lat: '51.51',
          lon: '-0.13',
          display_name: 'London, England, UK',
          address: { city: 'London', country_code: 'gb' },
        },
      ]),
    });
    renderPage();
    const cityInput = screen.getByPlaceholderText('London, New York, Sydney...');
    await userEvent.type(cityInput, 'London');
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('calls signOut when sign out is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByText('Sign out'));
    expect(mockSignOut).toHaveBeenCalled();
  });
});
