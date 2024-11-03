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

// Test 1: Test for Team Schedule (Single Day and Range of Dates)
describe('WFH Ad Hoc Records API', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear any previous mocks after each test
  });

//////////////////////////////////
// Test Case 1:Testing for ("/")//
//////////////////////////////////
  it('should return all WFH records successfully', async () => {
    const mockData = [
        { staff_id: 1, wfh_date: '2024-09-01', status: 'Approved' },
        { staff_id: 2, wfh_date: '2024-09-02', status: 'Pending' }
    ];

    client.query.mockResolvedValueOnce({ rows: mockData });

    const response = await request(app).get('/wfh_records');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockData);
});

it('should return a 500 status code on database error', async () => {
    client.query.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get('/wfh_records');
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
        message: 'Internal server error. Database error'
    });
});

///////////////////////////////////////////////////////////////////////////////
// Test Case 2: Test for approved WFH Record from specific employee ("/:staffid") //
///////////////////////////////////////////////////////////////////////////////
it('should return approved WFH records for a specific employee', async () => {
  const staffId = 1;
  const mockData = [
      { staffid: staffId, wfh_date: '2024-09-01', status: 'Approved' },
      { staffid: staffId, wfh_date: '2024-09-02', status: 'Approved' }
  ];

  // Mock the response for fetching WFH records for the specified staff ID
  client.query.mockResolvedValueOnce({ rows: mockData });

  const response = await request(app).get(`/wfh_records/${staffId}`);
  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual(mockData);
});

it('should return an empty array if no approved records are found for the specified employee', async () => {
  const staffId = 1;

  // Mock the response for no records found
  client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

  const response = await request(app).get(`/wfh_records/${staffId}`);
  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual([]); // Ensure response is an empty array
});

it('should return a 500 status code if a database error occurs', async () => {
  const staffId = 1;

  // Mock the database error
  client.query.mockRejectedValueOnce(new Error('Database error'));

  const response = await request(app).get(`/wfh_records/${staffId}`);
  expect(response.statusCode).toBe(500);
  expect(response.body).toEqual({
      message: 'Internal server error. Database error'
  });
});
/////////////////////////////////////////////////////////////////////
// Test 3: Getting all approved and pending request of an Employee //
/////////////////////////////////////////////////////////////////////
it('should return approved and pending WFH requests for a specific employee', async () => {
  const staffId = 1;
  const mockData = [
      { staffid: staffId, wfh_date: '2024-09-01', status: 'Approved' },
      { staffid: staffId, wfh_date: '2024-09-02', status: 'Pending' }
  ];

  // Mock the response for fetching WFH requests for the specified staff ID
  client.query.mockResolvedValueOnce({ rows: mockData });

  const response = await request(app).get(`/wfh_records/approved&pending_wfh_requests/${staffId}`);
  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual(mockData);
});

it('should return a 404 status code if no approved or pending requests are found', async () => {
  const staffId = 1;

  // Mock the response for no records found
  client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

  const response = await request(app).get(`/wfh_records/approved&pending_wfh_requests/${staffId}`);
  expect(response.statusCode).toBe(404);
  expect(response.body).toEqual({ message: 'No approved or pending WFH requests found for this employee.' });
});

it('should return a 500 status code if a database error occurs', async () => {
  const staffId = 1;

  // Mock the database error
  client.query.mockRejectedValueOnce(new Error('Database error'));

  const response = await request(app).get(`/wfh_records/approved&pending_wfh_requests/${staffId}`);
  expect(response.statusCode).toBe(500);
  expect(response.body).toEqual({
      message: 'Internal server error.' // Change this line 
  });
});

//////////////////////////////////////////
//Test 4: Withdrawing an Ad Hoc Request //
//////////////////////////////////////////

// it('should successfully withdraw a WFH request', async () => {
//   const recordID = 1;
//   const reason = 'Personal change';
//   const staff_id = 14234;

//   // Mocking the current status to allow withdrawal
//   client.query
//       .mockResolvedValueOnce({ rows: [{ status: 'Approved' }] }) // Mock response for status check
//       .mockResolvedValueOnce({ rows: [{ recordID }] }); // Mock response for successful record update

//   const response = await request(app)
//       .post('/wfh_records/withdraw_adhoc_wfh')
//       .send({ recordID, reason, staff_id });

//   expect(response.statusCode).toBe(200);
//   expect(response.body).toEqual({ message: 'Withdrawal has been submitted to Reporting Manager for approval.' });
// });

// it('should return a 400 status code for invalid request status for withdrawal', async () => {
//   const recordID = 1;
//   const reason = 'Personal change';
//   const staff_id = 14234;

//   // Mocking an invalid status to simulate a failed withdrawal
//   client.query.mockResolvedValueOnce({ rows: [{ status: 'Rejected' }] }); // Invalid status

