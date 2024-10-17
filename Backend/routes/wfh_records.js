const express = require('express');
const router = express.Router();
const client = require('../databasepg');

// Route to get all WFH records
router.get('/', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM wfh_records');
        console.log(result.rows);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error retrieving all wfh_records:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// Route to get all approved WFH records for a specific employee
router.get('/:staffid', async (req, res) => {
    try {
        const result = await client.query(
            `
            SELECT * FROM wfh_records
            WHERE staffid = $1 AND status = 'Approved'
            `, 
            [req.params.staffid]
        );
        console.log(result.rows);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error retrieving approved WFH records for staff:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// Route to get approved staff schedule for a team based on Reporting Manager ID and date
router.get('/team-schedule/:manager_id/:date', async (req, res) => {
    const { manager_id, date } = req.params;

    try {
        const scheduleResult = await client.query(
            `
            SELECT 
                e.staff_id, 
                e.staff_fname, 
                e.staff_lname, 
                e.dept, 
                e.reporting_manager, 
                COALESCE(wr.wfh_date, $2) AS wfh_date,
                COALESCE(wr.timeslot, 'Office') AS timeslot,
                COALESCE(wr.status, 'Office') AS status,
                CASE 
                    WHEN wr.timeslot = 'FD' THEN 'Full-Day'
                    WHEN wr.timeslot = 'AM' THEN 'AM'
                    WHEN wr.timeslot = 'PM' THEN 'PM'
                    ELSE 'Office'
                END AS schedule_status,
                wr.recurring,
                wr.request_reason,
                wr.requestDate,
                wr.reject_reason
            FROM 
                Employee e
            LEFT JOIN 
                wfh_records wr ON e.staff_id = wr.staffID AND wr.wfh_date = $2
            WHERE 
                e.reporting_manager = $1
            `,
            [manager_id, date]
        );

        res.status(200).json({
            total_team_members: scheduleResult.rowCount,
            staff_schedules: scheduleResult.rows
        });

    } catch (error) {
        console.error('Error fetching approved team schedule:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// Route to get staff schedule by department(s) and date
router.get('/schedule/:departments/:date', async (req, res) => {
    const { departments, date } = req.params;
    const departmentList = departments.split(',');

    try {
        const scheduleResult = await client.query(
            `
            SELECT 
                e.staff_id, 
                e.staff_fname, 
                e.staff_lname, 
                e.dept, 
                e.reporting_manager, 
                COALESCE(wr.wfh_date, $2) AS wfh_date,
                COALESCE(wr.timeslot, 'Office') AS timeslot,
                COALESCE(wr.status, 'Office') AS status,
                CASE 
                    WHEN wr.timeslot = 'FD' THEN 'Full-Day'
                    WHEN wr.timeslot = 'AM' THEN 'AM'
                    WHEN wr.timeslot = 'PM' THEN 'PM'
                    ELSE 'Office'
                END AS schedule_status,
                wr.recurring,
                wr.request_reason,
                wr.requestDate,
                wr.reject_reason
            FROM 
                Employee e
            LEFT JOIN 
                wfh_records wr ON e.staff_id = wr.staffID AND wr.wfh_date = $2
            WHERE 
                e.dept = ANY($1::text[])
            `,
            [departmentList, date]
        );

        res.status(200).json({
            total_staff: scheduleResult.rowCount,
            staff_schedules: scheduleResult.rows
        });

    } catch (error) {
        console.error('Error fetching staff schedule by department:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// Route to submit a WFH ad-hoc request
router.post('/wfh_adhoc_request', async (req, res) => {
  const { staff_id, req_date, sched_date, timeSlot, reason } = req.body;

  try {
    // Begin a transaction
    await client.query('BEGIN');

    // Validate required fields
    if (!staff_id || !sched_date || !timeSlot || !reason) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Ensure sched_date only contains the date part
    const formattedSchedDate = new Date(sched_date).toISOString().split('T')[0];

    // Check if a request for the same date already exists with a non-rejected status
    const existingRequest = await client.query(
      `
      SELECT * FROM wfh_records 
      WHERE staffID = $1 AND wfh_date = $2 AND status IN ('Pending', 'Approved')
      `,
      [staff_id, formattedSchedDate]
    );

    if (existingRequest.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: 'A WFH request for this date already exists and is either pending or approved.',
      });
    }

    // Get the reporting manager ID for the staff
    const managerResult = await client.query(
      `SELECT Reporting_Manager FROM Employee WHERE Staff_ID = $1`,
      [staff_id]
    );

    if (managerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Staff ID not found.' });
    }

    const reportingManagerId = managerResult.rows[0].reporting_manager;

    // Determine the initial status as 'Pending'
    let status = 'Pending';

    // Check if approving this request would cause more than 50% of the team to be WFH
    const totalTeamResult = await client.query(
      `SELECT COUNT(*) AS total_team FROM Employee WHERE Reporting_Manager = $1 AND Staff_ID != $1`,
      [reportingManagerId]
    );
    const totalTeam = parseInt(totalTeamResult.rows[0].total_team, 10) + 1;

    const teamWfhResult = await client.query(
      `
      SELECT COUNT(*) AS team_wfh FROM wfh_records 
      WHERE wfh_date = $1 AND status = 'Approved' AND staffID IN (
        SELECT Staff_ID FROM Employee WHERE Reporting_Manager = $2 OR Staff_ID = $2
      )
      `,
      [formattedSchedDate, reportingManagerId]
    );
    const teamWfh = parseInt(teamWfhResult.rows[0].team_wfh, 10);

    const newWfhCount = teamWfh + 1;
    const wfhFraction = newWfhCount / totalTeam;

    if (wfhFraction > 0.5) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        message: 'WFH request denied. More than 50% of the team would be WFH on this date.',
      });
    }

    // Insert into wfh_records table with the date-only wfh_date
    const wfhRecordResult = await client.query(
      `
      INSERT INTO wfh_records (
        staffID, wfh_date, recurring, timeslot, status, request_reason, requestDate
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING recordID;
      `,
      [staff_id, formattedSchedDate, false, timeSlot, status, reason, req_date]
    );

    const recordID = wfhRecordResult.rows[0].recordid;

    // Insert into ActivityLog with "New Request" activity
    await client.query(
      `
      INSERT INTO ActivityLog (recordID, activity)
      VALUES ($1, $2);
      `,
      [recordID, 'New Request']
    );

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({ message: 'WFH request submitted successfully', recordID });
  } catch (error) {
    // Rollback transaction in case of any error
    await client.query('ROLLBACK');
    console.error('Error submitting WFH request:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});



// Get all approved and pending WFH requests of an employee
router.get('/approved&pending_wfh_requests/:staffid', async (req, res) => {
  try {
    const result = await client.query(
      `
      SELECT * FROM wfh_records 
      WHERE staffID = $1
      AND status IN ('Approved', 'Pending')
      `,
      [req.params.staffid]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No approved or pending WFH requests found for this employee.' });
    }

    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching approved and pending WFH requests:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});





// Withdraw an ad-hoc WFH request
router.post('/withdraw_wfh', async (req, res) => {
  const { recordID, reason,staff_id} = req.body;

  try {
    // Start a transaction to ensure atomicity
    await client.query('BEGIN');

    // 1. Fetch the current request to check its status
    const result = await client.query(
      `SELECT status FROM wfh_records WHERE recordID = $1`,
      [recordID]
    );

    const currentStatus = result.rows[0]?.status;

    // Validate the current status for withdrawal (if it's neither Pending nor Approved)
    if (currentStatus !== "Pending" && currentStatus !== "Approved") {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid request status for withdrawal.' });
    }

    // Determine new status based on the current status
    const newStatus = currentStatus === "Approved" ? "Pending Withdrawal" : "Withdrawn";

    // 2. Update the wfh_records table to set the new status
    const updateResult = await client.query(
      `UPDATE wfh_records 
       SET status = $1 
       WHERE recordID = $2 
       RETURNING *`,
      [newStatus, recordID]
    );

    // Check if the record exists and was updated
    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'WFH request not found or already withdrawn.' });
    }

    // 3. Insert a new row into the activity log to log the withdrawal along with the reason

    const activityLog = {
      Staff_id: staff_id, 
      Action: newStatus,
      Reason: reason,
    };

    await client.query(
      `INSERT INTO activitylog (recordID, activity) 
       VALUES ($1, $2)`,
       [recordID, JSON.stringify(activityLog)] // Convert the activity log to a JSON string
    );

    // Commit the transaction
    await client.query('COMMIT');

    // Send a different response message based on the original status
    if (currentStatus === "Approved") {
      res.status(200).json({ message: 'Withdrawal has been submitted to Reporting Manager for approval.' });
    } else {
      res.status(200).json({ message: 'WFH request withdrawn successfully.' });
    }

  } catch (error) {
    // Rollback in case of any errors
    await client.query('ROLLBACK');
    console.error('Error withdrawing WFH request:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Change an ad-hoc WFH request
router.post('/change_adhoc_wfh', async (req, res) => {
  const { recordID, new_date, reason,staff_id } = req.body;

  try {
    // Start a transaction to ensure atomicity
    await client.query('BEGIN');

    // 1. Fetch the current WFH record to get the current status and wfh_date
    const result = await client.query(
      `SELECT status, wfh_date FROM wfh_records WHERE recordID = $1`,
      [recordID]
    );

    const currentStatus = result.rows[0]?.status;
    const currentWfhDate = result.rows[0]?.wfh_date;

    // Validate the current status for change (if it's neither Pending nor Approved)
    if (currentStatus !== "Pending" && currentStatus !== "Approved") {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid request status for change.' });
    }

    // Convert new_date to a proper Date object if it's not already
    const formattedNewDate = new Date(new_date);

    // Determine new status and decide whether to update wfh_date or not
    let newStatus = currentStatus;
    let updateWfhDate = false;

    if (currentStatus === "Pending") {
      // For pending requests, keep the status as "Pending" and update the wfh_date
      newStatus = "Pending";
      updateWfhDate = true;
    } else if (currentStatus === "Approved") {
      // For approved requests, set status to "Pending Change" but don't update wfh_date
      newStatus = "Pending Change";
    }

    // 2. Update the wfh_records table
    if (updateWfhDate) {
      // For pending requests, update the wfh_date in the table
      const updateResult = await client.query(
        `UPDATE wfh_records 
         SET status = $1, wfh_date = $2 
         WHERE recordID = $3 
         RETURNING *`,
        [newStatus, formattedNewDate, recordID]
      );

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'WFH request not found or already changed.' });
      }
    } else {
      // For approved requests, only update the status without changing wfh_date
      const updateResult = await client.query(
        `UPDATE wfh_records 
         SET status = $1 
         WHERE recordID = $2 
         RETURNING *`,
        [newStatus, recordID]
      );

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'WFH request not found or already changed.' });
      }
    }

    // Convert dates to YYYY-MM-DD format for saving in the activity log
    const formattedCurrentWfhDate = new Date(currentWfhDate).toISOString().split('T')[0]; // Old WFH Date
    const formattedNewDateString = formattedNewDate.toISOString().split('T')[0]; // New WFH Date

    // 3. Insert a new row into the activity log to log the change along with the reason and old/new wfh_date
    const activityLog = {
      Staff_id: staff_id, // Log the staff_id as the actor
      Action: newStatus === "Pending Change" ? "Pending Change" : "Changed",
      Reason: reason,
      CurrentWFHDate: formattedCurrentWfhDate,
      NewWFHDate: formattedNewDateString,
    };

    await client.query(
      `INSERT INTO activitylog (recordID, activity) 
       VALUES ($1, $2)`,
      [recordID, JSON.stringify(activityLog)] // Store the activity log as a JSON string
    );

    // Commit the transaction
    await client.query('COMMIT');

    // Send a different response message based on the original status
    if (currentStatus === "Approved") {
      res.status(200).json({ message: 'Change request has been submitted to Reporting Manager for approval.' });
    } else {
      res.status(200).json({ message: 'WFH date changed successfully.' });
    }

  } catch (error) {
    // Rollback in case of any errors
    await client.query('ROLLBACK');
    console.error('Error changing WFH request:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


module.exports = router;
