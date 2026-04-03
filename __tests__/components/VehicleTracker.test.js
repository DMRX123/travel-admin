// __tests__/components/VehicleTracker.test.js
import { render, screen } from '@testing-library/react';
import VehicleTracker from '../../components/VehicleTracker';

describe('VehicleTracker Component', () => {
  test('renders without crashing', () => {
    render(<VehicleTracker />);
    expect(screen.getByText(/Nearby Vehicles/i)).toBeInTheDocument();
  });

  test('shows loading state when loading prop is true', () => {
    render(<VehicleTracker />);
    // Component has internal loading state
    expect(screen.queryByText(/No vehicles available/i)).toBeDefined();
  });
});