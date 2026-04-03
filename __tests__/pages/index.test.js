// __tests__/pages/index.test.js
import { render, screen } from '@testing-library/react';
import HomePage from '../../pages/index';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
  }),
}));

// Mock useLoadScript
jest.mock('@react-google-maps/api', () => ({
  useLoadScript: () => ({ isLoaded: true, loadError: null }),
}));

describe('Home Page', () => {
  test('renders hero section', () => {
    render(<HomePage />);
    expect(screen.getByText(/Book Your Ride Instantly/i)).toBeInTheDocument();
  });

  test('renders vehicle selection options', () => {
    render(<HomePage />);
    expect(screen.getByText(/Sedan/i)).toBeInTheDocument();
    expect(screen.getByText(/SUV/i)).toBeInTheDocument();
  });

  test('renders popular destinations section', () => {
    render(<HomePage />);
    expect(screen.getByText(/Explore Sacred India/i)).toBeInTheDocument();
    expect(screen.getByText(/Ujjain Mahakaleshwar/i)).toBeInTheDocument();
  });
});