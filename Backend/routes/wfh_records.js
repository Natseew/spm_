const express = require('express');
const router = express.Router();
const client = require('../databasepg');
const dayjs = require('dayjs');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore'); 
dayjs.extend(isSameOrBefore);
// Import the map_team_hierarchy function from employee.js
const map_team_hierarchy = require('../routes/employee').map_team_hierarchy;

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
router.get('/team-schedule-v2/:manager_id/:start_date/:end_date', async (req, res) => {
  const { manager_id, start_date, end_date } = req.params;

  try {
      const dateRange = generateDateRange(start_date, end_date);
      let staff_schedules = []
        for(date of dateRange){
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
        staff_schedules = staff_schedules.concat(scheduleResult.rows)
      }

      res.status(200).json({
          staff_schedules: staff_schedules
      });

  } catch (error) {
      console.error('Error fetching approved team schedule:', error);
      res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
})

// Helper function to generate a list of dates between two given dates
const generateDateRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = dayjs(startDate);
  const end = dayjs(endDate);

  while (currentDate.isSameOrBefore(end)) {
    dates.push(currentDate.format('YYYY-MM-DD'));
    currentDate = currentDate.add(1, 'day');
  }
  return dates;
};

// Helper function to flatten the team hierarchy into a list of staff IDs
const flattenHierarchy = (team) => {
  let ids = [];
  for (const member of team) {
    ids.push(member.staff_id); // Correctly capture the staff_id
    if (member.subordinates && member.subordinates.length > 0) {
      ids = ids.concat(flattenHierarchy(member.subordinates)); // Recursively flatten subordinates
    }
  }
  return ids;
};