//   const response = await request(app)
//       .post('/wfh_records/withdraw_adhoc_wfh')
//       .send({ recordID, reason, staff_id });

//   expect(response.statusCode).toBe(400);
//   expect(response.body).toEqual({ message: 'Invalid request status for withdrawal.' });
// });

// it('should return a 404 status code if the WFH request is not found', async () => {
//   const recordID = 1;
//   const reason = 'Personal change';
//   const staff_id = 14234;

//   // Mocking the status check to say it exists but fails on withdrawal
//   client.query
//       .mockResolvedValueOnce({ rows: [{ status: 'Pending' }] }) // Found the request with Pending status
//       .mockResolvedValueOnce({ rows: [] }); // No record updated, emulating the record not being found

//   const response = await request(app)
//       .post('/wfh_records/withdraw_adhoc_wfh')
//       .send({ recordID, reason, staff_id });

//   expect(response.statusCode).toBe(404);
//   expect(response.body).toEqual({ message: 'WFH request not found or already withdrawn.' });
// });

// it('should return a 500 status code if a database error occurs', async () => {
//   const recordID = 1;
//   const reason = 'Personal change';
//   const staff_id = 14234;

//   // Simulate a database error on the first query
//   client.query.mockRejectedValueOnce(new Error('Database error'));


// });
/////////////////////////////////
// Test 5: Get Employee by ID //
/////////////////////////////////
it('should return WFH records for valid employee IDs', async () => {
  const mockEmployeeIds = [1, 2, 3];
  const mockData = [
      { staffid: 1, wfh_date: '2024-09-01', status: 'Approved' },
      { staffid: 2, wfh_date: '2024-09-02', status: 'Pending' }
  ];

  // Mock the database response
  client.query.mockResolvedValueOnce({ rows: mockData });

  const response = await request(app)
      .post('/wfh_records/by-employee-ids')
      .send({ employeeIds: mockEmployeeIds });

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual(mockData);
});

it('should return a 400 status code for invalid input', async () => {
  const response = await request(app)
      .post('/wfh_records/by-employee-ids')
      .send({ employeeIds: '' }); // Sending invalid input

  expect(response.statusCode).toBe(400);
  expect(response.body).toEqual({ message: 'Invalid input. Must provide an array of employee IDs.' });
});

it('should return a 400 status code for an empty array', async () => {
  const response = await request(app)
      .post('/wfh_records/by-employee-ids')
      .send({ employeeIds: [] }); // Sending an empty array

  expect(response.statusCode).toBe(400);
  expect(response.body).toEqual({ message: 'Invalid input. Must provide an array of employee IDs.' });
});

it('should return a 500 status code if a database error occurs', async () => {
  const mockEmployeeIds = [1, 2];
  
  client.query.mockRejectedValueOnce(new Error('Database error')); // Mock a database error

  const response = await request(app)
      .post('/wfh_records/by-employee-ids')
      .send({ employeeIds: mockEmployeeIds });

  expect(response.statusCode).toBe(500);
  expect(response.body).toEqual({
      message: 'Internal server error. Database error'
  });
});
/////////////////////////////////////////////
// Test case 6: Test Accepting WFH Request //
/////////////////////////////////////////////
it('should successfully approve a WFH request', async () => {
  const recordID = 1; 
  
  // Mock the update query response
  client.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ recordid: recordID, status: 'Approved' }] });

  const response = await request(app).patch(`/wfh_records/accept/${recordID}`);
  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({ message: 'Status updated to approved.', record: { recordid: recordID, status: 'Approved' } });
});

it('should return a 404 status code if no records are found for the given ID', async () => {
  const recordID = 999; // Using a record ID that doesn't exist.

  // Mock the update query response for a non-existent record
  client.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

  const response = await request(app).patch(`/wfh_records/accept/${recordID}`);
  expect(response.statusCode).toBe(404);
  expect(response.body).toEqual({ message: 'No records found for the given record ID.' });
});

it('should return a 500 status code if a database error occurs', async () => {
  const recordID = 1;

  // Mock a database error
  client.query.mockRejectedValueOnce(new Error('Database error'));

  const response = await request(app).patch(`/wfh_records/accept/${recordID}`);
  expect(response.statusCode).toBe(500);
  expect(response.body).toEqual({
      message: 'Internal server error. Database error'
  });
});

/////////////////////////////////////////////
// Test Case 7: Test Rejecting WFH Request //
/////////////////////////////////////////////
it('should successfully reject a WFH request with a reason', async () => {
  const id = 1; 
  const reason = 'Not needed anymore';

  // Mock the responses for the query calls
  client.query
      // .mockResolvedValueOnce({ rows: [{ recordid: id, status: 'Pending' }] }) // For SELECT: simulate existing pending record
      .mockResolvedValueOnce({ rows: [{ recordid: id, status: 'Rejected', reject_reason: reason }] }); // For UPDATE: simulate successful update

  const response = await request(app)
      .patch(`/wfh_records/reject/${id}`)
      .send({ reason });

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({
      message: 'Rejection reason updated successfully.',
      record: { recordid: id, status: 'Rejected', reject_reason: reason } // Ensure proper body response matches
  });
});

