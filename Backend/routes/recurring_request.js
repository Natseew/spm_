const express = require('express');
const router = express.Router();
const client = require('../databasepg');
const calculateInOfficePercentage = require('../routes/wfh_records').calculateInOfficePercentage;
const { addMonths, subMonths } = require('date-fns');

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
    const start_Date = new Date(start_date);
    const end_Date = new Date(end_date);
    const currentDate = new Date();

    // Check if the start_date is more than 2 months before the current date
    const twoMonthsAgo = subMonths(currentDate, 2);
    if (start_Date < twoMonthsAgo) {
        return res.status(400).json({ message: 'Start date cannot be more than 2 months before the current date.' });
    }

    // Check if the end_date is more than 3 months after the current date
    const threeMonthsFromNow = addMonths(currentDate, 3);
    if (end_Date > threeMonthsFromNow) {
        return res.status(400).json({ message: 'End date cannot be more than 3 months after the current date.' });
    }

    // Calculate wfh_dates
    const wfh_dates = [];
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const targetDay = (day_of_week % 7); // Convert 1-5 to 0-4 (Monday to Friday)
    const status = (staff_id === 130002) ? 'Approved' : 'Pending';
    console.log("Staff ID:", staff_id);
    console.log("Status Assigned:", status)
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        if (date.getDay() === targetDay) {
            wfh_dates.push(date.toISOString().split('T')[0]); // Store date as YYYY-MM-DD
        }
    }
    try {
        const existingDatesResult = await client.query(
            `SELECT wfh_date 
             FROM wfh_records 
             WHERE staffid = $1 
             AND status IN ('Approved', 'Pending', 'Pending Change', 'Pending Withdrawal');`,
            [staff_id]
        );
        // Convert existing dates to a Set
        const existingDates = new Set(existingDatesResult.rows.map(row => {
            return row.wfh_date.toISOString ? row.wfh_date.toLocaleDateString('en-CA').split('T')[0] : row.date; // Convert to string format if necessary
        }));

        const sortedExistingDates = Array.from(existingDates).sort((a, b) => new Date(a) - new Date(b));
        
        console.log('Sorted Existing Dates:', Array.from(sortedExistingDates)); // Debugging: Log existing dates
        console.log('Calculated wfh_dates:', wfh_dates); // Debugging: Log calculated wfh_dates
        // Check for overlaps
        const overlaps = wfh_dates.some(date => existingDates.has(date));
        if (overlaps) {
            console.log('One or more requested WFH dates overlap with existing dates.');
        } else {
            console.log('No overlaps found.');
        }
        if (overlaps) {
            console.log("There is overlap");
            return res.status(409).json({ message: `The following requested WFH dates overlap with existing dates` });
        }
        if (wfh_dates.length === 0){
            console.log("Actual WFH dates is empty");
            return res.status(409).json({ message: 'Your start date cannot be after your end date / The day you selected is not in the date range'});
        }
        // Insert into recurring_request table
        const result = await client.query(
            `
            INSERT INTO recurring_request (staff_id, start_date, end_date, day_of_week, request_reason, timeslot, wfh_dates, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING requestID;
            `,
            [staff_id, start_date, end_date, day_of_week, request_reason, timeslot, wfh_dates, status]
        );
        const request_id = result.rows[0].requestid;
        console.log('Inserted Request ID:', request_id);
        await client.query(
            `
            INSERT INTO activitylog (requestid, activity)
            VALUES ($1, 'New Recurring Request');
            `,
            [request_id]
        );
        await client.query(
            `INSERT INTO wfh_records (staffid, wfh_date, recurring, timeslot, status, request_reason, requestid, requestdate)
             SELECT $1, unnest($2::DATE[]) AS wfh_date, TRUE, $3, $6, $4, $5, CURRENT_DATE;`,
            [staff_id, wfh_dates, timeslot, request_reason, request_id, status]
        );
        const requestID = result.rows[0].requestID;
        res.status(201).json({ message: 'Recurring WFH request submitted successfully', requestID });
    } catch (error) {
        console.error('Error submitting recurring WFH request:', error);
        res.status(500).json({ message: 'Please fill up the form again. ' + error.message });
    }
});

