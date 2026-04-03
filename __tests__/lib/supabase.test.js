// __tests__/lib/supabase.test.js
import { calculateFare, getAvailableVehicles } from '../../lib/supabase';

describe('Supabase Library Tests', () => {
  describe('calculateFare Function', () => {
    test('calculates correct fare for sedan', () => {
      const vehicle = { base_fare: 60, per_km_rate: 18 };
      const fare = calculateFare(vehicle, 10);
      expect(fare).toBe(240);
    });

    test('returns base fare for zero distance', () => {
      const vehicle = { base_fare: 60, per_km_rate: 18 };
      const fare = calculateFare(vehicle, 0);
      expect(fare).toBe(60);
    });

    test('handles different vehicle types correctly', () => {
      const auto = { base_fare: 30, per_km_rate: 12 };
      const sedan = { base_fare: 60, per_km_rate: 18 };
      const suv = { base_fare: 80, per_km_rate: 22 };
      
      expect(calculateFare(auto, 20)).toBe(270);
      expect(calculateFare(sedan, 20)).toBe(420);
      expect(calculateFare(suv, 20)).toBe(520);
    });
  });

  describe('getAvailableVehicles Function', () => {
    test('returns array of vehicles', async () => {
      const vehicles = await getAvailableVehicles();
      expect(Array.isArray(vehicles)).toBe(true);
      expect(vehicles.length).toBeGreaterThan(0);
    });

    test('each vehicle has required properties', async () => {
      const vehicles = await getAvailableVehicles();
      const firstVehicle = vehicles[0];
      expect(firstVehicle).toHaveProperty('type');
      expect(firstVehicle).toHaveProperty('name');
      expect(firstVehicle).toHaveProperty('base_fare');
      expect(firstVehicle).toHaveProperty('per_km_rate');
    });
  });
});