// Its because the thing Patch, should not have a 404...

// it('should return a 404 status code if no records are found for the given ID', async () => {
//   const id = 999; // Using a non-existing ID
//   const reason = 'Not applicable';

//   // Mocking the SELECT query to indicate no records found
//   client.query
//       .mockResolvedValueOnce({ rows: [] }); // No records found for the SELECT ID

//   const response = await request(app)
//       .patch(`/wfh_records/reject/${id}`)
//       .send({ reason });

//   expect(response.statusCode).toBe(404);
//   expect(response.body).toEqual({ message: 'No records found for the given record ID.' });
// });

it('should return a 500 status code if a database error occurs', async () => {
  const id = 1;
  const reason = 'Not needed anymore';

  // Simulate a database error during the SELECT query
  client.query.mockRejectedValueOnce(new Error('Database error')); // Mock the error for the SELECT call

  const response = await request(app)
      .patch(`/wfh_records/reject/${id}`)
      .send({ reason });

  expect(response.statusCode).toBe(500);
  expect(response.body).toEqual({
      message: 'Internal server error. Database error' // Check the error message structure
  });
});

/////////////////////////////////////////////////////
// Test Case 8: Test Accept Withdrawal WFH Request //
/////////////////////////////////////////////////////
it('should successfully update the status to Withdrawn', async () => {
  const recordID = 1;

  // Mock the response for a successful update
  client.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ recordid: recordID, status: 'Withdrawn' }] });

  const response = await request(app)
      .patch(`/wfh_records/acceptwithdrawal/${recordID}`);

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({ message: 'Status updated to Withdrawn.', record: { recordid: recordID, status: 'Withdrawn' } });
});

it('should return a 404 status code if no records are found for the given ID', async () => {
  const recordID = 999; // Using a non-existing ID

  // Simulate finding no records for the update
  client.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); 

  const response = await request(app)
      .patch(`/wfh_records/acceptwithdrawal/${recordID}`);

  expect(response.statusCode).toBe(404);
  expect(response.body).toEqual({ message: 'No records found for the given record ID.' });
});

it('should return a 500 status code if a database error occurs', async () => {
  const recordID = 1;

  // Simulate a database error during the update
  client.query.mockRejectedValueOnce(new Error('Database error'));

  const response = await request(app)
      .patch(`/wfh_records/acceptwithdrawal/${recordID}`);

  expect(response.statusCode).toBe(500);
  expect(response.body).toEqual({
      message: 'Internal server error. Database error'
  });
});

/////////////////////////////////////////////////////
// Test Case 9: Test Cancel Approved WFH Request //
/////////////////////////////////////////////////////
it('should successfully cancel (reject) a WFH request', async () => {
  const recordID = 1;

  // Mocking the response to simulate a successful update
  client.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ recordid: recordID, status: 'Rejected' }] });

  const response = await request(app)
      .patch(`/wfh_records/cancel/${recordID}`);

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({ message: 'Status updated to Rejected.', record: { recordid: recordID, status: 'Rejected' } });
});

it('should return a 404 status code if no records are found for the given ID', async () => {
  const recordID = 999; // Using a non-existing ID

  // Mock the UPDATE query to simulate no records found
  client.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

  const response = await request(app)
      .patch(`/wfh_records/cancel/${recordID}`);

  expect(response.statusCode).toBe(404);
  expect(response.body).toEqual({ message: 'No records found for the given record ID.' });
});

it('should return a 500 status code if a database error occurs', async () => {
  const recordID = 1;

  // Simulate a database error during the update
  client.query.mockRejectedValueOnce(new Error('Database error')); // Mock the error for the query

  const response = await request(app)
      .patch(`/wfh_records/cancel/${recordID}`);

  expect(response.statusCode).toBe(500);
  expect(response.body).toEqual({
      message: 'Internal server error. Database error'
  });
});
});

/////////////////////////////////////////////////////
// Test Case 10: Test Reject Withdrawal WFH Request //
/////////////////////////////////////////////////////
it('should successfully approve a WFH request that was in pending withdrawal', async () => {
  const recordID = 1;
  const reason = 'Reason for approval';

  // Mocking the response for successful update
  client.query.mockResolvedValueOnce({ 
      rowCount: 1, 
      rows: [{ recordid: recordID, status: 'Approved', reject_reason: reason }]
  });

  const response = await request(app)
      .patch(`/wfh_records/reject_withdrawal/${recordID}`)
      .send({ reason });

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({ 
      message: 'Status updated to Approved.', 
      record: { recordid: recordID, status: 'Approved', reject_reason: reason }
  });
});

