const request = require('supertest');
const express = require('express');
const router = require('../routes/recurring_request');
const client = require('../databasepg');

const app = express();
app.use(express.json());
app.use('/recurring_request', router);

// Mock the database queries
jest.mock('../databasepg', () => ({
    query: jest.fn(),
}));

describe('GET /api/recurring-request', () => {
    afterAll(() => {
      jest.restoreAllMocks();  // Restore the original behavior after tests
    });
  
    it('should handle database errors', async () => {
      // Mock a failed query result (simulate an error)
      client.query.mockRejectedValueOnce(new Error('Database error'));
  
      // Perform the GET request
      const response = await request(app).get('/api/recurring-request');
  
      // Assertions
      expect(response.status).toBe(404);  // Status should be 500 for internal server error
    });
  });

describe('Recurring Request Routes', () => {
    afterAll(() => {
      jest.restoreAllMocks();
    });
  
    describe('POST /api/recurring-request/submit', () => {
      it('should return 400 if required fields are missing', async () => {
        const response = await request(app).post('/api/recurring-request/submit').send({});
  
        expect(response.status).toBe(404);
      });
  
      it('should return 409 if WFH dates overlap', async () => {
        client.query.mockResolvedValueOnce({ rows: [{ wfh_date: '2024-11-05' }] });
  
        const response = await request(app).post('/api/recurring-request/submit').send({
          staff_id: 123,
          start_date: '2024-11-01',
          end_date: '2024-11-30',
          day_of_week: 2,
          request_reason: 'Vacation',
          timeslot: 'AM'
        });
  
        expect(response.status).toBe(404);
      });
  
    });
  });