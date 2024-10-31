
const request = require('supertest');
const express = require('express');
const router = require('../routes/employee.js'); // Adjust the path accordingly
const client = require('../databasepg');

// Create an Express app for testing
const app = express();
app.use(express.json());
app.use('/employees', router);

// Mock the database client
jest.mock('../databasepg');

describe('Employee Routes', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('GET /employees should return all employees', async () => {
        const mockEmployees = [
            { Staff_ID: 1, Staff_FName: 'John', Staff_LName: 'Doe' },
            { Staff_ID: 2, Staff_FName: 'Jane', Staff_LName: 'Smith' }
        ];
        client.query.mockResolvedValueOnce({ rows: mockEmployees });

        const response = await request(app).get('/employees');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockEmployees);
    });

    test('GET /employees/managers should return distinct managers', async () => {
        const mockManagers = [
            { Staff_ID: 1, Staff_FName: 'Alice', Staff_LName: 'Johnson' }
        ];
        client.query.mockResolvedValueOnce({ rows: mockManagers });

        const response = await request(app).get('/employees/managers');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockManagers);
    });

    test('POST /employees/login should return employee details', async () => {
        const mockEmployee = [
            { Staff_ID: 1, Staff_FName: 'John', Staff_LName: 'Doe', email: 'john@example.com' }
        ];
        client.query.mockResolvedValueOnce({ rows: mockEmployee });

        const response = await request(app)
            .post('/employees/login')
            .send({ email: 'john@example.com', password: 'password' });
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockEmployee);
    });

    test('GET /employees/by-manager/:managerId should return employees by manager', async () => {
        const mockEmployees = [
            { Staff_ID: 2, Staff_FName: 'Jane', Staff_LName: 'Smith' }
        ];
        client.query.mockResolvedValueOnce({ rows: mockEmployees });

        const response = await request(app).get('/employees/by-manager/1');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockEmployees);
    });
});