it('should return a 404 status code if no records are found for the given ID', async () => {
  const recordID = 999; // Using a non-existing ID
  const reason = 'Not applicable';

  // Mocking the response for a non-existing record
  client.query.mockResolvedValueOnce({ 
      rowCount: 0, 
      rows: [] 
  });

  const response = await request(app)
      .patch(`/wfh_records/reject_withdrawal/${recordID}`)
      .send({ reason });

  expect(response.statusCode).toBe(404);
  expect(response.body).toEqual({ message: 'No records found for the given record ID.' });
});

it('should return a 500 status code if a database error occurs', async () => {
  const recordID = 1;
  const reason = 'Database error';

  // Mocking a database error
  client.query.mockRejectedValueOnce(new Error('Database error'));

  const response = await request(app)
      .patch(`/wfh_records/reject_withdrawal/${recordID}`)
      .send({ reason });

  expect(response.statusCode).toBe(500);
  expect(response.body).toEqual({
      message: 'Internal server error.',
      error: 'Database error' // Ensure we capture the error message correctly
  });


//////////////////////////////////////////////////////
// Test Case 11: Test Changing of AdHoc WFH Request //
//////////////////////////////////////////////////////

// it('should successfully change a WFH request', async () => {
//   const recordID = 1;
//   const new_wfh_date = '2024-09-10';
//   const reason = 'Change of plan';
//   const staff_id = 14234;

//   // Mock the responses for status check and update query
//   client.query
//       .mockResolvedValueOnce({ rows: [{ status: 'Pending', wfh_date: '2024-09-01' }] }) // Mock for SELECT
//       .mockResolvedValueOnce({ rows: [{ recordID, status: 'Pending', wfh_date: new_wfh_date }] }); // Mock for UPDATE

//   const response = await request(app)
//       .post('/wfh_records/change_adhoc_wfh')
//       .send({ recordID, new_wfh_date, reason, staff_id });

//   expect(response.statusCode).toBe(200);
//   expect(response.body).toEqual({ message: 'WFH date changed successfully.' });
// });

// it('should return a 404 status code if no WFH record was found', async () => {
//   const recordID = 999; // Using a non-existing ID
//   const new_wfh_date = '2024-09-10';
//   const reason = 'Change of plan';
//   const staff_id = 14234;

//   // Mock the SELECT to simulate no records found
//   client.query.mockResolvedValueOnce({ rows: [] }); // No record for this ID

//   const response = await request(app)
//       .post('/wfh_records/change_adhoc_wfh')
//       .send({ recordID, new_wfh_date, reason, staff_id });

//   expect(response.statusCode).toBe(404);
//   expect(response.body).toEqual({ message: 'WFH request not found.' });
// });

// it('should return a 400 status code for invalid request status', async () => {
//   const recordID = 1;
//   const new_wfh_date = '2024-09-10'; // Valid date format
//   const reason = 'Change of plan';
//   const staff_id = 14234;

//   // Mock the response to simulate an invalid status of the WFH record
//   client.query.mockResolvedValueOnce({ rows: [{ status: 'Rejected', wfh_date: '2024-09-01' }] }); // Invalid status

//   const response = await request(app)
//       .post('/wfh_records/change_adhoc_wfh')
//       .send({ recordID, new_wfh_date, reason, staff_id });

//   expect(response.statusCode).toBe(400);
//   expect(response.body).toEqual({ message: 'Invalid request status for change.' });
// });

// it('should return a 400 status code for invalid new WFH date', async () => {
//   const recordID = 1;
//   const new_wfh_date = 'invalid-date'; // Invalid date format
//   const reason = 'Change of plan';
//   const staff_id = 14234;

//   // Mock the response to simulate an existing record
//   client.query.mockResolvedValueOnce({ rows: [{ status: 'Pending', wfh_date: '2024-09-01' }] }); // Valid status to allow the change

//   const response = await request(app)
//       .post('/wfh_records/change_adhoc_wfh')
//       .send({ recordID, new_wfh_date, reason, staff_id });

//   expect(response.statusCode).toBe(400);
//   expect(response.body).toEqual({ message: 'Invalid new WFH date provided. Use format YYYY-MM-DD.' });

// });

// it('should return a 500 status code if a database error occurs', async () => {
//   const recordID = 1;
//   const new_wfh_date = '2024-09-10'; // Valid date
//   const reason = 'Change of plan';
//   const staff_id = 14234;

//   // Mock the SELECT to find the existing record
//   client.query.mockResolvedValueOnce({ rows: [{ status: 'Pending', wfh_date: '2024-09-01' }] }); // Valid status check

//   // Simulate a database error during the update operation
//   client.query.mockRejectedValueOnce(new Error('Database error')); // Mocking error for the UPDATE call

//   const response = await request(app)
//       .post('/wfh_records/change_adhoc_wfh')
//       .send({ recordID, new_wfh_date, reason, staff_id });

//   expect(response.statusCode).toBe(500);
//   expect(response.body).toEqual({
//       message: 'Internal server error.'
//   });
// });

});