// Get recurring requests by employee IDs with WFH records
router.get('/by-employee-ids', async (req, res) => {
    try {
        const employeeIds = req.query.employeeIds?.split(',');

        if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
            return res.status(400).json({ message: 'Must provide an array of employee IDs.' });
        }

        const placeholders = employeeIds.map((_, index) => `$${index + 1}`).join(', ');
        const recurringQuery = `SELECT * FROM recurring_request WHERE staff_id IN (${placeholders})`;

        const recurringResult = await client.query(recurringQuery, employeeIds);
        const recurring_request_data = recurringResult.rows;

        // Fetch team-wide WFH records to calculate in-office percentages
        const allWfhRecordsResult = await client.query(`
            SELECT staffID, wfh_date, timeslot, status 
            FROM wfh_records 
            WHERE status = 'Approved' AND staffID = ANY($1::int[])
        `, [employeeIds]);
        const allWfhRecords = allWfhRecordsResult.rows;

        // Map recurring requests with WFH records and in-office percentages
        const combinedDataPromises = recurring_request_data.map(async (recurringRequest) => {
            const wfhQuery = `SELECT wfh_date, timeslot, status FROM wfh_records WHERE requestID = $1`;
            const wfhResult = await client.query(wfhQuery, [recurringRequest.requestid]);

            const wfhRecords = wfhResult.rows;

            // Calculate in-office percentages for each date and timeslot in this request's WFH records
            const dates = wfhRecords.map(record => record.wfh_date);
            const inOfficePercentages = await calculateInOfficePercentage(recurringRequest.staff_id, dates, allWfhRecords);

            // Prepare inOfficePercentage as a separate key-value pair, with date and timeslot information
            const inOfficePercentageRecords = wfhRecords.map(record => ({
                wfh_date: record.wfh_date,
                timeslot: record.timeslot,
                inOfficePercentage: inOfficePercentages[record.wfh_date]?.[record.timeslot] || 100 // Default to 100% if no data
            }));

            return {
                ...recurringRequest, // Preserve all fields in recurring_request
                wfh_records: wfhRecords, // Keep the original wfh_records array
                inOfficePercentage: inOfficePercentageRecords // Add a new inOfficePercentage array
            };
        });

        const combinedData = await Promise.all(combinedDataPromises);
        res.status(200).json(combinedData);
        console.log(combinedData);
    } catch (error) {
        console.error('Error retrieving recurring requests by employee IDs:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// Manager approve recurring request 
router.patch('/approve/:requestid', async (req, res) => {
    const { requestid } = req.params;
    const { override_50_percent } = req.body; // Extract override flag from request body

    try {
        await client.query('BEGIN');

        // Step 1: Retrieve the recurring request details including staff_id and wfh_dates
        const recurringRequestDetails = await client.query(`
            SELECT staffID, wfh_date, timeslot
            FROM wfh_records
            WHERE requestid = $1 AND status = 'Pending'
        `, [requestid]);

        if (recurringRequestDetails.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Recurring request not found or already approved' });
        }

        const { staffid, wfh_dates } = recurringRequestDetails.rows[0];
        const dates = recurringRequestDetails.rows.map(record => record.wfh_date);
        
        // Retrieve all WFH records for the team for the specified dates
        const allWfhRecords = await client.query(`
            SELECT * FROM wfh_records
            WHERE wfh_date = ANY($1) AND status = 'Approved'
        `, [dates]);

        // Step 2: Calculate the in-office percentage for each date and timeslot
        const inOfficePercentages = await calculateInOfficePercentage(staffid, dates, allWfhRecords.rows);
        console.log('In-office percentages:', inOfficePercentages);

        // Step 3: Check if in-office percentage is below 50% for any date-timeslot combination
        if (!override_50_percent) {
            for (const [date, timeslots] of Object.entries(inOfficePercentages)) {
                for (const [timeslot, percentage] of Object.entries(timeslots)) {
                    if (percentage < 50) {
                        await client.query('ROLLBACK');
                        return res.status(200).json({
                            message: 'In-office percentage is below 50% for certain dates or timeslots',
                            date,
                            timeslot,
                            inOfficePercentage: percentage,
                            requireOverride: true
                        });
                    }
                }
            }
        }

        // Step 4: Proceed with approval if override or percentages are above 50%
        // Update recurring request status to 'Approved'
        const recurringRequestResult = await client.query(`
            UPDATE recurring_request
            SET status = 'Approved'
            WHERE requestid = $1
            RETURNING *;
        `, [requestid]);

        // Log activity for approving the recurring request
        await client.query(`
            INSERT INTO ActivityLog (requestID, activity)
            VALUES ($1, $2)
        `, [requestid, 'Recurring request approved by manager']);

        // Update corresponding WFH records status to 'Approved'
        const wfhRecordsResult = await client.query(`
            UPDATE wfh_records
            SET status = 'Approved'
            WHERE requestid = $1
            RETURNING *;
        `, [requestid]);

        // Log activity for each WFH record approval
        for (const record of wfhRecordsResult.rows) {
            await client.query(`
                INSERT INTO ActivityLog (requestID, recordID, activity)
                VALUES ($1, $2, $3)
            `, [requestid, record.recordid, 'WFH record approved']);
        }

        await client.query('COMMIT');

        res.status(200).json({
            message: 'Request and corresponding WFH records approved successfully',
            recurringRequest: recurringRequestResult.rows[0],
            wfhRecords: wfhRecordsResult.rows
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving request:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Handle Accept Withdrawal Request
router.patch('/approvewithdrawal', async (req, res) => {
    const { requestID, withdrawalDates } = req.body;

    try {
        await client.query('BEGIN');

        // Check if there are any "Approved" records for this request
        const approvedRecordsResult = await client.query(`
            SELECT * FROM wfh_records
            WHERE requestid = $1 AND status = 'Approved';
        `, [requestID]);

        if (approvedRecordsResult.rowCount > 0) {
            // If there are approved records, only update specified dates to "Withdrawn" in wfh_records
            const wfhRecordsResult = await client.query(`
                UPDATE wfh_records
                SET status = 'Withdrawn'
                WHERE requestid = $1 AND wfh_date = ANY($2::date[])
                RETURNING *;
            `, [requestID, withdrawalDates]);

            // Remove the withdrawn dates from recurring_request's wfh_dates array
            await client.query(`
                UPDATE recurring_request
                SET wfh_dates = array(
                    SELECT unnest(wfh_dates)
                    EXCEPT SELECT unnest($1::date[])
                )
                WHERE requestid = $2
                RETURNING *;
            `, [withdrawalDates, requestID]);

            // Check if there are still any approved records after the update
            const remainingApprovedRecords = await client.query(`
                SELECT * FROM wfh_records
                WHERE requestid = $1 AND status = 'Approved';
            `, [requestID]);

            if (remainingApprovedRecords.rowCount > 0) {
                // If there are still approved records, set recurring_request status back to "Approved"
                await client.query(`
                    UPDATE recurring_request
                    SET status = 'Approved'
                    WHERE requestid = $1
                    RETURNING *;
                `, [requestID]);
            } else {
                // Otherwise, set recurring_request status to "Withdrawn"
                await client.query(`
                    UPDATE recurring_request
                    SET status = 'Withdrawn'
                    WHERE requestid = $1
                    RETURNING *;
                `, [requestID]);
            }

            await client.query('COMMIT');

            return res.status(200).json({
                message: 'Specified WFH dates withdrawn successfully',
                updatedRecords: wfhRecordsResult.rows
            });
        }

        // If no approved records are left at the start, update the recurring request status to "Withdrawn"
        const recurringRequestResult = await client.query(`
            UPDATE recurring_request
            SET status = 'Withdrawn'
            WHERE requestid = $1
            RETURNING *;
        `, [requestID]);

        // Update the specified wfh_records to "Withdrawn"
        const wfhRecordsResult = await client.query(`
            UPDATE wfh_records
            SET status = 'Withdrawn'
            WHERE requestid = $1 AND wfh_date = ANY($2::date[])
            RETURNING *;
        `, [requestID, withdrawalDates]);

        await client.query('COMMIT');

        res.status(200).json({
            message: 'Request and corresponding WFH records withdrawn successfully',
            recurringRequest: recurringRequestResult.rows[0],
            wfhRecords: wfhRecordsResult.rows
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing withdrawal:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Handle Reject Withdrawal Request
router.patch('/rejectwithdrawal', async (req, res) => {
    const { requestID, rejectDates } = req.body;

    if (!requestID || !Array.isArray(rejectDates) || rejectDates.length === 0) {
        return res.status(400).json({ message: 'Invalid request: requestID and rejectDates are required.' });
    }

    try {
        await client.query('BEGIN');

        // Update specified dates in wfh_records to "Approved"
        const updatedRecordsResult = await client.query(`
            UPDATE wfh_records
            SET status = 'Approved'
            WHERE requestid = $1 AND wfh_date = ANY($2::date[])
            RETURNING *;
        `, [requestID, rejectDates]);

        if (updatedRecordsResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'No matching records found for rejection.' });
        }

        // Check if there are any remaining "Pending Withdrawal" records for this requestID
        const remainingPendingWithdrawal = await client.query(`
            SELECT * FROM wfh_records
            WHERE requestid = $1 AND status = 'Pending Withdrawal';
        `, [requestID]);

        // If no records are still "Pending Withdrawal", update recurring_request status to "Approved"
        if (remainingPendingWithdrawal.rowCount === 0) {
            await client.query(`
                UPDATE recurring_request
                SET status = 'Approved'
                WHERE requestid = $1
                RETURNING *;
            `, [requestID]);
        }

        await client.query('COMMIT');

        res.status(200).json({
            message: 'Withdrawal rejection processed successfully',
            updatedRecords: updatedRecordsResult.rows,
            recurringRequestStatus: remainingPendingWithdrawal.rowCount === 0 ? 'Approved' : 'Pending Withdrawal'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing withdrawal rejection:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// cancel approved recurring request 
// Reject a recurring request
router.patch('/reject/:requestid', async (req, res) => {
    const { requestid } = req.params; 
    const { reason } = req.body; 

    // Validate input
    if (!reason || typeof reason !== 'string') {
        return res.status(400).json({ message: 'Invalid rejection reason' });
    }

    try {
        await client.query('BEGIN');
        // Update status in recurring request to 'Rejected'
        const recurringRequestResult = await client.query(`
            UPDATE recurring_request
            SET status = 'Rejected', reject_reason = $2
            WHERE requestid = $1
            RETURNING *;
        `, [requestid, reason]);

        if (recurringRequestResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Recurring request not found' });
        }

        // Update status in wfh_records to 'Rejected'
        const wfhRecordsResult = await client.query(`
            UPDATE wfh_records
            SET status = 'Rejected', reject_reason = $2
            WHERE requestid = $1
            RETURNING recordID;
        `, [requestid, reason]);

        // Log rejection in ActivityLog
        const logPromises = wfhRecordsResult.rows.map(({ recordid }) => {
            return client.query(`
                INSERT INTO activitylog (requestid, recordid, activity, timestamp)
                VALUES ($1, $2, $3, NOW())
                RETURNING *;
            `, [requestid, recordid, `Rejected recurring request: ${reason}`]);
        });
        
        const activityLogResults = await Promise.all(logPromises);

        await client.query('COMMIT');

        // Return success response with updated information
        res.status(200).json({
            message: 'Request and corresponding WFH records rejected successfully',
            recurringRequest: recurringRequestResult.rows[0],
            wfhRecords: wfhRecordsResult.rows,
            activityLogs: activityLogResults.map(result => result.rows[0])
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error rejecting recurring request:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// Endpoint to auto-reject old pending recurring requests and update corresponding wfh_records
router.patch('/auto-reject/:reason', async (req, res) => {
    const { reason } = req.params;

    try {
        await client.query('BEGIN');

        // Select old pending recurring requests older than two months
        const result = await client.query(`
            SELECT * FROM recurring_request
            WHERE status = 'Pending' AND start_date < NOW() - INTERVAL '2 months'
        `);

        if (result.rows.length === 0) {
            await client.query('COMMIT');
            return res.status(200).json({ message: 'No pending recurring requests to auto-reject.' });
        }

        const updatedRecurringRequests = [];
        const updatedWFHRecords = [];

        // Update each old pending recurring request and corresponding wfh_records
        const updatePromises = result.rows.map(async row => {
            // Update the status in recurring_request to 'Rejected'
            const recurringUpdateResult = await client.query(`
                UPDATE recurring_request
                SET status = 'Rejected', reject_reason = $2
                WHERE requestid = $1
                RETURNING *;
            `, [row.requestid, reason]);

            updatedRecurringRequests.push(recurringUpdateResult.rows[0]);

            // Update corresponding wfh_records entries to 'Rejected'
            const wfhRecordsResult = await client.query(`
                UPDATE wfh_records
                SET status = 'Rejected', reject_reason = $2
                WHERE requestID = $1
                RETURNING *;
            `, [row.requestid, reason]);

            updatedWFHRecords.push(...wfhRecordsResult.rows);

            // Log each rejected wfh_records entry in ActivityLog
            const logPromises = wfhRecordsResult.rows.map(({ recordid }) => {
                return client.query(`
                    INSERT INTO activitylog (requestid, recordid, activity, timestamp)
                    VALUES ($1, $2, $3, NOW())
                `, [row.requestid, recordid, `Auto-rejected recurring request: ${reason}`]);
            });

            await Promise.all(logPromises);
        });

        await Promise.all(updatePromises);
        await client.query('COMMIT');

        res.status(200).json({
            message: 'Old pending recurring requests and corresponding wfh_records auto-rejected successfully',
            updatedRecurringRequests: updatedRecurringRequests,
            updatedWFHRecords: updatedWFHRecords
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error auto-rejecting recurring requests:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});


// For staff: Withdraw a date from a recurring WFH request
router.post('/withdraw_recurring_wfh', async (req, res) => {
    const { requestID, wfhDate, reason, staff_id } = req.body;
    console.log("Requested WFH date to remove:", wfhDate);
  
    try {
        // Start a transaction to ensure atomicity
        await client.query('BEGIN');

          // Check if the staff_id is 130002 for instant withdrawal
          if (staff_id === 130002) {
            // Immediately set status to 'Withdrawn' in wfh_records for the specified date
            await client.query(
                `UPDATE wfh_records SET status = 'Withdrawn' WHERE wfh_date = $1 AND requestID = $2`,
                [wfhDate, requestID]
            );

            // Set the status to 'Withdrawn' in the recurring_request
            await client.query(
                `UPDATE recurring_request SET status = 'Withdrawn' WHERE requestID = $1`,
                [requestID]
            );

            // Insert a new activity log entry for the direct withdrawal
            await client.query(
                `INSERT INTO activitylog (requestID, activity) VALUES ($1, $2)`,
                [requestID, `Withdrawn - ${reason}`]
            );

            // Commit the transaction and respond
            await client.query('COMMIT');
            return res.status(200).json({ message: 'Request withdrawn successfully.' });
        }
  
        // Continue with the regular logic if staff_id is not 130002
        // 1. Fetch the recurring request to modify the wfh_dates array
        const result = await client.query(
            `SELECT wfh_dates, status FROM recurring_request WHERE requestID = $1`,
            [requestID]
        );
  
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Recurring request not found.' });
        }

  
        const { wfh_dates, status } = result.rows[0];
  
        // Adjust each date in wfh_dates to local time and format to YYYY-MM-DD for comparison
        const localizedWfhDates = wfh_dates.map(date => {
            const localDate = new Date(date);
            localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset()); // Adjust to local time
            return localDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD
        });

        console.log('Localized wfh_dates from DB:', localizedWfhDates);
        console.log('Date to remove:', wfhDate);

        // Check if the localized date to remove exists in the array
        if (!localizedWfhDates.includes(wfhDate)) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'WFH date not found in the request.' });
        }

        // Remove the date from the original wfh_dates array if it's found
        const updatedDates = wfh_dates.filter(date => {
            const localDate = new Date(date);
            localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
            return localDate.toISOString().split('T')[0] !== wfhDate;
        });
  
        // 2. If the request status is 'Pending', update the wfh_dates array in recurring_request
        if (status === 'Pending') {
            await client.query(
                `UPDATE recurring_request SET wfh_dates = $1 WHERE requestID = $2`,
                [updatedDates, requestID]
            );
  
            // 3. Update the corresponding wfh_record entry to 'Withdrawn' for the specified date
            await client.query(
                `UPDATE wfh_records SET status = 'Withdrawn' WHERE wfh_date = $1 AND requestID = $2`,
                [wfhDate, requestID]
            );

            // 4. Insert a new activity log entry for the withdrawal
            await client.query(
                `INSERT INTO activitylog (requestID, activity) VALUES ($1, $2)`,
                [requestID, `Withdrawn - ${reason}`]
            );
        }
  
        // 5. If the request status is 'Approved', update wfh_records and mark it as 'Pending Withdrawal'
        if (status === 'Approved') {
            // Update the status to 'Pending Withdrawal' for the corresponding date in wfh_records
            await client.query(
                `UPDATE wfh_records SET status = 'Pending Withdrawal' WHERE wfh_date = $1 AND requestID = $2`,
                [wfhDate, requestID]
            );
  
            // 6. Also update the status of the recurring request itself
            await client.query(
                `UPDATE recurring_request SET status = 'Pending Withdrawal' WHERE requestID = $1`,
                [requestID]
            );
  
            // 7. Insert a new activity log entry for the withdrawal
            await client.query(
                `INSERT INTO activitylog (requestID, activity) VALUES ($1, $2)`,
                [requestID, `Pending Withdrawal - ${reason}`]
            );
        }
  
        // Commit the transaction
        await client.query('COMMIT');
        res.status(200).json({ message: 'Withdrawal successfully processed.' });
    } catch (error) {
        // Rollback the transaction in case of errors
        await client.query('ROLLBACK');
        console.error('Error withdrawing WFH date from recurring request:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});




// Manager accepts pending change 
router.post('/accept-change', async (req, res) => {
    console.log("Request body:", req.body);

    let { requestID, changeDates } = req.body;

    // Validate requestID
    if (!requestID || isNaN(requestID)) {
        console.error('Invalid or missing requestID:', requestID);
        return res.status(400).json({ message: 'Invalid requestID' });
    }

    requestID = parseInt(requestID);  

    console.log(`Received request to accept change. RequestID: ${requestID}, changeDate: ${changeDates}`);

    try {
        await client.query('BEGIN');

        // 1. Update the status in wfh_records for the matching requestID and wfh_date
        console.log('Starting update for wfh_records...');
        const result = await client.query(
            `UPDATE wfh_records
             SET status = 'Approved'
             WHERE requestID = $1 AND wfh_date = $2
             RETURNING *;`,
            [requestID, changeDates]
        );

        if (result.rowCount === 0) {
            console.error('No matching record found.');
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Record not found.' });
        }

        // 2. Update the status in recurring_request to 'Approved' without modifying wfh_dates
        console.log('Updating status in recurring_request...');
        await client.query(
            `UPDATE recurring_request
             SET status = 'Approved'
             WHERE requestID = $1;`,
            [requestID]
        );

        // 3. Insert a new activity log entry for the change
        console.log('Inserting activity log...');
        await client.query(
            `INSERT INTO activitylog (requestID, activity)
             VALUES ($1, $2);`,
            [requestID, `Accepted Change`]
        );

        await client.query('COMMIT');
        console.log('Change request accepted successfully.');
        res.status(200).json({ message: 'Recurring change request accepted successfully.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error accepting recurring change request:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// Manager Reject pending change 
router.patch('/reject-change', async (req, res) => {
    const { requestID, changeDates, reject_reason } = req.body;

    if (!Array.isArray(changeDates) || changeDates.length === 0) {
        return res.status(400).json({ message: 'changeDates should be a non-empty array' });
    }

    const parsedRequestID = parseInt(requestID);
    const reasonText = reject_reason.toString();

    try {
        await client.query('BEGIN');

        // 1. Update the status of each date in wfh_records to 'Rejected' and add reject_reason
        const updateRecordsQuery = `
            UPDATE wfh_records
            SET status = 'Rejected', reject_reason = $3
            WHERE requestID = $1 AND wfh_date = ANY($2::date[])
            RETURNING *;
        `;
        const result = await client.query(updateRecordsQuery, [parsedRequestID, changeDates, reasonText]);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'No matching records found to reject.' });
        }

        // 2. Use a loop to remove each date from the wfh_dates array in recurring_request
        for (const date of changeDates) {
            await client.query(
                `UPDATE recurring_request
                 SET wfh_dates = array_remove(wfh_dates, $1)
                 WHERE requestID = $2;`,
                [date, parsedRequestID]
            );
        }

        // 3. Log the rejection in the activity log
        await client.query(
            `INSERT INTO activitylog (requestID, activity)
             VALUES ($1, $2);`,
            [parsedRequestID, `Rejected Change - ${reasonText}`]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Recurring change request rejected successfully.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error rejecting recurring change request:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});



// Manager Reject a recurring request
router.post('/reject/:requestID', async (req, res) => {
    const { requestID } = req.params;
    const { reason } = req.body; // Get the rejection reason from the request body
    try {
        // Update the status of the recurring_request table to "Rejected"
        const result = await client.query(`
            UPDATE recurring_request
            SET status = 'Rejected', reject_reason = $1
            WHERE requestid = $2
            RETURNING *;`,
            [reason, requestID]
        );

        // Check if any rows were updated
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        // Additional logging activity if needed
        await client.query(
            `INSERT INTO activitylog (requestid, activity)
            VALUES ($1, 'Rejected Recurring Request: ${reason}');`,
            [requestID]
        );

        res.status(200).json({ message: 'Recurring request rejected successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Error rejecting recurring request:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

const formatToISO8601 = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString(); // Formats date to "YYYY-MM-DDTHH:mm:ss.sssZ" with UTC time
};


// Modify recurring WFH request by updating dates and soft-deleting records
router.patch('/modify/:requestid', async (req, res) => {
    const { requestid } = req.params;
    const { wfh_dates } = req.body;

    console.log("Received request to modify ID:", requestid);
    console.log("Update body:", req.body);

    // Validate input
    if (!Array.isArray(wfh_dates) || wfh_dates.length === 0) {
        return res.status(400).json({ message: 'Invalid input: wfh_dates must be a non-empty array.' });
    }

    try {
        // Begin a transaction to ensure atomicity
        await client.query('BEGIN');

        // 1. Update `recurring_request` to keep only the dates that are not in the removal list
        const recurringResult = await client.query(`
            UPDATE recurring_request
            SET wfh_dates = ARRAY(
                SELECT unnest(wfh_dates) 
                EXCEPT SELECT unnest($1::DATE[])
            )
            WHERE requestid = $2
            RETURNING wfh_dates;
        `, [wfh_dates, requestid]);

        if (recurringResult.rowCount === 0) {
            console.log("No request found with the given request ID.");
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Request not found' });
        }

        // Convert the dates to ISO 8601 format for wfh_records operations
        const isoWfhDates = wfh_dates.map(formatToISO8601);

        // 2. Update the status to 'Deleted' in `wfh_records` for matching dates instead of deleting them
        const wfhRecordResult = await client.query(`
            UPDATE wfh_records
            SET status = 'Deleted'
            WHERE requestID = $1 AND wfh_date = ANY($2::DATE[])
            RETURNING recordID, wfh_date;
        `, [requestid, wfh_dates]);

        // 3. Log each updated date in ActivityLog with both requestID and recordID
        const logPromises = wfhRecordResult.rows.map(row => {
            const { recordID, wfh_date } = row;
            return client.query(`
                INSERT INTO ActivityLog (requestID, recordID, activity)
                VALUES ($1, $2, $3)
            `, [requestid, recordID, `Soft deleted WFH date: ${wfh_date}`]);
        });
        await Promise.all(logPromises);

        // Commit the transaction
        await client.query('COMMIT');

        console.log("Update successful:", recurringResult.rows[0]); // Log the updated record

        // Send success response with the updated recurring request dates
        res.status(200).json({ message: 'Request updated successfully', record: recurringResult.rows[0] });
    } catch (error) {
        // Rollback the transaction in case of errors
        await client.query('ROLLBACK');
        console.error('Error updating request:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Used to withdraw recurring request
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

router.patch('/change/:requestid', async (req, res) => {
    const { requestid } = req.params;
    const { selected_date, actual_wfh_date, staff_id, change_reason } = req.body;

    console.log("Received request to modify ID:", requestid);
    console.log("Update body:", req.body);
    console.log("Change Reason:", change_reason);
    console.log("Staff Id:",staff_id);

    // Validate input
    if (!selected_date || !actual_wfh_date) {
        return res.status(400).json({ message: 'Invalid input: selected_date and actual_wfh_date are required.' });
    }

    // Convert dates to Date objects and adjust for GMT+8
    const actualDate = new Date(actual_wfh_date);
    const selectedDate = new Date(selected_date);

    const adjustedActualDate = new Date(actualDate.getTime() - 8 * 60 * 60 * 1000).toISOString(); // Adjust to GMT+8
    const adjustedSelectedDate = new Date(selectedDate.getTime() - 8 * 60 * 60 * 1000).toISOString(); // Adjust to GMT+8

    console.log("Adjusted Actual Date:", adjustedActualDate);
    console.log("Adjusted Selected Date:", adjustedSelectedDate);

    try {
        // Fetch the existing wfh_dates for the specified requestid
        const existingRequest = await client.query(`
            SELECT wfh_dates FROM recurring_request
            WHERE requestid = $1
        `, [requestid]);

        // Check if any request was found
        if (existingRequest.rowCount === 0) {
            console.log("No request found with the given request ID.");
            return res.status(404).json({ message: 'Request not found' });
        }

        const wfh_dates = existingRequest.rows[0].wfh_dates;
        console.log("Current WFH Dates: ", wfh_dates);

        // Convert existing dates to ISO strings
        const formattedWfhDates = wfh_dates.map(date => new Date(date).toISOString());
        console.log("Formatted WFH Dates: ", formattedWfhDates);

        // Update the wfh_dates array - Remove the actual_wfh_date and add the selected_date
        const updatedWfhDates = formattedWfhDates.filter(date => date !== adjustedActualDate); // Remove actual_wfh_date
        console.log("Updated WFH Dates (after removing): ", updatedWfhDates);

        // Add the selected date
        const newSelectedDate = new Date(adjustedSelectedDate);
        const adjustedNewSelectedDate = newSelectedDate.toISOString(); // Convert to ISO string format

        updatedWfhDates.push(adjustedNewSelectedDate); // Add new selected date to the end
        console.log("Updated WFH Dates: ", updatedWfhDates);

        const updatedWfhDatesPlusOne = updatedWfhDates.map(date => {
            const newDate = new Date(date); // Create a new Date object
            newDate.setDate(newDate.getDate() + 1); // Increment by one day
            return newDate.toISOString(); // Convert back to ISO string format
        });

        // Log the new dates
        console.log("Updated WFH Dates (plus one day): ", updatedWfhDatesPlusOne);

        // Update the status and wfh_dates in the database
        const result = await client.query(`
            UPDATE recurring_request
            SET wfh_dates = $1::DATE[], status = 'Pending Change'
            WHERE requestid = $2
            RETURNING *;
        `, [updatedWfhDatesPlusOne, requestid]);

        const result2 = await client.query(
            `INSERT INTO activitylog (requestID, activity) VALUES ($1, $2)`,
            [requestid, `Changed Request- ${change_reason}`]
        );

        console.log("Update successful:", result.rows[0]); // Log the updated record
        console.log("Update to Activity Log successful:", result2.rows[0]); // Log the updated record

        // Check if staff_id is 130002
        if (Number(staff_id) === 130002) { // Ensure staff_id is treated as a number
            // Start transaction
            await client.query('BEGIN');

            // Immediately approve for staff 130002
            await client.query(`
                UPDATE wfh_records 
                SET status = 'Approved' 
                WHERE wfh_date = $1 AND requestID = $2
            `, [adjustedNewSelectedDate, requestid]);

            // Update recurring request status to 'Approved'
            await client.query(`
                UPDATE recurring_request
                SET wfh_dates = $1::DATE[], status = 'Approved'
                WHERE requestid = $2
                RETURNING *;
            `, [updatedWfhDatesPlusOne, requestid]);

            // Commit the transaction
            await client.query('COMMIT');
            console.log("Request approved directly for staff 130002");

            // Send success response for 130002 staff
            return res.status(200).json({ message: 'Request changed and approved successfully.' });
        }

        // For other staff, respond normally after the update
        res.status(200).json({ message: 'Request updated successfully', record: result.rows[0] });

    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


module.exports = router;
