const express = require('express');
const router = express.Router();
const client = require('../databasepg');

// POST WFH request
router.post('/wfh_adhoc_request', async (req, res) => {
  const { staff_id, req_date, sched_date, timeSlot, status = 'Pending', reason } = req.body; // Default status is 'Pending'

  try {
    // Begin a transaction to ensure atomicity
    await client.query('BEGIN');

    // Check if a request for the same employee and date already exists with a non-rejected status
    const existingRequest = await client.query(
      `
      SELECT * FROM WFH_Adhoc_Request 
      WHERE Staff_ID = $1 AND Sched_date = $2 AND Status IN ('Pending', 'Approved')
      `,
      [staff_id, sched_date]
    );

    if (existingRequest.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'A WFH request for this date already exists and is either pending or approved. Please choose a different date or wait for the current request to be processed.'
      });
    }
   
    // Get the reporting manager ID for the staff
    const managerResult = await client.query(
      `SELECT reporting_manager FROM Employee WHERE staff_id = $1`,
      [staff_id]
    );
  
    if (managerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Manager ID not found.' });
    }

    const reportingManagerId = managerResult.rows[0].reporting_manager;

    // If the staff is the reporting manager, auto-approve the request
    let updatedStatus = status;
    if (staff_id === reportingManagerId) {
      updatedStatus = 'Approved'; // Auto-approve if the reporting manager is making the request
    }

    // Check the number of teammates WFH on the scheduled date
    const wfhCountResult = await client.query(
      `SELECT COUNT(*) AS wfh_count FROM WFH_Backlog
       WHERE Sched_date = $1 AND Status = 'Approved' AND Staff_ID IN (
         SELECT staff_id FROM Employee WHERE reporting_manager = $2
       )`,
      [sched_date, reportingManagerId]
    );

    const wfhCount = parseInt(wfhCountResult.rows[0].wfh_count, 10);
    
    // Get total number of people in the sub-team
    const totalCountResult = await client.query(
      `SELECT COUNT(*) AS total_count FROM Employee WHERE reporting_manager = $1`,
      [reportingManagerId]
    );

    const totalCount = parseInt(totalCountResult.rows[0].total_count, 10);

    // Calculate new WFH count if this request is approved
    const newWfhCount = wfhCount + 1;
    const wfhFraction = newWfhCount / totalCount;

    if (wfhFraction >= 0.5 && staff_id !== reportingManagerId) {
      // If 50% or more of the team is WFH, reject the request
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'WFH request denied. At least 50% of the team must be in the office.' });
    }

    // Insert into WFH_Adhoc_Request table with the updated status
    const wfhRequestResult = await client.query(
      `
      INSERT INTO WFH_Adhoc_Request (Staff_ID, Req_date, Sched_date, TimeSlot, Status, Reason)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING Req_ID;
      `,
      [staff_id, req_date, sched_date, timeSlot, updatedStatus, reason]
    );

    const req_id = wfhRequestResult.rows[0].req_id;

    // Insert into WFH_Backlog table with the updated status
    await client.query(
      `
      INSERT INTO WFH_Backlog (Req_ID, Staff_ID, Sched_date, TimeSlot, Reason, Status)
      VALUES ($1, $2, $3, $4, $5, $6);
      `,
      [req_id, staff_id, sched_date, timeSlot, 'New Request', updatedStatus]
    );

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({ message: 'WFH request submitted successfully', req_id });

  } catch (error) {
    // Rollback transaction in case of any error
    await client.query('ROLLBACK');
    console.error('Error submitting WFH request:', error);
    res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});


