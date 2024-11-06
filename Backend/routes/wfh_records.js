const express = require('express');
const router = express.Router();
const client = require('../databasepg');
const dayjs = require('dayjs');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore'); 
dayjs.extend(isSameOrBefore);

// Import functions from employee.js
const map_team_hierarchy = require('../routes/employee').map_team_hierarchy;
const immediate_team = require('../routes/employee').getImmediateTeam;

// calculate percentage in office [team level]
async function calculateInOfficePercentage(staffId, dates, wfhRecords) {
  try {
      // Step 1: Retrieve immediate team members of the given staff
      const teamMembers = await immediate_team(staffId);
      const teamMemberIds = teamMembers.map(member => member.staff_id);

      // Initialize an object to store the in-office percentage for each date and timeslot
      const inOfficePercentages = {};

      // Step 2: Loop over each date in the dates array
      for (const date of dates) {
          inOfficePercentages[date] = {};

          // Step 3: Filter WFH records for each timeslot (AM, PM, FD)
          const timeslots = ['AM', 'PM', 'FD'];
          for (const timeslot of timeslots) {
              // Filter WFH records by team member, date, and timeslot
              const wfhRecordsForDateAndSlot = wfhRecords.filter(record =>
                  teamMemberIds.includes(record.staffID) &&
                  record.wfh_date === date &&
                  record.timeslot === timeslot &&
                  record.status === 'Approved'
              );

              // Count total team members and those working from home
              const totalTeamCount = teamMemberIds.length;
              const wfhCount = wfhRecordsForDateAndSlot.length;

              // Calculate in-office percentage
              const inOfficePercentage = ((totalTeamCount - wfhCount) / totalTeamCount) * 100;

              // Store the result in the output object
              inOfficePercentages[date][timeslot] = inOfficePercentage;
          }
      }

      return inOfficePercentages;
  } catch (error) {
      console.error('Error calculating in-office percentage:', error);
      return {};
  }
}

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

