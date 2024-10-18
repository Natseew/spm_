const request = require('supertest');
const express = require('express');
const router = require('../routes/wfh_records'); 
const client = require('../databasepg'); 

const app = express();
app.use(express.json());
app.use('/wfh_records', router);

// Mock the database queries
jest.mock('../databasepg', () => ({
  query: jest.fn(),
}));

// Helper function : test API responses
const testApiResponse = async (url, expectedStatusCode, expectedBody) => {
  const response = await request(app).get(url);
  expect(response.statusCode).toBe(expectedStatusCode);
  expect(response.body).toEqual(expectedBody);
};

// Team Schedule
describe('WFH Records API - Team Schedule', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear any previous mocks after each test
  });

  // Happy path - A normal request for a valid manager_id and date
  it('should fetch approved team schedule by manager_id and date', async () => {
    const mockData = [
      { 
        staff_id: 140001, 
        staff_fname: 'Derek', 
        staff_lname: 'Tan', 
        wfh_date: '2024-09-17', 
        timeslot: 'FD', 
        status: 'Approved' 
      },
      {
        staff_id: 140003,
        staff_fname: 'Rahim',
        staff_lname: 'Khalid',
        wfh_date: '2024-09-17',
        timeslot: 'AM',
        status: 'Approved'
      }
    ];

    // Mock database response
    client.query.mockResolvedValueOnce({ rows: mockData, rowCount: 2 });

    // Test the API response
    await testApiResponse('/wfh_records/team-schedule/140001/2024-09-17', 200, {
      total_team_members: 2,
      staff_schedules: mockData
    });
  });

  // Edge case - No team members found for the manager and date
  it('should return an empty array if no team members found', async () => {
    // Mock database response
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    // Test the API response
    await testApiResponse('/wfh_records/team-schedule/140001/2024-09-18', 200, {
      total_team_members: 0,
      staff_schedules: []
    });
  });

  // Boundary test - Handle a 500 error if the database fails
  it('should return a 500 status code if an error occurs', async () => {
    // Mock database error
    client.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get('/wfh_records/team-schedule/140001/2024-09-17');
    
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      message: 'Internal server error. Database error'
    });
  });
});

// Test suite for Schedule by Departments
describe('WFH Records API - Schedule by Departments', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear any previous mocks after each test
  });

  // Happy path - A normal request for valid departments and date
  it('should fetch staff schedule by departments and date', async () => {
    const mockData = [
      {
        staff_id: 140003,
        staff_fname: 'Rahim',
        staff_lname: 'Khalid',
        dept: 'Sales',
        wfh_date: '2024-09-17',
        timeslot: 'FD',
        status: 'Approved'
      }
    ];

    // Mock database response
    client.query.mockResolvedValueOnce({ rows: mockData, rowCount: 1 });

    // Test the API response
    await testApiResponse('/wfh_records/schedule/Sales,HR/2024-09-17', 200, {
      total_staff: 1,
      staff_schedules: mockData
    });
  });

  // Edge case - No staff members found for the given departments and date
  it('should return an empty array if no staff found in the given departments', async () => {
    // Mock database response
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    // Test the API response
    await testApiResponse('/wfh_records/schedule/Sales,HR/2024-09-18', 200, {
      total_staff: 0,
      staff_schedules: []
    });
  });

  // Boundary test - Handle a 500 error if the database fails
  it('should return a 500 status code if an error occurs', async () => {
    // Mock database error
    client.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get('/wfh_records/schedule/Sales,HR/2024-09-17');
    
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      message: 'Internal server error. Database error'
    });
  });
});
