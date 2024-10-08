const express = require('express');
const router = express.Router();
const client = require('../databasepg');

// Get all recurring requests
router.get('/', async (req, res) => {
    try{
        const result = await client.query(`
            SELECT * FROM recurring_request
        `);
        console.log(result.rows)
        res.status(200).json(result.rows)
    }catch(error){
        console.error('Error retreiving all recurring_request:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

//submit recurring request
router.post('/submit', async (req, res) => {
    const { staff_id, start_date, end_date, day_of_week, request_reason, timeslot } = req.body;

    // Validate required fields
    if (!staff_id || !start_date || !end_date || !day_of_week || !request_reason || !timeslot) {
        return res.status(400).json({ message: 'Staff ID, start date, end date, day of week, request reason, and timeslot are required.' });
    }

    // Check if the day_of_week is valid (1-5)
    if (day_of_week < 1 || day_of_week > 5) {
        return res.status(400).json({ message: 'Day of week must be between 1 (Monday) and 5 (Friday).' });
    }

    // Check if the timeslot is valid
    if (!['AM', 'PM', 'FD'].includes(timeslot)) {
        return res.status(400).json({ message: 'Timeslot must be either AM, PM, or FD (Full Day).' });
    }

    // Calculate wfh_dates
    const wfh_dates = [];
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const targetDay = (day_of_week % 7); // Convert 1-5 to 0-4 (Monday to Friday)

    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        if (date.getDay() === targetDay) {
            wfh_dates.push(date.toISOString().split('T')[0]); // Store date as YYYY-MM-DD
        }
    }

    try {
        // Fetch existing dates from recurring_request and wfh_records tables
        const existingDatesResult = await client.query(`
            SELECT unnest(wfh_dates) AS date FROM recurring_request WHERE staff_id = $1
            UNION ALL
            SELECT wfh_date FROM wfh_records WHERE staffid = $1`,
            [staff_id]
        );

        // Convert existing dates to a Set
        const existingDates = new Set(existingDatesResult.rows.map(row => {
            return row.date.toISOString ? row.date.toLocaleDateString('en-CA').split('T')[0] : row.date; // Convert to string format if necessary
        }));
        
        console.log('Existing Dates:', Array.from(existingDates)); // Debugging: Log existing dates
        console.log('Calculated wfh_dates:', wfh_dates); // Debugging: Log calculated wfh_dates

        // Check for overlaps

        const overlaps = wfh_dates.some(date => existingDates.has(date));
        if (overlaps) {
            console.log('One or more requested WFH dates overlap with existing dates.');
        } else {
            console.log('No overlaps found.');
        }
        if (overlaps) {
            return res.status(409).json({ message: `The following requested WFH dates overlap with existing dates` });
            console.log("There is overlap");
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
            // Check if approving this request would cause more than 50% of the team to be WFH
        const totalTeamResult = await client.query(
            `SELECT COUNT(*) AS total_team FROM Employee WHERE Reporting_Manager = $1 AND Staff_ID != $1`,
            [reportingManagerId]
        );
        const totalTeam = parseInt(totalTeamResult.rows[0].total_team, 10) + 1;
    
        for (const date of wfh_dates) {
            console.log(date); // Prints each date
        }

        const teamWfhResult = await client.query(
            `
            SELECT COUNT(*) AS team_wfh FROM wfh_records 
            WHERE wfh_date = $1 AND status = 'Approved' AND staffID IN (
            SELECT Staff_ID FROM Employee WHERE Reporting_Manager = $2 OR Staff_ID = $2
            )
            `,
            [wfh_dates, reportingManagerId]
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

        // Insert into recurring_request table
        const result = await client.query(
            `
            INSERT INTO recurring_request (staff_id, start_date, end_date, day_of_week, request_reason, timeslot, wfh_dates, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
            RETURNING requestID;
            `,
            [staff_id, start_date, end_date, day_of_week, request_reason, timeslot, wfh_dates]
        );

        const requestID = result.rows[0].requestID;

        res.status(201).json({ message: 'Recurring WFH request submitted successfully', requestID });
    } catch (error) {
        console.error('Error submitting recurring WFH request:', error);
        res.status(500).json({ message: 'Please fill up the form. ' + error.message });
    }
});


// Delete recurring WFH request
router.delete('/:requestID', async (req, res) => {
    const { requestID } = req.params;

    // Validate requestID
    if (!requestID) {
        return res.status(400).json({ message: 'Request ID is required.' });
    }

    try {
        // Delete from recurring_request table
        const result = await client.query(
            `
            DELETE FROM recurring_request
            WHERE requestID = $1
            RETURNING requestID;
            `,
            [requestID]
        );

        // Check if any rows were deleted
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        res.status(200).json({ message: 'Recurring WFH request deleted successfully', requestID });
    } catch (error) {
        console.error('Error deleting recurring WFH request:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

router.post('/approve/:requestid', async (req, res) => {
    const { requestid } = req.params;

    try {
        await client.query('BEGIN');

        // Step 1: Update the recurring_request status to 'Approved'
        const updateResult = await client.query(
            `UPDATE recurring_request
             SET status = 'Approved'
             WHERE requestid = $1
             RETURNING staff_id, wfh_dates, timeslot, request_reason;`,
            [requestid]
        );

        // Check if the request was found
        if (updateResult.rowCount === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const { status, staff_id, wfh_dates, timeslot, request_reason } = updateResult.rows[0];

        if (status === 'Approved') {
            return res.status(400).json({ message: 'Request has already been approved.' });
        }

        // Step 2: Insert into wfh_records for each date in wfh_dates
        await client.query(
            `INSERT INTO wfh_records (staffid, wfh_date, recurring, timeslot, status, request_reason, requestid, requestdate)
             SELECT $1, unnest($2::DATE[]) AS wfh_date, TRUE, $3, 'Approved', $4, $5, CURRENT_DATE;`,
            [staff_id, wfh_dates, timeslot, request_reason, requestid]
        );

        await client.query('COMMIT');

        // Send a success response
        res.status(200).json({ message: 'Request approved and WFH records created successfully.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving request:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});



module.exports = router;