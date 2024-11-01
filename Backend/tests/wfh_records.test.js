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

// New Code //

// Retrieve WFH Records by Staff ID
describe('GET /wfh_records/:staffid', () => {
  it('should handle non-existent staff ID gracefully', async () => {
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Mock no records found

    const response = await request(app).get('/wfh_records/999999');
    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ message: 'No approved or pending WFH requests found for this employee.' });
  });

  // Further tests for unapproved records can be added here if necessary
});

// Team Schedule
describe('GET /wfh_records/team-schedule/:manager_id/:start_date/:end_date', () => {
  it('should return an error for incorrect date format', async () => {
    const response = await request(app).get('/wfh_records/team-schedule/140944/2024-13-01/2024-09-06');
    expect(response.statusCode).toBe(400);  // Assuming 400 for validation errors
    expect(response.body.message).toContain('Invalid date format');
  });

  it('should handle if manager has no subordinates', async () => {
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    
    const response = await request(app).get('/wfh_records/team-schedule/140955/2024-09-04/2024-09-06');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      total_team_members: 0,
      team_schedule: {
        '2024-09-04': [],
        '2024-09-05': [],
        '2024-09-06': []
      }
    });
  });
});

// Department Schedule
describe('GET /wfh_records/schedule/:departments/:start_date/:end_date', () => {
  it('should return an error for non-existent department', async () => {
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    
    const response = await request(app).get('/wfh_records/schedule/NonExistentDept/2024-09-04/2024-09-06');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      total_staff: 0,
      staff_schedules: {}
    });
  });

  it('should handle multiple departments with mixed WFH statuses', async () => {
    const mockData = {
      '2024-09-04': [
        { staff_id: 140003, staff_fname: 'John', staff_lname: 'Doe', dept: 'Sales', wfh_date: '2024-09-04', timeslot: 'FD', status: 'Approved' },
        { staff_id: 140004, staff_fname: 'Jane', staff_lname: 'Doe', dept: 'HR', wfh_date: null, schedule_status: 'Office' }
      ]
    };

    client.query.mockResolvedValueOnce({ rows: [].concat(...Object.values(mockData)), rowCount: 2 });

    const response = await request(app).get('/wfh_records/schedule/Sales,HR/2024-09-04/2024-09-05');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      total_staff: 2,
      staff_schedules: mockData
    });
  });
});

// WFH Ad-Hoc Request
describe('POST /wfh_records/wfh_adhoc_request', () => {
  it('should prevent duplicate WFH requests for the same date', async () => {
    client.query.mockResolvedValueOnce({ rows: [1], rowCount: 1 }); // Mock existing request

    const response = await request(app)
      .post('/wfh_records/wfh_adhoc_request')
      .send({
        staff_id: 140911,
        req_date: "2024-01-01",
        sched_date: "2024-09-06",
        timeSlot: 'FD',
        reason: 'Personal work'
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('A WFH request for this date already exists');
  });
});

// Withdrawal Requests
describe('POST /wfh_records/withdraw_wfh', () => {
  it('should not allow withdrawal of requests that are already rejected', async () => {
    client.query.mockResolvedValueOnce({ rows: [{ status: 'Rejected' }], rowCount: 1 });

    const response = await request(app)
      .post('/wfh_records/withdraw_wfh')
      .send({ recordID: 123, reason: 'No longer needed', staff_id: 140911 });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('Invalid request status for withdrawal.');
  });

  it('should successfully process a withdrawal for pending requests', async () => {
    client.query.mockResolvedValueOnce({ rows: [{ status: 'Pending' }], rowCount: 1 });
    client.query.mockResolvedValueOnce({ rows: [{ recordid: 123 }], rowCount: 1 }); // Mock update

    const response = await request(app)
      .post('/wfh_records/withdraw_wfh')
      .send({ recordID: 123, reason: 'No longer needed', staff_id: 140911 });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toContain('WFH request withdrawn successfully.');
  });
});

// Approving/Rejecting Requests
describe('PATCH /wfh_records/accept/:recordID', () => {
  it('should successfully approve a WFH request', async () => {
    client.query.mockResolvedValueOnce({ rows: [{ recordid: 101, status: 'Approved' }], rowCount: 1 });

    const response = await request(app).patch('/wfh_records/accept/101');
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Status updated to approved.');
  });

  it('should return an error for non-existent request ID', async () => {
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Mock no record found

    const response = await request(app).patch('/wfh_records/accept/999');
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('No records found for the given record ID.');
  });
});

describe('PATCH /wfh_records/reject/:id', () => {
  it('should correctly reject a WFH request with a reason', async () => {
    client.query.mockResolvedValueOnce({ rows: [{ recordid: 102, status: 'Rejected' }], rowCount: 1 });

    const response = await request(app)
      .patch('/wfh_records/reject/102')
      .send({ reason: 'Not applicable' });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toContain('Rejection reason updated successfully.');
  });
});

// Recurring WFH Requests
describe('POST /wfh_records/withdraw_recurring_request', () => {
  it('should handle withdrawal from a recurring WFH request correctly', async () => {
    client.query.mockResolvedValueOnce({
      rows: [{ wfh_dates: ['2024-09-04', '2024-09-05'], status: 'Pending' }],
      rowCount: 1
    });
    client.query.mockResolvedValueOnce({ rowCount: 1 }); // Mock update for successful date removal

    const response = await request(app)
      .post('/wfh_records/withdraw_recurring_request')
      .send({
        requestId: 500,
        date: '2024-09-04',
        reason: 'Planning changes',
        staff_id: 140911
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toContain('WFH request for the date 2024-09-05 has been withdrawn successfully.');
  });

  it('should return an error if no matches are found for the withdrawal', async () => {
    client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // No records found

    const response = await request(app)
      .post('/wfh_records/withdraw_recurring_request')
      .send({
        requestId: 501,
        date: '2024-09-10',
        reason: 'Not required',
        staff_id: 140911
      });

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toContain('Error withdrawing recurring WFH request');
  });
});
