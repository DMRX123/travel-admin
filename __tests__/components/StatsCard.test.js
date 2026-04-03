// __tests__/components/StatsCard.test.js
import { render, screen } from '@testing-library/react';
import StatsCard from '../../components/StatsCard';

describe('StatsCard Component', () => {
  test('renders title and value correctly', () => {
    render(<StatsCard title="Total Users" value="1,234" icon="👥" color="blue" />);
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  test('renders icon correctly', () => {
    render(<StatsCard title="Revenue" value="₹50,000" icon="💰" color="green" />);
    
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  test('applies correct color class', () => {
    const { container } = render(<StatsCard title="Test" value="100" icon="📊" color="orange" />);
    
    const iconDiv = container.querySelector('.bg-orange-100');
    expect(iconDiv).toBeInTheDocument();
  });
});