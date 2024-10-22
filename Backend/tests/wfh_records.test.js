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

// Helper function: test API responses
const testApiResponse = async (url, expectedStatusCode, expectedBody) => {
  try {
    const response = await request(app).get(url);
    expect(response.statusCode).toBe(expectedStatusCode);
    expect(response.body).toEqual(expectedBody);
  } catch (error) {
    console.error('Error in testApiResponse:', error);
    throw error; // Rethrow the error to allow it to fail the test
  }
};

// Test for Team Schedule (Single Day and Range of Dates)
describe('WFH Records API - Team Schedule', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear any previous mocks after each test
  });

  // Test Case 1: Fetching team schedule for a single day for Yee Lim's team (2024-09-06)
  it('should fetch approved team schedule for a single day for manager Yee Lim (2024-09-06)', async () => {
    const mockData = [
      { staff_id: 140911, staff_fname: 'Minh', staff_lname: 'Ly', dept: 'Sales', wfh_date: '2024-09-06', timeslot: null, schedule_status: 'In Office' },
      { staff_id: 140912, staff_fname: 'Chandara', staff_lname: 'Kim', dept: 'Sales', wfh_date: '2024-09-06', timeslot: null, schedule_status: 'In Office' },
      { staff_id: 140917, staff_fname: 'Heng', staff_lname: 'Phan', dept: 'Sales', wfh_date: '2024-09-06', timeslot: null, schedule_status: 'In Office' },
      { staff_id: 140918, staff_fname: 'Nara', staff_lname: 'Khun', dept: 'Sales', wfh_date: '2024-09-06', timeslot: null, schedule_status: 'PM Leave' },
      { staff_id: 140919, staff_fname: 'Priya', staff_lname: 'Malik', dept: 'Sales', wfh_date: '2024-09-06', timeslot: null, schedule_status: 'In Office' }
    ];

    // Mock the response for fetching WFH records for Yee Lim and their subordinates
    client.query.mockResolvedValueOnce({ rows: mockData, rowCount: mockData.length });

    // Test API response
    await testApiResponse('/wfh_records/team-schedule/140944/2024-09-06', 200, {
      total_team_members: mockData.length,
      team_schedule: {
        '2024-09-06': mockData
      }
    });
  });

  // Test Case 2: Fetching team schedule for a range of dates for Yee Lim's team (2024-09-04 to 2024-09-06)
  it('should fetch approved team schedule for a range of dates for manager Yee Lim (2024-09-04 to 2024-09-06)', async () => {
    const mockData = {
      '2024-09-04': [
        { staff_id: 140001, staff_fname: 'Minh', staff_lname: 'Ly', dept: 'Sales', wfh_date: '2024-09-04', timeslot: 'FD', status: 'Approved' },
        { staff_id: 140002, staff_fname: 'Chandara', staff_lname: 'Kim', dept: 'Sales', wfh_date: '2024-09-04', timeslot: 'AM', status: 'Approved' }
      ],
      '2024-09-05': [
        { staff_id: 140003, staff_fname: 'Heng', staff_lname: 'Phan', dept: 'Sales', wfh_date: '2024-09-05', timeslot: 'FD', status: 'Approved' },
        { staff_id: 140004, staff_fname: 'Nara', staff_lname: 'Khun', dept: 'Sales', wfh_date: '2024-09-05', timeslot: 'PM', status: 'Approved' }
      ],
      '2024-09-06': [
        { staff_id: 140001, staff_fname: 'Minh', staff_lname: 'Ly', dept: 'Sales', wfh_date: '2024-09-06', timeslot: 'FD', status: 'Approved' },
        { staff_id: 140004, staff_fname: 'Nara', staff_lname: 'Khun', dept: 'Sales', wfh_date: null, schedule_status: 'PM Leave' }
      ]
    };

    // Mock the response for fetching WFH records for the date range
    client.query.mockResolvedValueOnce({ rows: [].concat(...Object.values(mockData)), rowCount: 14 });

    // Test API response
    await testApiResponse('/wfh_records/team-schedule/140944/2024-09-04/2024-09-06', 200, {
      total_team_members: 14,
      team_schedule: mockData
    });
  });

  // Test Case 3: No team members found for the given manager and date range
  it('should return an empty array if no team members found for the given manager and date range', async () => {
    // Mock the database response
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    // Test API response
    await testApiResponse('/wfh_records/team-schedule/140944/2024-09-04/2024-09-06', 200, {
      total_team_members: 0,
      team_schedule: {}
    });
  });

  // Test Case 4: Error Handling for Database Failure
  it('should return a 500 status code if a database error occurs', async () => {
    // Mock a database error
    client.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get('/wfh_records/team-schedule/140944/2024-09-06');
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      message: 'Internal server error. Database error'
    });
  });
});