//////////////////////////////////////////////////////////////////////////////////////////////////
// Test Case 12: Test Get WFH Request with Status : "Pending, Pending Withdrawal, Pending Change//
//////////////////////////////////////////////////////////////////////////////////////////////////

it('should return approved and pending WFH requests for a specific employee', async () => {
  const staffId = 1; // Test with a specific staff ID
  const mockData = [
      { staffid: staffId, wfh_date: '2024-08-01', status: 'Approved' },
      { staffid: staffId, wfh_date: '2024-08-02', status: 'Pending' },
  ];

  // Mock the database response
  client.query.mockResolvedValueOnce({ rows: mockData });

  const response = await request(app).get(`/wfh_records/approved&pending_wfh_requests/${staffId}`);
  
  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual(mockData);
});

it('should return a 404 status code if no approved or pending requests are found', async () => {
  const staffId = 999; // Test with a non-existing staff ID

  // Mock the response for no records found
  client.query.mockResolvedValueOnce({ rows: [] });

  const response = await request(app).get(`/wfh_records/approved&pending_wfh_requests/${staffId}`);
  
  expect(response.statusCode).toBe(404);
  expect(response.body).toEqual({ message: 'No approved or pending WFH requests found for this employee.' });


it('should return a 500 status code if a database error occurs', async () => {
  const staffId = 1; // Test with a valid staff ID

  // Mock a database error
  client.query.mockRejectedValueOnce(new Error('Database error'));

  const response = await request(app).get(`/wfh_records/approved&pending_wfh_requests/${staffId}`);
  
  expect(response.statusCode).toBe(500);
  expect(response.body).toEqual({ message: 'Internal server error.' });


});
////////////////////////////////////////////////
// Test Case 13: Test Post a WFH Adhoc Request//
////////////////////////////////////////////////

// it('should successfully submit a WFH ad-hoc request', async () => {
//   const staff_id = 1;
//   const req_date = '2024-09-01';
//   const sched_date = '2024-09-01';
//   const timeSlot = 'FD';
//   const reason = 'Personal reasons';

//   // Mocking the queries
//   client.query
//       .mockResolvedValueOnce({ rows: [] }) // No existing request
//       .mockResolvedValueOnce({ rows: [{ reporting_manager: 2 }] }) // Valid manager found
//       .mockResolvedValueOnce({ rows: [{ total_team: 5 }] }) // Total team count
//       .mockResolvedValueOnce({ rows: [{ team_wfh: 2 }] }) // Current WFH approvals
//       .mockResolvedValueOnce({ rows: [{ recordid: 1 }] }) // Inserted record ID
//       .mockResolvedValueOnce({}); // Insert to ActivityLog

//   const response = await request(app)
//       .post('/wfh_records/wfh_adhoc_request')
//       .send({ staff_id, req_date, sched_date, timeSlot, reason });

//   expect(response.statusCode).toBe(201);
//   expect(response.body).toEqual({ message: 'WFH request submitted successfully', recordID: 1 });
// });

// it('should return a 400 status code for missing required fields', async () => {
//   const response = await request(app)
//       .post('/wfh_records/wfh_adhoc_request')
//       .send({ staff_id: 1 }); // Missing required fields

//   expect(response.statusCode).toBe(400);
//   expect(response.body).toEqual({ message: 'Missing required fields.' });
// });

// it('should return a 400 status code if a request for the same date already exists', async () => {
//   const staff_id = 1;
//   const req_date = '2024-09-01';
//   const sched_date = '2024-09-01';
//   const timeSlot = 'FD';
//   const reason = 'Personal reasons';

//   // Mock existing WFH request
//   client.query
//       .mockResolvedValueOnce({ rows: [{ staffid: staff_id, wfh_date: sched_date, status: 'Pending' }] }); // Existing request found

//   const response = await request(app)
//       .post('/wfh_records/wfh_adhoc_request')
//       .send({ staff_id, req_date, sched_date, timeSlot, reason });

//   expect(response.statusCode).toBe(400);
//   expect(response.body).toEqual({ message: 'A WFH request for this date already exists and is either pending or approved.' });
// });

// it('should return a 404 status code if the staff ID is not found', async () => {
//   const staff_id = 999; // Non-existent staff ID
//   const req_date = '2024-09-01';
//   const sched_date = '2024-09-01';
//   const timeSlot = 'FD';
//   const reason = 'Personal reasons';

//   // Mock response for staff ID not found
//   client.query
//       .mockResolvedValueOnce({ rows: [] }) // No existing requests
//       .mockResolvedValueOnce({ rows: [] }); // No staff ID found for manager

//   const response = await request(app)
//       .post('/wfh_records/wfh_adhoc_request')
//       .send({ staff_id, req_date, sched_date, timeSlot, reason });

//   expect(response.statusCode).toBe(404);
//   expect(response.body).toEqual({ message: 'Staff ID not found.' });
// });

// it('should return a 403 status code if approving this request would cause more than 50% of the team to be WFH', async () => {
//     const staff_id = 1;
//     const req_date = '2024-09-01';
//     const sched_date = '2024-09-01';
//     const timeSlot = 'FD';
//     const reason = 'Personal reasons';

//     // Mocking the necessary queries
//     client.query
//         .mockResolvedValueOnce({ rows: [] }) // No existing request for the staff ID
//         .mockResolvedValueOnce({ rows: [{ reporting_manager: 2 }] }) // Valid manager found
//         .mockResolvedValueOnce({ rows: [{ total_team: 5 }] }) // Total team count
//         .mockResolvedValueOnce({ rows: [{ team_wfh: 3 }] }); // Exceeding WFH limits

//     const response = await request(app)
//         .post('/wfh_records/wfh_adhoc_request')
//         .send({ staff_id, req_date, sched_date, timeSlot, reason });

//     expect(response.statusCode).toBe(403);
//     expect(response.body).toEqual({ message: 'WFH request denied. More than 50% of the team would be WFH on this date.' });
// });

// it('should return a 500 status code if a database error occurs', async () => {
//     const staff_id = 1;
//     const req_date = '2024-09-01';
//     const sched_date = '2024-09-01';
//     const timeSlot = 'FD';
//     const reason = 'Personal reasons';

//     // Simulate a database error during one of the queries
//     client.query.mockRejectedValueOnce(new Error('Database error')); // Mocking a database error.

//     const response = await request(app)
//         .post('/wfh_records/wfh_adhoc_request')
//         .send({ staff_id, req_date, sched_date, timeSlot, reason });

//     expect(response.statusCode).toBe(500);
//     expect(response.body).toEqual({
//         message: 'Internal server error.'
//     });
// });



// Write New Test Cases Above this line //
});

