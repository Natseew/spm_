const express = require('express');
const router = express.Router();
const client = require('../databasepg');

// GET all work-from-home records
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

// Get all approved work-from-home records for a specific employee
router.get('/:staffid', async (req, res) => {
    try {
        const result = await client.query(`
            SELECT * FROM wfh_records w
            WHERE w.staffid = $1 AND w.status = 'Approved'
        `, [req.params.staffid]);
        console.log(result.rows);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error retrieving approved WFH records:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});


// POST WFH ad-hoc request
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
  
      // Check if a request for the same date already exists with a non-rejected status
      const existingRequest = await client.query(
        `
        SELECT * FROM wfh_records 
        WHERE staffID = $1 AND wfh_date = $2 AND status IN ('Pending', 'Approved')
        `,
        [staff_id, sched_date]
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
        [sched_date, reportingManagerId]
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
  
      // Insert into wfh_records table
      const wfhRecordResult = await client.query(
        `
        INSERT INTO wfh_records (
          staffID, wfh_date, recurring, timeslot, status, request_reason, requestDate
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING recordID;
        `,
        [staff_id, sched_date, false, timeSlot, status, reason, req_date]
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
  
  

module.exports = router;
// New route to get WFH records by an array of employee IDs
router.post('/by-employee-ids', async (req, res) => {
    try {
        const { employeeIds } = req.body;

        // Validate input
        if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
            return res.status(400).json({ message: 'Invalid input. Must provide an array of employee IDs.' });
        }

        // Create placeholders for the SQL query
        const placeholders = employeeIds.map((_, index) => `$${index + 1}`).join(', ');
        const query = `SELECT * FROM wfh_records WHERE staffid IN (${placeholders})`;

        // Execute the query
        const result = await client.query(query, employeeIds);
        console.log(result.rows);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error retrieving WFH records by employee IDs:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

router.put('/withdraw/:recordid', async (req, res) => {
  const { recordid } = req.params;

  try {
      // Update the status of the record to 'withdrawn'
      const result = await client.query(`
          UPDATE wfh_records
          SET status = 'withdrawn'
          WHERE recordid = $1
          RETURNING *
      `, [recordid]);

      if (result.rowCount === 0) {
          return res.status(404).json({ message: 'Record not found' });
      }

      res.status(200).json({ message: 'Record withdrawn successfully', record: result.rows[0] });
  } catch (error) {
      console.error('Error withdrawing record:', error);
      res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});

module.exports = router;
