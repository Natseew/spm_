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

module.exports = router;