// Route to get approved staff schedule for a team based on Reporting Manager ID and date range
router.get('/team-schedule/:manager_id/:start_date/:end_date', async (req, res) => {
  const { manager_id, start_date, end_date } = req.params;

  try {
    console.log('Fetching team schedule for manager:', manager_id);
    console.log('Date range:', start_date, 'to', end_date);

    // Step 1: Generate the date range
    const dateRange = generateDateRange(start_date, end_date);
    console.log('Generated date range:', dateRange);

    const scheduleByDate = {};
    dateRange.forEach(date => {
      scheduleByDate[date] = [];  // Initialize each date with an empty array
    });

    // Step 2: Use map_team_hierarchy to get the full team hierarchy under the manager
    const fullTeamHierarchy = await map_team_hierarchy(manager_id, client);
    console.log('Full team hierarchy:', JSON.stringify(fullTeamHierarchy, null, 2));  // Add detailed logging

    // Flatten the hierarchy to get all staff IDs
    const allStaffIDs = flattenHierarchy(fullTeamHierarchy);
    console.log('All staff IDs:', allStaffIDs);

    if (allStaffIDs.length === 0) {
      console.log('No staff IDs found for this manager.');
      return res.status(200).json({
        total_team_members: 0,
        team_schedule: scheduleByDate
      });
    }

    // Step 3: Query to get all employees in the flattened hierarchy
    const employeesResult = await client.query(
      `SELECT staff_id, staff_fname, staff_lname, dept, reporting_manager
       FROM employee
       WHERE staff_id = ANY($1::int[])`,
      [allStaffIDs]
    );
    const employees = employeesResult.rows;
    console.log('Fetched employees:', employees.length); // Log number of employees fetched

    if (employees.length === 0) {
      console.log('No employees found for the provided staff IDs.');
    }

    // Step 4: Query to get WFH records within the date range for the employees
    const wfhRecordsResult = await client.query(
      `SELECT staffid, wfh_date, timeslot, status, recurring, request_reason, requestdate, reject_reason
       FROM wfh_records
       WHERE wfh_date BETWEEN $2 AND $3
       AND status = 'Approved'
       AND staffid = ANY($1::int[])`,
      [allStaffIDs, start_date, end_date]
    );
    const wfhRecords = wfhRecordsResult.rows;
    console.log('Fetched WFH records:', wfhRecords.length); // Log number of WFH records fetched

    if (wfhRecords.length === 0) {
      console.log('No WFH records found for the employees within the provided date range.');
    }

    // Step 5: Build a map of WFH records keyed by staffID and wfh_date
    const wfhMap = wfhRecords.reduce((acc, record) => {
      const dateKey = dayjs(record.wfh_date).format('YYYY-MM-DD');
      if (!acc[record.staffid]) {
        acc[record.staffid] = {};
      }
      acc[record.staffid][dateKey] = record; // Store WFH data by staffID and date
      return acc;
    }, {});

    // Step 6: Loop through employees and assign them to each date in the date range
    employees.forEach(employee => {
      const staffID = employee.staff_id;

      dateRange.forEach(date => {
        if (wfhMap[staffID] && wfhMap[staffID][date]) {
          // If WFH record exists for this date, use that record
          const record = wfhMap[staffID][date];
          scheduleByDate[date].push({
            staff_id: employee.staff_id,
            staff_fname: employee.staff_fname,
            staff_lname: employee.staff_lname,
            dept: employee.dept,
            reporting_manager: employee.reporting_manager,
            wfh_date: record.wfh_date,
            schedule_status: record.timeslot === 'FD' ? 'Full-Day' : record.timeslot,
            status: record.status,
            recurring: record.recurring,
            request_reason: record.request_reason,
            requestDate: record.requestDate,
            reject_reason: record.reject_reason
          });
        } else {
          // Default status to 'In Office' when no WFH record exists
          scheduleByDate[date].push({
            staff_id: employee.staff_id,
            staff_fname: employee.staff_fname,
            staff_lname: employee.staff_lname,
            dept: employee.dept,
            reporting_manager: employee.reporting_manager,
            wfh_date: null, // No WFH record, so wfh_date is null
            schedule_status: 'Office',
            status: 'Office',
            recurring: null,
            request_reason: null,
            requestDate: null,
            reject_reason: null
          });
        }
      });
    });

    // Step 7: Return the team schedule grouped by date
    res.status(200).json({
      total_team_members: employees.length,
      team_schedule: scheduleByDate // Grouped by date
    });

  } catch (error) {
    console.error('Error fetching team schedule by manager:', error);
    res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});




// Route to get staff schedule by department(s) and date range
router.get('/schedule/:departments/:start_date/:end_date', async (req, res) => {
  const { departments, start_date, end_date } = req.params;
  const departmentList = departments.split(',');

  try {
    console.log('Fetching schedule for departments:', departmentList);
    console.log('Date range:', start_date, 'to', end_date);

    // Step 1: Initialize a dictionary with all unique dates between start_date and end_date
    const dateRange = generateDateRange(start_date, end_date);
    console.log('Generated date range:', dateRange); // Log date range to ensure it is correct
    const scheduleByDate = {};
    dateRange.forEach(date => {
      scheduleByDate[date] = [];  // Initialize each date with an empty array
    });

    // Step 2: Query to get all employees in the selected departments
    const employeesResult = await client.query(
      `SELECT staff_id, staff_fname, staff_lname, dept, reporting_manager
       FROM employee
       WHERE dept = ANY($1::text[])`,
      [departmentList]
    );
    const employees = employeesResult.rows;
    console.log('Fetched employees:', employees.length); // Log number of employees fetched

    // Step 3: Query to get WFH records within the date range for employees in the departments
    const wfhRecordsResult = await client.query(
      `SELECT staffid, wfh_date, timeslot, status, recurring, request_reason, requestdate, reject_reason
       FROM wfh_records
       WHERE wfh_date BETWEEN $2 AND $3
       AND status = 'Approved'
       AND staffid IN (SELECT staff_id FROM employee WHERE dept = ANY($1::text[]))`,
      [departmentList, start_date, end_date]
    );
    const wfhRecords = wfhRecordsResult.rows;
    console.log('Fetched WFH records:', wfhRecords.length); // Log number of WFH records fetched

    // Step 4: Build a map of WFH records keyed by staffID and wfh_date
    const wfhMap = wfhRecords.reduce((acc, record) => {
      const dateKey = dayjs(record.wfh_date).format('YYYY-MM-DD');
      if (!acc[record.staffid]) {
        acc[record.staffid] = {};
      }
      acc[record.staffid][dateKey] = record; // Store WFH data by staffID and date
      return acc;
    }, {});
    
    // Log the constructed WFH map for staff_id 140918 (for debugging purposes)
    console.log('wfhMap for 140918:', wfhMap[140918]);  // Log this to verify the entry for staff_id: 140918

    // Step 5: Loop through employees and assign them to each date in the date range
    employees.forEach(employee => {
      const staffID = employee.staff_id;

      dateRange.forEach(date => {
        if (wfhMap[staffID] && wfhMap[staffID][date]) {
          // If WFH record exists for this date, use that record
          const record = wfhMap[staffID][date];
          scheduleByDate[date].push({
            staff_id: employee.staff_id,
            staff_fname: employee.staff_fname,
            staff_lname: employee.staff_lname,
            dept: employee.dept,
            reporting_manager: employee.reporting_manager,
            wfh_date: record.wfh_date,
            schedule_status: record.timeslot === 'FD' ? 'Full-Day' : record.timeslot,
            status: record.status,
            recurring: record.recurring,
            request_reason: record.request_reason,
            requestDate: record.requestDate,
            reject_reason: record.reject_reason
          });
        } else {
          // If no WFH record exists, assign status as 'In Office'
          scheduleByDate[date].push({
            staff_id: employee.staff_id,
            staff_fname: employee.staff_fname,
            staff_lname: employee.staff_lname,
            dept: employee.dept,
            reporting_manager: employee.reporting_manager,
            wfh_date: null, // No WFH record, so wfh_date is null
            schedule_status: 'Office',
            status: 'Office',
            recurring: null,
            request_reason: null,
            requestDate: null,
            reject_reason: null
          });
        }
      });
    });

    // Step 6: Query to count total employees in selected departments
    const employeeCountResult = await client.query(
      `SELECT dept, COUNT(*) AS total_employees 
       FROM employee
       WHERE dept = ANY($1::text[])
       GROUP BY dept`,
      [departmentList]
    );

    console.log('Total employee count per department:', employeeCountResult.rows);

    // Step 7: Return the final response with schedules nested by date
    res.status(200).json({
      total_staff: employees.length,
      staff_schedules: scheduleByDate, // Grouped by date
      total_employees: employeeCountResult.rows, // Count of employees in each department
      selected_start_date: start_date,
      selected_end_date: end_date
    });
    
    // Log the final schedule by date for 2024-09-06
    console.log('Final schedule for 2024-09-06:', scheduleByDate['2024-09-06']);  // Log this to verify the schedule for that date

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

    // Use sched_date directly as formatted in the frontend to avoid timezone shifts
    const formattedSchedDate = sched_date; 

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

    // Retrieve reporting manager ID for the staff
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

    if ((teamWfh + 1) / totalTeam > 0.5) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        message: 'WFH request denied. More than 50% of the team would be WFH on this date.',
      });
    }

    // Insert WFH request record with date-only formatted wfh_date
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

    // Log activity with "New Request"
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
    // Rollback transaction in case of error
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
      AND status IN ('Approved', 'Pending', 'Pending Withdrawal', 'Pending Change')
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
router.post('/withdraw_adhoc_wfh', async (req, res) => {
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
  const { recordID, new_wfh_date, reason, staff_id } = req.body;

  try {
    // Start a transaction to ensure atomicity
    await client.query('BEGIN');

    console.log(`Starting change request for recordID ${recordID} with new date ${new_wfh_date}`);

    // Fetch the current WFH record to get the current status and wfh_date
    const result = await client.query(
      `SELECT status, wfh_date FROM wfh_records WHERE recordID = $1`,
      [recordID]
    );

    if (result.rows.length === 0) {
      console.error(`No WFH record found for recordID ${recordID}`);
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'WFH request not found.' });
    }

    const currentStatus = result.rows[0].status;
    const currentWfhDate = new Date(result.rows[0].wfh_date);
    console.log(`Current status: ${currentStatus}, Current WFH date: ${currentWfhDate}`);

    if (currentStatus !== "Pending" && currentStatus !== "Approved") {
      console.error(`Invalid status for change: ${currentStatus}`);
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid request status for change.' });
    }

    // Ensure new_wfh_date is in the correct format and valid
    const formattedNewWfhDate = new Date(new_wfh_date);
    if (isNaN(formattedNewWfhDate.getTime()) || new_wfh_date.length !== 10) {
      console.error(`Invalid date format for new WFH date: ${new_wfh_date}`);
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid new WFH date provided. Use format YYYY-MM-DD.' });
    }

    const newStatus = currentStatus === "Pending" ? "Pending" : "Pending Change";
    console.log(`Updating WFH record status to ${newStatus} and date to ${new_wfh_date}`);

    // Update the wfh_records table with the new status and date
    const updateResult = await client.query(
      `UPDATE wfh_records 
       SET status = $1, wfh_date = $2 
       WHERE recordID = $3 
       RETURNING *`,
      [newStatus, new_wfh_date, recordID]
    );

    if (updateResult.rows.length === 0) {
      console.error(`Failed to update WFH record for recordID ${recordID}`);
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'WFH request not found or already changed.' });
    }

    const formattedCurrentWfhDateString = currentWfhDate.toISOString().split('T')[0];
    const activityLog = {
      Staff_id: staff_id,
      Action: newStatus === "Pending Change" ? "Pending Change" : "Changed",
      Reason: reason,
      CurrentWFHDate: formattedCurrentWfhDateString,
      NewWFHDate: new_wfh_date, // Using the exact date format as provided
    };

    await client.query(
      `INSERT INTO activitylog (recordID, activity) 
       VALUES ($1, $2)`,
      [recordID, JSON.stringify(activityLog)]
    );

    await client.query('COMMIT');
    console.log('Transaction committed successfully');

    const message = currentStatus === "Approved"
      ? 'Change request has been submitted to Reporting Manager for approval.'
      : 'WFH date changed successfully.';
    
    res.status(200).json({ message });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error changing WFH request:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});




