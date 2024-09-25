const express = require('express');
const router = express.Router();
const client = require('../databasepg');

// Update WFH_Request and WFH_Sessions DB after staff submit WFH request form
router.post('/wfh_request', async (req, res) => {
  const { staff_id, req_date, dates, approved, rejected, reason } = req.body;

  if (!staff_id || !req_date || !dates) {
    return res.status(400).json({ message: 'Staff ID, request date, and dates with AM/PM info are required.' });
  }

  try {
    // Insert or update into WFH_Request
    const result = await client.query(
      `
      INSERT INTO WFH_Request (Staff_ID, Req_date, Approved, Rejected, Reason)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (Staff_ID, Req_date)
      DO UPDATE SET
        Approved = EXCLUDED.Approved,
        Rejected = EXCLUDED.Rejected,
        Reason = EXCLUDED.Reason
      RETURNING Req_ID;
      `,
      [staff_id, req_date, approved || false, rejected || false, reason || null]
    );

    const req_id = result.rows[0].req_id;

    // Insert into WFH_Sessions for each date
    // Eg. Dates
            // "dates": [
            //   { "sched_date": "2024-09-21", "am": true, "pm": false },
            //   { "sched_date": "2024-09-22", "am": false, "pm": true }
            // ]
    const sessionsPromises = dates.flatMap(({ sched_date, am, pm }) => {
      const sessions = [];
      if (am) {
        sessions.push(client.query(
          `
          INSERT INTO WFH_Sessions (Req_ID, Staff_ID, Sched_date, AM, PM, Approved, Rejected)
          VALUES ($1, $2, $3, TRUE, FALSE, FALSE, FALSE)
          ON CONFLICT (Req_ID, Sched_date)
          DO UPDATE SET
            AM = EXCLUDED.AM,
            PM = EXCLUDED.PM,
            Approved = EXCLUDED.Approved,
            Rejected = EXCLUDED.Rejected;
          `,
          [req_id, staff_id, sched_date]
        ));
      }
      if (pm) {
        sessions.push(client.query(
          `
          INSERT INTO WFH_Sessions (Req_ID, Staff_ID, Sched_date, AM, PM, Approved, Rejected)
          VALUES ($1, $2, $3, FALSE, TRUE, FALSE, FALSE)
          ON CONFLICT (Req_ID, Sched_date)
          DO UPDATE SET
            AM = EXCLUDED.AM,
            PM = EXCLUDED.PM,
            Approved = EXCLUDED.Approved,
            Rejected = EXCLUDED.Rejected;
          `,
          [req_id, staff_id, sched_date]
        ));
      }
      return sessions;
    });

    await Promise.all(sessionsPromises);

    res.status(200).json({ message: 'WFH request updated successfully.' });
  } catch (error) {
    console.error('Error updating WFH request:', error);
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

// Update WFH_Recurring_Request DB after staff submits recurring WFH request form
router.post('/wfh_recurring_request', async (req, res) => {
  const { staff_id, start_date, end_date, day_of_week, approved, rejected, reason } = req.body;

  // Validate required fields
  if (!staff_id || !start_date || !end_date || !day_of_week) {
    return res.status(400).json({ message: 'Staff ID, start date, end date, and day of week are required.' });
  }

  try {
    // Insert or update the recurring work-from-home request
    const result = await client.query(
      `
      INSERT INTO WFH_Recurring_Request (Staff_ID, Start_date, End_date, Day_of_week, Approved, Rejected, Reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (Staff_ID, Start_date, Day_of_week)
      DO UPDATE SET
        End_date = EXCLUDED.End_date,
        Approved = EXCLUDED.Approved,
        Rejected = EXCLUDED.Rejected,
        Reason = EXCLUDED.Reason
      RETURNING *;
      `,
      [staff_id, start_date, end_date, day_of_week, approved || false, rejected || false, reason || null]
    );
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
