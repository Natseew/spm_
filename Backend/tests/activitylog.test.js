// activityLog.test.js
const express = require('express');
const request = require('supertest');
const activityLogRouter = require('../routes/activitylog.js'); // Adjust the path to your router file
const client = require('../databasepg'); // Adjust the path to your database client

// Mock the database client
jest.mock('../databasepg');

const app = express();
app.use('/', activityLogRouter);

describe('GET /', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear mock history after each test
    });

    it('should return a list of activity logs with status 200', async () => {
        const mockData = [
            { id: 1, action: 'User login', timestamp: '2023-01-01 00:00:00' },
            { id: 2, action: 'User logout', timestamp: '2023-01-02 00:00:00' },
        ];
        
        // Mock the query response
        client.query.mockResolvedValueOnce({ rows: mockData });

        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockData);
    });

    it('should return a 500 error if there is an error retrieving the logs', async () => {
        const errorMessage = 'Database error';
        
        // Mock the query to throw an error
        client.query.mockRejectedValueOnce(new Error(errorMessage));

        const response = await request(app).get('/');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: 'Internal server error. ' + errorMessage });
    });
});