// Update WFH_Request and WFH_Sessions DB after manager clicks "approve/reject" button
router.post('/wfh_approval', async (req, res) => {
  const { staff_id, req_id, sessions } = req.body;

  if (!staff_id || !req_id || !Array.isArray(sessions) || sessions.length === 0) {
    return res.status(400).json({ message: 'Staff ID, request ID, and sessions are required.' });
  }

  try {
    // Update approval/rejection status for each session in WFH_Sessions
    const sessionPromises = sessions.map(({ sched_date, approved, rejected }) => {
      return client.query(
        `
        UPDATE WFH_Sessions
        SET Approved = $1, Rejected = $2
        WHERE Staff_ID = $3 AND Req_ID = $4 AND Sched_date = $5
        RETURNING *;
        `,
        [approved, rejected, staff_id, req_id, sched_date]
      );
    });

    // Wait for all session updates to complete
    const sessionResults = await Promise.all(sessionPromises);

    // Check if any sessions were updated
    if (sessionResults.every(result => result.rowCount === 0)) {
      return res.status(404).json({ message: 'No WFH sessions found for approval.' });
    }

    // Update the overall WFH_Request table based on session-level decisions
    const overallApproved = sessions.every(session => session.approved === true);
    const overallRejected = sessions.every(session => session.rejected === true);

    await client.query(
      `
      UPDATE WFH_Request
      SET Approved = $1, Rejected = $2
      WHERE Req_ID = $3 AND Staff_ID = $4
      RETURNING *;
      `,
      [overallApproved, overallRejected, req_id, staff_id]
    );

    // Insert into or update WFH_Backlog for tracking approvals/rejections
    await client.query(
      `
      INSERT INTO WFH_Backlog (Req_ID, Staff_ID, Status, Updated_At)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (Req_ID, Staff_ID)
      DO UPDATE SET
        Status = EXCLUDED.Status,
        Updated_At = NOW();
      `,
      [req_id, staff_id, overallApproved ? 'Approved' : 'Rejected']
    );

    res.status(200).json({ message: 'WFH request and sessions updated successfully.' });
  } catch (error) {
    console.error('Error during approval process:', error);
    res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});

// GET approved staff schedule for a team based on Reporting Manager & date
router.get('/team-schedule/:manager_id/:date', async (req, res) => {
  const { manager_id, date } = req.params;

  try {
    // Query to fetch schedule status for approved WFH_Adhoc_Request for team members under the reporting manager
    const scheduleResult = await client.query(
      `
      SELECT 
        e.staff_id, 
        e.staff_fname, 
        e.staff_lname, 
        e.dept, 
        wr.sched_date, 
        wr.timeslot,
        wr.status,
        CASE 
            WHEN wr.timeslot = 'FD' THEN 'Full-Day'
            WHEN wr.timeslot = 'AM' THEN 'AM'
            WHEN wr.timeslot = 'PM' THEN 'PM'
            ELSE 'Not Scheduled'
        END AS schedule_status
      FROM 
        Employee e
      LEFT JOIN 
        WFH_Adhoc_Request wr ON e.staff_id = wr.staff_id AND wr.sched_date = $2
      WHERE 
        e.reporting_manager = $1
        AND wr.status = 'Approved'
      UNION
      SELECT 
        e.staff_id, 
        e.staff_fname, 
        e.staff_lname, 
        e.dept, 
        wrs.sched_date, 
        wrs.timeslot,
        wrs.status,
        CASE 
            WHEN wrs.timeslot = 'FD' THEN 'Full-Day'
            WHEN wrs.timeslot = 'AM' THEN 'AM'
            WHEN wrs.timeslot = 'PM' THEN 'PM'
            ELSE 'Not Scheduled'
        END AS schedule_status
      FROM 
        Employee e
      LEFT JOIN 
        WFH_Recurring_Sessions wrs ON e.staff_id = wrs.staff_id AND wrs.sched_date = $2
      WHERE 
        e.reporting_manager = $1
        AND wrs.status = 'Approved';
      `,
      [manager_id, date]
    );

    // Query to count total approved team members under the reporting manager
    const countResult = await client.query(
      `
      SELECT COUNT(*) AS total_team_members
      FROM Employee e
      LEFT JOIN WFH_Adhoc_Request wr ON e.staff_id = wr.staff_id
      LEFT JOIN WFH_Recurring_Sessions wrs ON e.staff_id = wrs.staff_id
      WHERE e.reporting_manager = $1
      AND (wr.status = 'Approved' OR wrs.status = 'Approved');
      `,
      [manager_id]
    );

    // Combine results
    const response = {
      total_team_members: countResult.rows.length ? parseInt(countResult.rows[0].total_team_members, 10) : 0, // Safeguard for empty result
      staff_schedules: scheduleResult.rows.length ? scheduleResult.rows : []
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching approved team schedule:', error);
    res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});


// GET staff schedule by particular department & date

// THIS view WHOLE DEPARTMENT 
router.get('/schedule/:department_name/:date', async (req, res) => {
  const { department_name, date } = req.params;

  try {
    // Query to fetch schedule status for WFH_Adhoc_Request
    const scheduleResult = await client.query(
      `
      SELECT 
        e.staff_id, 
        e.staff_fname, 
        e.staff_lname, 
        e.dept, 
        wr.sched_date, 
        wr.timeslot,
        wr.status,
        CASE 
            WHEN wr.timeslot = 'FD' THEN 'Full-Day'
            WHEN wr.timeslot = 'AM' THEN 'AM'
            WHEN wr.timeslot = 'PM' THEN 'PM'
            ELSE 'Not Scheduled'
        END AS schedule_status
      FROM 
        Employee e
      LEFT JOIN 
        WFH_Adhoc_Request wr ON e.staff_id = wr.staff_id AND wr.sched_date = $2
      WHERE 
        e.dept = $1
        AND wr.status = 'Approved'
      UNION
      SELECT 
        e.staff_id, 
        e.staff_fname, 
        e.staff_lname, 
        e.dept, 
        wrs.sched_date, 
        wrs.timeslot,
        wrs.status,
        CASE 
            WHEN wrs.timeslot = 'FD' THEN 'Full-Day'
            WHEN wrs.timeslot = 'AM' THEN 'AM'
            WHEN wrs.timeslot = 'PM' THEN 'PM'
            ELSE 'Not Scheduled'
        END AS schedule_status
      FROM 
        Employee e
      LEFT JOIN 
        WFH_Recurring_Sessions wrs ON e.staff_id = wrs.staff_id AND wrs.sched_date = $2
      WHERE 
        e.dept = $1
        AND wrs.status = 'Approved';
      `,
      [department_name, date]
    );

    // Query to count total staff in the department
    const countResult = await client.query(
      `
      SELECT COUNT(*) AS total_staff
      FROM Employee
      WHERE dept = $1;
      `,
      [department_name]
    );

    // Combine results
    const response = {
      total_staff: countResult.rows.length ? parseInt(countResult.rows[0].total_staff, 10) : 0, // Safeguard for empty result
      staff_schedules: scheduleResult.rows.length ? scheduleResult.rows : []
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching staff schedule:', error);
    res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});


// GET WFH requests by staff_id and status
router.get('/wfh_requests/:staff_id/:status', async (req, res) => {
  const { staff_id, status } = req.params;
  console.log('Staff ID:', staff_id);
  console.log('Status:', status);

  try {
    // Query to fetch pending WFH requests for the specified staff_id and status
    const pendingRequests = await client.query(
      `
      SELECT 
        wfh.Change_ID, 
        wfh.Sched_date, 
        wfh.TimeSlot, 
        wfh.Status,
        adhoc.Req_date,
        adhoc.Reason
       
      FROM 
        WFH_Backlog wfh
      JOIN 
        WFH_Adhoc_Request adhoc ON wfh.Staff_ID = adhoc.Staff_ID
     
      WHERE 
        wfh.Staff_ID = $1
      AND 
        wfh.Status = $2;
      `,
      [staff_id, status]
    );
   
     // Query to fetch recurring WFH requests for the specified staff_id and status
     const recurringRequests = await client.query(
      `
      SELECT 
        recurring.Start_date, 
        recurring.End_date, 
        recurring.Day_of_week, 
        recurring.Reason
      FROM 
        WFH_Recurring_Request recurring
      WHERE 
        recurring.Staff_ID = $1
      AND 
        recurring.Status = $2;
     
      `,
      [staff_id, status]
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