router.post('/withdraw_recurring_request', async (req, res) => {
  const { requestId, date, reason, staff_id } = req.body;

  try {
    console.log('Request data:', req.body); // Log the request data

    // Start a transaction to ensure atomicity
    await client.query('BEGIN');

    console.log(`Processing withdrawal for date: ${date}`);

    // Convert the provided date to a UTC-only date string (without time component)
    const utcDate = new Date(date).toISOString().split('T')[0]; // Extract 'YYYY-MM-DD'
    console.log('Selected Date for Withdrawal (utcDate):', utcDate); // Log selected date

    // 1. Fetch the current request status and wfh_dates from recurring_request
    const result = await client.query(
      `SELECT status, wfh_dates FROM recurring_request WHERE requestid = $1`,
      [requestId]
    );

    if (result.rows.length === 0) {
      throw new Error(`No recurring request found for requestId ${requestId}`);
    }

    const { status, wfh_dates } = result.rows[0];

    console.log('Original wfh_dates from DB:', wfh_dates); // Log original dates

    // 2. Validate the current status for withdrawal
    if (status !== "Pending" && status !== "Approved") {
      throw new Error(`Invalid status for withdrawal: ${status}`);
    }

    // 3. Only modify the wfh_dates array if status is Pending
    if (status === "Pending") {
      const updatedDates = wfh_dates.filter(wfhDate => {
        const formattedWfhDate = new Date(wfhDate).toISOString().split('T')[0]; // Force UTC conversion
        console.log('Comparing wfhDate:', formattedWfhDate, 'with selected date:', utcDate); // Log comparison
        return formattedWfhDate !== utcDate;
      });

      console.log('Updated wfh_dates after filtering:', updatedDates); // Log updated dates after filtering

      // 4. Update the recurring_request table to remove the selected date from wfh_dates
      await client.query(
        `UPDATE recurring_request 
         SET wfh_dates = $1 
         WHERE requestid = $2`,
        [updatedDates, requestId]
      );
    }

    // 5. Update the wfh_records table for the selected date, adjusting for timezone if needed
    const newStatus = status === "Approved" ? "Pending Withdrawal" : "Withdrawn";

    // Adjust the selected date to the next day to account for timezone differences (e.g., UTC+8)
    const adjustedDate = new Date(date);
    adjustedDate.setDate(adjustedDate.getDate() + 1); // Move the date forward by 1 day
    const adjustedDateString = adjustedDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'

    const updateResult = await client.query(
      `UPDATE wfh_records 
       SET status = $1 
       WHERE requestid = $2 AND wfh_date::date = $3`,
      [newStatus, requestId, adjustedDateString]  // Use adjustedDateString in the query
    );

    if (updateResult.rowCount === 0) {
      throw new Error(`Failed to update status for WFH record with requestId ${requestId} and date ${adjustedDateString}`);
    }

    // 6. Insert the action into the activity log
    const activityLog = {
      Staff_id: staff_id,
      Action: newStatus,
      Reason: reason,
      Date: adjustedDateString,
    };

    await client.query(
      `INSERT INTO activitylog (requestid, activity) 
       VALUES ($1, $2)`,
      [requestId, JSON.stringify(activityLog)]
    );

    // Commit the transaction
    await client.query('COMMIT');

    const message = status === "Approved"
      ? `Withdrawal for the approved date ${adjustedDateString} is pending manager approval.`
      : `WFH request for the date ${adjustedDateString} has been withdrawn successfully.`;

    res.status(200).json({ message });

  } catch (error) {
    console.error('Error withdrawing recurring WFH request:', error.message);
    await client.query('ROLLBACK'); // Rollback in case of any errors
    res.status(500).json({ message: `Internal server error: ${error.message}` });
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


// Accept WFH request
router.patch('/accept/:recordID', async (req, res) => {
  const { recordID } = req.params;
  try {
      const result = await client.query(
          'UPDATE wfh_records SET status = $1 WHERE recordid = $2 RETURNING *',
          ['Approved', recordID]
      );
      if (result.rowCount === 0) {
          return res.status(404).json({ message: 'No records found for the given record ID.' });
      }
      res.status(200).json({ message: 'Status updated to approved.', record: result.rows[0] });
  } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});

// Reject WFH request
router.patch('/reject/:id', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
      const result = await client.query(
          'UPDATE wfh_records SET status = $1, reject_reason = $2 WHERE recordid = $3 RETURNING *',
          ['Rejected', reason, id]
      );
      if (result.rowCount === 0) {
          return res.status(404).json({ message: 'No records found for the given record ID.' });
      }

        // Log the rejection action (optional)
        await client.query(
          `INSERT INTO activitylog (requestid, activity)
          VALUES ($1, $2);`, // Use parameterized values to prevent SQL injection
          [requestid, `Rejected Recurring Request: ${reason}`]
      );

      res.status(200).json({ message: 'Rejection reason updated successfully.', record: result.rows[0] });
  } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});


// Pending Withdrawal (Accept) of WFH request
router.patch('/acceptwithdrawal/:recordID', async (req, res) => {
  const { recordID } = req.params; // Extract the record ID from request parameters
  try {
      const result = await client.query(
          'UPDATE wfh_records SET status = $1 WHERE recordid = $2 RETURNING *',
          ['Withdrawn', recordID] // Update the status to 'Withdrawn'
      );
      if (result.rowCount === 0) {
          return res.status(404).json({ message: 'No records found for the given record ID.' });
      }
      res.status(200).json({ message: 'Status updated to Withdrawn.', record: result.rows[0] });
  } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});

// Cancelling Accepted Request
router.patch('/cancel/:recordID', async (req, res) => {
  const { recordID } = req.params; // Extract the record ID from request parameters
  try {
      const result = await client.query(
          'UPDATE wfh_records SET status = $1 WHERE recordid = $2 RETURNING *',
          ['Rejected', recordID] // Update the status to 'Withdrawn'
      );
      if (result.rowCount === 0) {
          return res.status(404).json({ message: 'No records found for the given record ID.' });
      }
      res.status(200).json({ message: 'Status updated to Rejected.', record: result.rows[0] });
  } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});

// Pending Withdrawal (Reject) of WFH request
router.patch('/reject_withdrawal/:recordID', async (req, res) => {
  const { recordID } = req.params;
  const { reason } = req.body;

  try {
    const result = await client.query(
      'UPDATE wfh_records SET status = $1, reject_reason = $3 WHERE recordid = $2 AND status = $4 RETURNING *',
      ['Approved', recordID, reason, 'Pending Withdrawal'] // Update the status to 'Approved'
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No records found for the given record ID.' });
    }

    res.status(200).json({ message: 'Status updated to Approved.', record: result.rows[0] });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
});

module.exports = router;