// Test for Subordinate Team Member Retrieval
describe('WFH Records API - Subordinate Team Retrieval', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear any previous mocks after each test
  });

  // Test Case 5: Ensure all subordinates of manager Yee Lim are returned
  it('should return all subordinates of manager Yee Lim', async () => {
    const mockData = [
      { staff_id: 140911, staff_fname: 'Minh', staff_lname: 'Ly', dept: 'Sales', wfh_date: '2024-09-06', schedule_status: 'In Office' },
      { staff_id: 140912, staff_fname: 'Chandara', staff_lname: 'Kim', dept: 'Sales', wfh_date: '2024-09-06', schedule_status: 'In Office' },
      { staff_id: 140917, staff_fname: 'Heng', staff_lname: 'Phan', dept: 'Sales', wfh_date: '2024-09-06', schedule_status: 'In Office' },
      { staff_id: 140918, staff_fname: 'Nara', staff_lname: 'Khun', dept: 'Sales', wfh_date: null, schedule_status: 'PM Leave' }
    ];

    client.query.mockResolvedValueOnce({ rows: mockData });

    // Test API response for the subordinates
    await testApiResponse('/wfh_records/team-schedule/140944/2024-09-06', 200, {
      total_team_members: mockData.length,
      team_schedule: {
        '2024-09-06': mockData // Ensure mockData is used here
      }
    });
  });
});


// ----------- Department Schedule API Tests ------------ // 

// Test for Department Schedule (Single Day and Range of Dates)
describe('WFH Records API - Department Schedule', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear any previous mocks after each test
  });

  // Test Case 1: Fetching staff schedule for a single day for a single department (Sales)
  it('should fetch approved staff schedule for a single day for the Sales department', async () => {
    const mockData = [
      { staff_id: 140001, staff_fname: 'Minh', staff_lname: 'Ly', dept: 'Sales', wfh_date: '2024-09-06', timeslot: 'FD', status: 'Approved' },
      { staff_id: 140002, staff_fname: 'Chandara', staff_lname: 'Kim', dept: 'Sales', wfh_date: '2024-09-06', timeslot: 'AM', status: 'Approved' }
    ];

    // Mock the response for fetching WFH records for the Sales department
    client.query.mockResolvedValueOnce({ rows: mockData, rowCount: mockData.length });

    // Test API response
    await testApiResponse('/wfh_records/schedule/Sales/2024-09-06/2024-09-06', 200, {
      total_staff: mockData.length,
      staff_schedules: {
        '2024-09-06': mockData
      }
    });
  });

  // Test Case 2: Fetching staff schedule for a range of dates for multiple departments (Sales, CEO)
  it('should fetch approved staff schedule for a range of dates for the Sales and CEO departments', async () => {
    const mockData = {
      '2024-09-04': [
        { staff_id: 140001, staff_fname: 'Minh', staff_lname: 'Ly', dept: 'Sales', wfh_date: '2024-09-04', timeslot: 'FD', status: 'Approved' },
        { staff_id: 150001, staff_fname: 'John', staff_lname: 'Smith', dept: 'CEO', wfh_date: '2024-09-04', timeslot: 'AM', status: 'Approved' }
      ],
      '2024-09-05': [
        { staff_id: 140002, staff_fname: 'Chandara', staff_lname: 'Kim', dept: 'Sales', wfh_date: '2024-09-05', timeslot: 'FD', status: 'Approved' },
        { staff_id: 150002, staff_fname: 'Jane', staff_lname: 'Doe', dept: 'CEO', wfh_date: '2024-09-05', timeslot: 'PM', status: 'Approved' }
      ]
    };

    // Mock the response for fetching WFH records for the date range and multiple departments
    client.query.mockResolvedValueOnce({ rows: [].concat(...Object.values(mockData)), rowCount: 4 });

    // Test API response
    await testApiResponse('/wfh_records/schedule/Sales,CEO/2024-09-04/2024-09-05', 200, {
      total_staff: 4,
      staff_schedules: mockData
    });
  });

  // Test Case 3: No staff members found for the given departments and date range
  it('should return an empty array if no staff members found in the given departments and date range', async () => {
    // Mock the database response
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    // Test API response
    await testApiResponse('/wfh_records/schedule/Sales,HR/2024-09-15/2024-09-16', 200, {
      total_staff: 0,
      staff_schedules: {}
    });
  });

  // Test Case 4: Error Handling for Database Failure
  it('should return a 500 status code if a database error occurs', async () => {
    // Mock a database error
    client.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get('/wfh_records/schedule/Sales/2024-09-16');
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      message: 'Internal server error. Database error'
    });
  });
});
