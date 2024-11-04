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


//Write your test cases after this Line

describe('Recurring Requests API - Get All Requests', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear previous mocks after each test
    });

    it('should return all recurring requests successfully', async () => {
        const mockData = [
            { recordID: 1, reason: 'Request 1', status: 'Approved' },
            { recordID: 2, reason: 'Request 2', status: 'Pending' }
        ];

        // Mock the database query
        client.query.mockResolvedValueOnce({ rows: mockData });

        const response = await request(app).get('/recurring_requests');
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockData);
    });

    it('should return a 500 status code if a database error occurs', async () => {
        // Mock a database error
        client.query.mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app).get('/recurring_requests');
        
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({
            message: 'Internal server error. Database error'
        });
    });
});

//Do not edit or remove after this line