/////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////// END //////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////








// Old Test Cases //


//   // Test Case 1: Fetching team schedule for a single day for Yee Lim's team (2024-09-06)
//   it('should fetch approved team schedule for a single day for manager Yee Lim (2024-09-06)', async () => {
//     const mockData = [
//       { staff_id: 140911, staff_fname: 'Minh', staff_lname: 'Ly', dept: 'Sales', wfh_date: '2024-09-06', timeslot: null, schedule_status: 'In Office' },
//       { staff_id: 140912, staff_fname: 'Chandara', staff_lname: 'Kim', dept: 'Sales', wfh_date: '2024-09-06', timeslot: null, schedule_status: 'In Office' },
//       { staff_id: 140917, staff_fname: 'Heng', staff_lname: 'Phan', dept: 'Sales', wfh_date: '2024-09-06', timeslot: null, schedule_status: 'In Office' },
//       { staff_id: 140918, staff_fname: 'Nara', staff_lname: 'Khun', dept: 'Sales', wfh_date: '2024-09-06', timeslot: null, schedule_status: 'PM Leave' },
//       { staff_id: 140919, staff_fname: 'Priya', staff_lname: 'Malik', dept: 'Sales', wfh_date: '2024-09-06', timeslot: null, schedule_status: 'In Office' }
//     ];

//     // Mock the response for fetching WFH records for Yee Lim and their subordinates
//     client.query.mockResolvedValueOnce({ rows: mockData, rowCount: mockData.length });

//     // Test API response
//     await testApiResponse('/wfh_records/team-schedule/140944/2024-09-06', 200, {
//       total_team_members: mockData.length,
//       team_schedule: {
//         '2024-09-06': mockData
//       }
//     });
//   });

  

//   // Test Case 2: Fetching team schedule for a range of dates for Yee Lim's team (2024-09-04 to 2024-09-06)
//   it('should fetch approved team schedule for a range of dates for manager Yee Lim (2024-09-04 to 2024-09-06)', async () => {
//     const mockData = {
//       '2024-09-04': [
//         { staff_id: 140001, staff_fname: 'Minh', staff_lname: 'Ly', dept: 'Sales', wfh_date: '2024-09-04', timeslot: 'FD', status: 'Approved' },
//         { staff_id: 140002, staff_fname: 'Chandara', staff_lname: 'Kim', dept: 'Sales', wfh_date: '2024-09-04', timeslot: 'AM', status: 'Approved' }
//       ],
//       '2024-09-05': [
//         { staff_id: 140003, staff_fname: 'Heng', staff_lname: 'Phan', dept: 'Sales', wfh_date: '2024-09-05', timeslot: 'FD', status: 'Approved' },
//         { staff_id: 140004, staff_fname: 'Nara', staff_lname: 'Khun', dept: 'Sales', wfh_date: '2024-09-05', timeslot: 'PM', status: 'Approved' }
//       ],
//       '2024-09-06': [
//         { staff_id: 140001, staff_fname: 'Minh', staff_lname: 'Ly', dept: 'Sales', wfh_date: '2024-09-06', timeslot: 'FD', status: 'Approved' },
//         { staff_id: 140004, staff_fname: 'Nara', staff_lname: 'Khun', dept: 'Sales', wfh_date: null, schedule_status: 'PM Leave' }
//       ]
//     };

