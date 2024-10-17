const express = require('express');
const router = express.Router();
const client = require('../databasepg');










router.get('/wfh_requests/:staff_id', async (req, res) => {
  const { staff_id, status } = req.params;

  try {
    // Query to fetch pending WFH ad-hoc requests for the specified staff_id and status
    const pendingRequests = await client.query(
      `
      SELECT 
        wfh.Sched_date, 
        wfh.TimeSlot, 
        wfh.Status,
        adhoc.Req_date,
        adhoc.Reason,
        'adhoc' as request_type -- Add a field to indicate this is an ad-hoc request
      FROM 
        WFH_Backlog wfh
      JOIN 
        WFH_Adhoc_Request adhoc ON wfh.req_id = adhoc.req_id
      WHERE 
        wfh.Staff_ID = $1
      `,
      [staff_id]
    );

    // Query to fetch recurring WFH requests for the specified staff_id and status
    const recurringRequests = await client.query(
      `
      SELECT 
        recurring.Start_date, 
        recurring.End_date, 
        recurring.Day_of_week, 
        recurring.Reason,
        recurring.Status,
        'recurring' as request_type -- Add a field to indicate this is a recurring request
      FROM 
        WFH_Recurring_Request recurring
      WHERE 
        recurring.Staff_ID = $1
      `,
      [staff_id]
    );

    // Combine the results from both adhoc and recurring requests
    const combinedRequests = [
      ...pendingRequests.rows,
      ...recurringRequests.rows
    ];

    if (combinedRequests.length === 0) {
      return res.status(404).json({ message: 'No requests found.' });
    }

    // Return the pending requests
    res.status(200).json(combinedRequests);
    
  } catch (error) {
    console.error('Error fetching pending WFH requests:', error);
    res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});

// GET all employees
router.get('/', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM employee');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});

// Insert recurring WFH request
router.post('/wfh_recurring_request', async (req, res) => {
  const { staff_id, start_date, end_date, day_of_week, reason } = req.body;

  // Validate required fields
  if (!staff_id || !start_date || !end_date || !day_of_week || !reason) {
    return res.status(400).json({ message: 'Staff ID, start date, end date, day of week, and reason are required.' });
  }

  // Check if the day_of_week is valid (1-5)
  if (day_of_week < 1 || day_of_week > 5) {
    return res.status(400).json({ message: 'Day of week must be between 1 (Monday) and 5 (Friday).' });
  }

  try {
    // Insert into WFH_Recurring_Request table
    const result = await client.query(
      `
      INSERT INTO WFH_Recurring_Request (Staff_ID, Start_date, End_date, Day_of_week, Reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING Req_ID;
      `,
      [staff_id, start_date, end_date, day_of_week, reason]
    );

    const req_id = result.rows[0].req_id;

    res.status(201).json({ message: 'Recurring WFH request submitted successfully', req_id });
  } catch (error) {
    console.error('Error submitting recurring WFH request:', error);
    res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});


//Get all approved wfh of employee
router.get('/employee/:id', async(req, res) => {
  try{
    const result = await client.query(`
      SELECT * FROM wfh_backlog w
      WHERE w.staff_id = ${req.params.id}
      AND w.status = 'Approved'
    `);
    console.log(result.rows)
    res.status(200).json(result.rows)
  }catch(error){

  }

});

//get all wfh details by staffId
router.get('/wfh_backlog/employee/:staffId', async (req, res) => {
  const staffId = parseInt(req.params.staffId, 10); // Get Staff ID from request parameters

  if (isNaN(staffId)) {
    return res.status(400).json({ message: 'Invalid Staff ID' });
  }
  
  try {
    const result = await client.query(`
      SELECT 
        Sched_date,
        TimeSlot,
        Reason,
        Status
      FROM 
        WFH_Backlog
      WHERE 
        Staff_ID = $1
      ORDER BY 
        Sched_date
    `, [staffId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching WFH backlog:', error);
    res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});

module.exports = router;