// Did not test this //
// Route to get approved staff schedule for a team based on Reporting Manager ID and date
router.get('/team-schedule-v2/:manager_id/:start_date/:end_date', async (req, res) => {
  const { manager_id, start_date, end_date } = req.params;

  try {
      const dateRange = generateDateRange(start_date, end_date);
      let staff_schedules = []
        for(date of dateRange){
          const scheduleResult = await client.query(
            `
            WITH ranked_data AS (
              SELECT
                e.staff_id, 
                e.staff_fname, 
                e.staff_lname, 
                e.dept, 
                e.reporting_manager, 
                COALESCE(wr.wfh_date, $2) AS wfh_date,
                COALESCE(wr.timeslot, 'Office') AS timeslot,
                CASE
                  WHEN COALESCE(wr.status, 'Office') IN ('Pending Change', 'Withdrawn', 'Pending', 'Rejected') THEN 'Office'
                  ELSE COALESCE(wr.status, 'Office')
                END AS status,
                        CASE
                  WHEN COALESCE(wr.status, 'Office') IN ('Pending Change', 'Withdrawn', 'Pending', 'Rejected') THEN 'Office'
                            WHEN wr.timeslot = 'FD' THEN 'Full-Day'
                            WHEN wr.timeslot = 'AM' THEN 'AM'
                            WHEN wr.timeslot = 'PM' THEN 'PM'
                            ELSE COALESCE(wr.timeslot, 'Office')
                        END AS schedule_status,
                        wr.recurring,
                        wr.request_reason,
                        wr.requestDate,
                        wr.reject_reason,
                ROW_NUMBER() OVER (PARTITION BY e.staff_id ORDER BY wr.wfh_date DESC) AS rn
                    FROM 
                        Employee e
                    LEFT JOIN 
                        wfh_records wr ON e.staff_id = wr.staffID AND wr.wfh_date = $2
                    WHERE 
                        e.reporting_manager = $1
                        AND e.staff_id <> $1
                AND (COALESCE(wr.status, 'Office') = 'Office' 
                      OR COALESCE(wr.status, 'Office') = 'Approved'
                      OR COALESCE(wr.status, 'Office') IN ('Pending Change', 'Withdrawn', 'Pending', 'Rejected'))
            )
            SELECT
                staff_id, 
                staff_fname, 
                staff_lname, 
                dept, 
                reporting_manager, 
                wfh_date, 
                timeslot, 
                status, 
                schedule_status, 
                recurring, 
                request_reason, 
                requestDate, 
                reject_reason
            FROM ranked_data
            WHERE rn = 1;
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


// Did not test this //
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

// Did not test this //
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
    
    console.log('Constructed WFH map:', wfhMap); // Debugging purposes

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

    // Step 6: Calculate in-office percentage for each date and timeslot
    const inOfficePercentages = {};
    for (const date of dateRange) {
      inOfficePercentages[date] = {};
      const timeslots = ['AM', 'PM', 'FD'];

      for (const timeslot of timeslots) {
        // Filter WFH records by date and timeslot
        const wfhRecordsForDateAndSlot = wfhRecords.filter(record =>
          dayjs(record.wfh_date).format('YYYY-MM-DD') === date &&
          record.timeslot === timeslot &&
          record.status === 'Approved'
        );

        // Calculate total team count and WFH count
        const totalTeamCount = employees.length;
        const wfhCount = wfhRecordsForDateAndSlot.length;

        // Calculate in-office percentage
        const inOfficePercentage = ((totalTeamCount - wfhCount) / totalTeamCount) * 100;
        inOfficePercentages[date][timeslot] = inOfficePercentage;
      }
    }

    console.log('Calculated in-office percentages:', inOfficePercentages); // Log calculated percentages

    // Step 7: Query to count total employees in selected departments
    const employeeCountResult = await client.query(
      `SELECT dept, COUNT(*) AS total_employees 
       FROM employee
       WHERE dept = ANY($1::text[])
       GROUP BY dept`,
      [departmentList]
    );

    console.log('Total employee count per department:', employeeCountResult.rows);

    // Step 8: Return the final response with schedules and in-office percentages
    res.status(200).json({
      total_staff: employees.length,
      staff_schedules: scheduleByDate, // Grouped by date
      in_office_percentages: inOfficePercentages, // In-office percentages per date and timeslot
      total_employees: employeeCountResult.rows, // Count of employees in each department
      selected_start_date: start_date,
      selected_end_date: end_date
    });
    
  } catch (error) {
    console.error('Error fetching staff schedule by department:', error);
    res.status(500).json({ message: 'Internal server error. ' + error.message });
  }
});


// Failed Test (Refer to Test Case 13) //
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

    // Set status to 'Approved' for staff_id 130002, otherwise 'Pending'
    let status = staff_id === 130002 ? 'Approved' : 'Pending';

   
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

    const activityLog = {
      Action: 'New Adhoc Request'
    }
    // Log activity with "New Request"
    await client.query(
      `
      INSERT INTO ActivityLog (recordID, activity)
      VALUES ($1, $2);
      `,
      [recordID, JSON.stringify(activityLog)]
    );

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({ message: 'AdHoc WFH request submitted successfully', recordID });
  } catch (error) {
    // Rollback transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error submitting WFH request:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


// Get dates where approving an additional WFH request would exceed 50% WFH rule
router.get('/wfh_50%_teamrule/:staffid', async (req, res) => {
  const staffId = req.params.staffid;

  try {
    // Get reporting manager for the staff member
    const managerResult = await client.query(
      `SELECT Reporting_Manager FROM Employee WHERE Staff_ID = $1`,
      [staffId]
    );

    if (managerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Staff ID not found.' });
    }

    const reportingManagerId = managerResult.rows[0].reporting_manager;

    // Get total team count under the same reporting manager
    const totalTeamResult = await client.query(
      `SELECT COUNT(*) AS total_team FROM Employee WHERE Reporting_Manager = $1 OR Staff_ID = $1`,
      [reportingManagerId]
    );
    const totalTeam = parseInt(totalTeamResult.rows[0].total_team, 10);

    // Find dates where approving one more WFH request would exceed 50%
    const exceedingDatesResult = await client.query(
      `
      SELECT wfh_date, COUNT(*) AS current_team_wfh
      FROM wfh_records
      WHERE status = 'Approved'
      AND staffID IN (
        SELECT Staff_ID FROM Employee WHERE Reporting_Manager = $1 OR Staff_ID = $1
      )
      GROUP BY wfh_date
      HAVING (COUNT(*) + 1) * 1.0 / $2 > 0.5;
      `,
      [reportingManagerId, totalTeam]
    );

    // Map the results to a list of dates
    const exceedingDates = exceedingDatesResult.rows.map(row => row.wfh_date);
    res.status(200).json(exceedingDates);
  } catch (error) {
    console.error('Error fetching potential exceeding WFH dates:', error);
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


// Failed Test (Refer to Test Case 4)
// Staff Withdraw an ad-hoc WFH request
router.post('/withdraw_adhoc_wfh', async (req, res) => {
  const { recordID, reason, staff_id } = req.body;

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

    // Determine new status based on the current status and staff ID
    let newStatus;
    if (staff_id === 130002) {
      // If the staff ID is 130002, set status directly to "Withdrawn"
      newStatus = "Withdrawn";
    } else {
      // Otherwise, set to "Pending Withdrawal" if currently "Approved", or directly "Withdrawn" if "Pending"
      newStatus = currentStatus === "Approved" ? "Pending Withdrawal" : "Withdrawn";
    }

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
      Action: newStatus,
      Reason: reason,
    };

    await client.query(
      `INSERT INTO activitylog (recordID, activity) 
       VALUES ($1, $2)`,
      [recordID, JSON.stringify(activityLog)]
    );

    // Commit the transaction
    await client.query('COMMIT');

    // Send a different response message based on the original status
    if (newStatus === "Pending Withdrawal") {
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
  console.log(new_wfh_date);

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

    let newStatus;
    if (staff_id === 130002) {
      newStatus = "Approved";
    } else {
      newStatus = currentStatus === "Pending" ? "Pending" : "Pending Change";
    }

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

    let message;

    if (staff_id === 130002 && newStatus === "Approved") {
      message = 'Change request approved.';
    } else if (currentStatus === "Pending") {
      message = 'WFH date changed successfully.';
    } else {
      message = 'Change request has been submitted to Reporting Manager for approval.';
    }

    
    res.status(200).json({ message });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error changing WFH request:', error);
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

      // Log the rejection action (using correct variable)
      await client.query(
          `INSERT INTO activitylog (recordID, activity)
          VALUES ($1, $2);`,
          [id, `Rejected Recurring Request: ${reason}`]
      );
      res.status(200).json({
        message: 'Rejection reason updated successfully.',
        record: result.rows[0]
    });
      } catch (error) {
          console.error('Error rejecting WFH request:', error);
          res.status(500).json({ message: 'Internal server error. ' + error.message });
      }
});

// Endpoint to auto-reject old pending ad-hoc requests in wfh_records
router.patch('/auto-reject/:reason', async (req, res) => {
  const { reason } = req.params;

  try {
      await client.query('BEGIN');

      // Select old pending ad-hoc requests older than two months
      const result = await client.query(`
          SELECT * FROM wfh_records
          WHERE status = 'Pending' AND recurring = false AND wfh_date < NOW() - INTERVAL '2 months'
      `);

      if (result.rows.length === 0) {
          await client.query('COMMIT');
          return res.status(200).json({ message: 'No pending ad-hoc WFH requests to auto-reject.' });
      }

      const updatedRecords = [];

      // Update each old pending ad-hoc request in wfh_records
      const updatePromises = result.rows.map(async row => {
          // Update the status in wfh_records to 'Rejected'
          const updateResult = await client.query(`
              UPDATE wfh_records
              SET status = 'Rejected', reject_reason = $2
              WHERE recordID = $1
              RETURNING *;
          `, [row.recordid, reason]);

          // Add updated record to response data
          updatedRecords.push(updateResult.rows[0]);

          // Log the action in ActivityLog
          await client.query(`
              INSERT INTO activitylog (recordid, activity, timestamp)
              VALUES ($1, $2, NOW())
          `, [row.recordid, `Auto-rejected ad-hoc WFH request: ${reason}`]);
      });

      await Promise.all(updatePromises);
      await client.query('COMMIT');

      res.status(200).json({
          message: 'Old pending ad-hoc WFH requests auto-rejected successfully',
          updatedRecords: updatedRecords
      });
  } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error auto-rejecting ad-hoc WFH requests:', error);
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

// route to apply recurring change - wfh_records (staff side)
router.patch('/change/:requestid', async (req, res) => {
  const { requestid } = req.params;
  const { selected_date, actual_wfh_date, staff_id } = req.body;

  console.log("Received request to modify wfh_records for ID:", requestid);
  console.log("Update body:", req.body);

  // Validate input
  if (!selected_date || !actual_wfh_date) {
      return res.status(400).json({ message: 'Invalid input: selected_date and actual_wfh_date are required.' });
  }

  try {
      // Update the wfh_date in the wfh_records table
      const result = await client.query(`
          UPDATE wfh_records
          SET wfh_date = $1, status = 'Pending Change'
          WHERE requestid = $2 AND wfh_date = $3
          RETURNING *
      `, [selected_date, requestid, actual_wfh_date]);

      // Check if any rows were affected
      if (result.rowCount === 0) {
          console.log("No records found to update for the given request ID.");
          return res.status(404).json({ message: 'No records found to update' });
      }

      console.log("Update successful:", result.rows); // Log the updated records

        if (Number(staff_id) === 130002) { // Ensure staff_id is treated as a number
          // Start transaction
          await client.query('BEGIN');

          // Immediately approve for staff 130002
          await client.query(`
              UPDATE wfh_records 
              SET status = 'Approved' 
              WHERE wfh_date = $1 AND requestid = $2
          `, [selected_date, requestid]);

          // Commit the transaction
          await client.query('COMMIT');
          console.log("WFH Record approved directly for Jack Sim");

          // Send success response for 130002 staff
          return res.status(200).json({ message: 'WFH Record updated and approved successfully.' });
      }

      // Send success response
      res.status(200).json({ message: 'WFH records updated successfully', records: result.rows });
  } catch (error) {
      console.error('Error updating wfh_records:', error);
      res.status(500).json({ message: 'Internal server error.' });
  }
});


module.exports = router;
module.exports.calculateInOfficePercentage=calculateInOfficePercentage;  