//     // Mock the response for fetching WFH records for the date range
//     client.query.mockResolvedValueOnce({ rows: [].concat(...Object.values(mockData)), rowCount: 14 });

//     // Test API response
//     await testApiResponse('/wfh_records/team-schedule/140944/2024-09-04/2024-09-06', 200, {
//       total_team_members: 14,
//       team_schedule: mockData
//     });
//   });

//   // Test Case 3: No team members found for the given manager and date range
//   it('should return an empty array if no team members found for the given manager and date range', async () => {
//     // Mock the database response
//     client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

//     // Test API response
//     await testApiResponse('/wfh_records/team-schedule/140944/2024-09-04/2024-09-06', 200, {
//       total_team_members: 0,
//       team_schedule: {}
//     });
//   });

//   // Test Case 4: Error Handling for Database Failure
//   it('should return a 500 status code if a database error occurs', async () => {
//     // Mock a database error
//     client.query.mockRejectedValueOnce(new Error('Database error'));

//     const response = await request(app).get('/wfh_records/team-schedule/140944/2024-09-06');
//     expect(response.statusCode).toBe(500);
//     expect(response.body).toEqual({
//       message: 'Internal server error. Database error'
//     });
//   });
// });

// // Test for Subordinate Team Member Retrieval
// describe('WFH Records API - Subordinate Team Retrieval', () => {
//   afterEach(() => {
//     jest.clearAllMocks(); // Clear any previous mocks after each test
//   });

//   // Test Case 5: Ensure all subordinates of manager Yee Lim are returned
//   it('should return all subordinates of manager Yee Lim', async () => {
//     const mockData = [
//       { staff_id: 140911, staff_fname: 'Minh', staff_lname: 'Ly', dept: 'Sales', wfh_date: '2024-09-06', schedule_status: 'In Office' },
//       { staff_id: 140912, staff_fname: 'Chandara', staff_lname: 'Kim', dept: 'Sales', wfh_date: '2024-09-06', schedule_status: 'In Office' },
//       { staff_id: 140917, staff_fname: 'Heng', staff_lname: 'Phan', dept: 'Sales', wfh_date: '2024-09-06', schedule_status: 'In Office' },
//       { staff_id: 140918, staff_fname: 'Nara', staff_lname: 'Khun', dept: 'Sales', wfh_date: null, schedule_status: 'PM Leave' }
//     ];

//     client.query.mockResolvedValueOnce({ rows: mockData });

//     // Test API response for the subordinates
//     await testApiResponse('/wfh_records/team-schedule/140944/2024-09-06', 200, {
//       total_team_members: mockData.length,
//       team_schedule: {
//         '2024-09-06': mockData // Ensure mockData is used here
//       }
//     });
//   });

// });


// ----------- Department Schedule API Tests ------------ // 

// Test for Department Schedule (Single Day and Range of Dates)
// describe('WFH Records API - Department Schedule', () => {
//   afterEach(() => {
//     jest.clearAllMocks(); // Clear any previous mocks after each test
//   });

//   // Test Case 1: Fetching staff schedule for a single day for a single department (Sales)
//   it('should fetch approved staff schedule for a single day for the Sales department', async () => {
//     const mockData = [
//       { staff_id: 140001, staff_fname: 'Minh', staff_lname: 'Ly', dept: 'Sales', wfh_date: '2024-09-06', timeslot: 'FD', status: 'Approved' },
//       { staff_id: 140002, staff_fname: 'Chandara', staff_lname: 'Kim', dept: 'Sales', wfh_date: '2024-09-06', timeslot: 'AM', status: 'Approved' }
//     ];

//     // Mock the response for fetching WFH records for the Sales department
//     client.query.mockResolvedValueOnce({ rows: mockData, rowCount: mockData.length });

//     // Test API response
//     await testApiResponse('/wfh_records/schedule/Sales/2024-09-06/2024-09-06', 200, {
//       total_staff: mockData.length,
//       staff_schedules: {
//         '2024-09-06': mockData
//       }
//     });
//   });

