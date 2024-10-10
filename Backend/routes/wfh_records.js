const express = require('express');
const router = express.Router();
const client = require('../databasepg');

router.get('/', async (req, res) => {
    try{
        const result = await client.query(`
            SELECT * FROM wfh_records
        `);
        console.log(result.rows)
        res.status(200).json(result.rows)
    }catch(error){
        console.error('Error retreiving all wfh_records:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

        //Get all approved wfh of employee
router.get('/:staffid', async(req, res) => {
    try{
    const result = await client.query(`
        SELECT * FROM wfh_records w
        WHERE w.staffid = ${req.params.staffid}
        AND w.status = 'Approved'
    `);
    console.log(result.rows)
    res.status(200).json(result.rows)
    }catch(error){

    }
});


// ---------------------------------- view schedule --------------------------------------------- // 


// GET approved staff schedule for a team based on Reporting Manager & date
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
                e.reporting_manager,  -- Include the Reporting Manager ID
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

        // Count all team members under the reporting manager (already included in the above query)
        const totalTeamMembers = scheduleResult.rowCount;

        // Combine results
        const response = {
            total_team_members: totalTeamMembers,
            staff_schedules: scheduleResult.rows
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error fetching approved team schedule:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});


// ---------------------------------- view schedule --------------------------------------------- // 


// GET approved staff schedule for a team based on Reporting Manager & date
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
                e.reporting_manager,  -- Include the Reporting Manager ID
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

        // Count all team members under the reporting manager (already included in the above query)
        const totalTeamMembers = scheduleResult.rowCount;

        // Combine results
        const response = {
            total_team_members: totalTeamMembers,
            staff_schedules: scheduleResult.rows
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error fetching approved team schedule:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});



// GET staff schedule by department(s)
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
                e.reporting_manager,  -- Include the Reporting Manager ID
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

        // Query to count total staff in the departments (already fetched with full employee list)
        const totalStaff = scheduleResult.rowCount;

        // Combine results
        const response = {
            total_staff: totalStaff,
            staff_schedules: scheduleResult.rows
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error fetching staff schedule:', error);
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