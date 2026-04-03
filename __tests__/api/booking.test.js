// __tests__/api/booking.test.js
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/book';

describe('Booking API', () => {
  test('returns 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  test('returns 400 for missing required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });
    
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toHaveProperty('error');
  });
});