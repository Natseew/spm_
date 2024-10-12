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
        await client.query('BEGIN');

        if (!staff_id || !sched_date || !timeSlot || !reason) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Missing required fields.' });
        }

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

        const managerResult = await client.query(
            `SELECT Reporting_Manager FROM Employee WHERE Staff_ID = $1`,
            [staff_id]
        );

        if (managerResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Staff ID not found.' });
        }

        const reportingManagerId = managerResult.rows[0].reporting_manager;
        let status = 'Pending';

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
        const wfhFraction = (teamWfh + 1) / totalTeam;

        if (wfhFraction > 0.5) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                message: 'WFH request denied. More than 50% of the team would be WFH on this date.',
            });
        }

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

        await client.query(
            `
            INSERT INTO ActivityLog (recordID, activity)
            VALUES ($1, 'New Request');
            `,
            [recordID]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: 'WFH request submitted successfully', recordID });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting WFH request:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

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
      // Update the status of the record to 'Withdrawn'
      const result = await client.query(`
          UPDATE wfh_records
          SET status = 'Withdrawn'
          WHERE recordid = $1
          RETURNING *
      `, [recordid]);

      if (result.rowCount === 0) {
          return res.status(404).json({ message: 'Record not found' });
      }

      await client.query(
        `
        INSERT INTO activitylog (recordid, activity)
        VALUES ($1, 'Record Withdrawn');
        `,
        [recordid]
      );

      res.status(200).json({ message: 'Record withdrawn successfully', record: result.rows[0] });
  } catch (error) {
      console.error('Error withdrawing record:', error);
      res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});

module.exports = router;