//   // Test Case 2: Fetching staff schedule for a range of dates for multiple departments (Sales, CEO)
//   it('should fetch approved staff schedule for a range of dates for the Sales and CEO departments', async () => {
//     const mockData = {
//       '2024-09-04': [
//         { staff_id: 140001, staff_fname: 'Minh', staff_lname: 'Ly', dept: 'Sales', wfh_date: '2024-09-04', timeslot: 'FD', status: 'Approved' },
//         { staff_id: 150001, staff_fname: 'John', staff_lname: 'Smith', dept: 'CEO', wfh_date: '2024-09-04', timeslot: 'AM', status: 'Approved' }
//       ],
//       '2024-09-05': [
//         { staff_id: 140002, staff_fname: 'Chandara', staff_lname: 'Kim', dept: 'Sales', wfh_date: '2024-09-05', timeslot: 'FD', status: 'Approved' },
//         { staff_id: 150002, staff_fname: 'Jane', staff_lname: 'Doe', dept: 'CEO', wfh_date: '2024-09-05', timeslot: 'PM', status: 'Approved' }
//       ]
//     };

//     // Mock the response for fetching WFH records for the date range and multiple departments
//     client.query.mockResolvedValueOnce({ rows: [].concat(...Object.values(mockData)), rowCount: 4 });

//     // Test API response
//     await testApiResponse('/wfh_records/schedule/Sales,CEO/2024-09-04/2024-09-05', 200, {
//       total_staff: 4,
//       staff_schedules: mockData
//     });
//   });

//   // Test Case 3: No staff members found for the given departments and date range
//   it('should return an empty array if no staff members found in the given departments and date range', async () => {
//     // Mock the database response
//     client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

//     // Test API response
//     await testApiResponse('/wfh_records/schedule/Sales,HR/2024-09-15/2024-09-16', 200, {
//       total_staff: 0,
//       staff_schedules: {}
//     });
//   });

//   // Test Case 4: Error Handling for Database Failure
//   it('should return a 500 status code if a database error occurs', async () => {
//     // Mock a database error
//     client.query.mockRejectedValueOnce(new Error('Database error'));

//     const response = await request(app).get('/wfh_records/schedule/Sales/2024-09-16');
//     expect(response.statusCode).toBe(500);
//     expect(response.body).toEqual({
//       message: 'Internal server error. Database error'
//     });
//   });
// });

// New Code //
// Test for Team Schedule (Single Day and Range of Dates)
// describe('WFH Records API - Team Schedule', () => {
//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   // Test fetching single day schedule
//   it('should fetch approved team schedule for a single day', async () => {
//     const mockData = [{
//       staff_id: 140911,
//       staff_fname: 'Minh',
//       staff_lname: 'Ly',
//       dept: 'Sales',
//       wfh_date: '2024-09-06',
//       timeslot: null,
//       schedule_status: 'In Office'
//     }];

//     client.query.mockResolvedValueOnce({ rows: mockData });

//     await testApiResponse('/wfh_records/team-schedule/140944/2024-09-06', 200, {
//       total_team_members: mockData.length,
//       team_schedule: {
//         '2024-09-06': mockData
//       }
//     });
//   });

//   // Test range of dates
//   it('should fetch approved team schedule for a range of dates', async () => {
//     const mockData = {
//       '2024-09-04': [
//         { staff_id: 140001, staff_fname: 'Minh', staff_lname: 'Ly', dept: 'Sales', wfh_date: '2024-09-04', timeslot: 'FD', status: 'Approved' }
//       ],
//       '2024-09-05': [
//         { staff_id: 140002, staff_fname: 'Chandara', staff_lname: 'Kim', dept: 'Sales', wfh_date: '2024-09-05', timeslot: 'AM', status: 'Approved' }
//       ]
//     };

//     client.query.mockResolvedValueOnce({
//       rows: [].concat(...Object.values(mockData)),
//       rowCount: 2
//     });

//     await testApiResponse('/wfh_records/team-schedule/140944/2024-09-04/2024-09-05', 200, {
//       total_team_members: 2,
//       team_schedule: mockData
//     });
//   });

//   // No team members found case
//   it('should return an empty schedule if no team members are found', async () => {
//     client.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

//     await testApiResponse('/wfh_records/team-schedule/140944/2024-09-04/2024-09-06', 200, {
//       total_team_members: 0,
//       team_schedule: {
//         '2024-09-04': [],
//         '2024-09-05': [],
//         '2024-09-06': []
//       }
//     });
//   });

//   // Database error handling
//   it('should return a 500 status code for a database error', async () => {
//     client.query.mockRejectedValueOnce(new Error('Database error'));

//     const response = await request(app).get('/wfh_records/team-schedule/140944/2024-09-06');
//     expect(response.statusCode).toBe(500);
//     expect(response.body).toEqual({
//       message: 'Internal server error. Database error'
//     });
//   });

// });