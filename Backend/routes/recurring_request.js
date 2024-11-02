const express = require('express');
const router = express.Router();
const client = require('../databasepg');
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
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        if (date.getDay() === targetDay) {
            wfh_dates.push(date.toISOString().split('T')[0]); // Store date as YYYY-MM-DD
        }
    }
    try {
        // Fetch existing dates from recurring_request and wfh_records tables
        // const existingDatesResult = await client.query(`
        //     SELECT unnest(wfh_dates) AS date FROM recurring_request WHERE staff_id = $1
        //     UNION ALL
        //     SELECT wfh_date FROM wfh_records WHERE staffid = $1`,
        //     [staff_id]
        // );
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
            return res.status(409).json({ message: 'Your start date cannot be after your end date/the day you selected is not in the date range'});
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
             SELECT $1, unnest($2::DATE[]) AS wfh_date, TRUE, $3, 'Pending', $4, $5, CURRENT_DATE;`,
            [staff_id, wfh_dates, timeslot, request_reason, request_id]
        );
        const requestID = result.rows[0].requestID;
        res.status(201).json({ message: 'Recurring WFH request submitted successfully', requestID });
    } catch (error) {
        console.error('Error submitting recurring WFH request:', error);
        res.status(500).json({ message: 'Please fill up the form again. ' + error.message });
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

        const combinedDataPromises = recurring_request_data.map(async (recurringRequest) => {
            const wfhQuery = `SELECT wfh_date, status FROM wfh_records WHERE requestID = $1`;
            const wfhResult = await client.query(wfhQuery, [recurringRequest.requestid]);
            return {
                ...recurringRequest,
                wfh_records: wfhResult.rows
            };
        });

        const combinedData = await Promise.all(combinedDataPromises);
        res.status(200).json(combinedData);
        console.log(combinedData)
    } catch (error) {
        console.error('Error retrieving recurring requests by employee IDs:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});


// Manager approve recurring request
// Need add : check if <50% in office and prompt manager for confirmation to overide the limit
router.patch('/approve/:requestid', async (req, res) => {
    const { requestid } = req.params;

    try {
        await client.query('BEGIN');
        // Update recurring request status to 'Approved'
        const recurringRequestResult = await client.query(`
            UPDATE recurring_request
            SET status = 'Approved'
            WHERE requestid = $1
            RETURNING *;
        `, [requestid]);

        if (recurringRequestResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Recurring request not found' });
        }

        // Update corresponding wfh_records status to 'Approved'
        const wfhRecordsResult = await client.query(`
            UPDATE wfh_records
            SET status = 'Approved'
            WHERE requestid = $1
            RETURNING *;
        `, [requestid]);

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

//Handle Accept Withdrawal Request
router.patch('/approvewithdrawal/:requestid', async (req, res) => {
    const { requestid } = req.params;
    try {
        await client.query('BEGIN');
        // Update recurring request status to 'Approved'
        const recurringRequestResult = await client.query(`
            UPDATE recurring_request
            SET status = 'Withdrawn'
            WHERE requestid = $1
            RETURNING *;
        `, [requestid]);

        if (recurringRequestResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Recurring request not found' });
        }

        // Update corresponding wfh_records status to 'Withdrawn'
        const wfhRecordsResult = await client.query(`
            UPDATE wfh_records
            SET status = 'Withdrawn'
            WHERE requestid = $1
            RETURNING *;
        `, [requestid]);

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


// cancel approved recurring request 
// withdraw entire recurring request (KIV this doesnt seem to be right, withdraw entire request should have its own endpoint) 
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


// For staff : Withdraw a date from a recurring WFH request 
router.post('/withdraw_recurring_wfh', async (req, res) => {
    const { requestID, wfhDate, reason } = req.body;
  
    try {
      // Start a transaction to ensure atomicity
      await client.query('BEGIN');
  
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
  
      // Convert the input date to the correct format and check if it exists in the array
      const dateToRemove = new Date(wfhDate).toISOString().slice(0, 10);
  
      if (!wfh_dates.includes(dateToRemove)) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'WFH date not found in the request.' });
      }
  
      // Remove the date from the wfh_dates array
      const updatedDates = wfh_dates.filter(date => date !== dateToRemove);
  
      // 2. If the request status is 'Pending', update the wfh_dates array in recurring_request
      if (status === 'Pending') {
        await client.query(
          `UPDATE recurring_request SET wfh_dates = $1 WHERE requestID = $2`,
          [updatedDates, requestID]
        );
  
        // 3. Insert a new activity log entry for the withdrawal
        await client.query(
          `INSERT INTO activitylog (requestID, activity) VALUES ($1, $2)`,
          [requestID, `Withdrawn - ${reason}`]
        );
      }
  
      // 4. If the request status is 'Approved', update wfh_records and mark it as 'Pending Withdrawal'
      if (status === 'Approved') {
        // Update the status to 'Pending Withdrawal' for the corresponding date in wfh_records
        await client.query(
          `UPDATE wfh_records SET status = 'Pending Withdrawal' WHERE wfh_date = $1 AND requestID = $2`,
          [wfhDate, requestID]
        );
  
        // 5. Also update the status of the recurring request itself
        await client.query(
          `UPDATE recurring_request SET status = 'Pending Withdrawal' WHERE requestID = $1`,
          [requestID]
        );
  
        // 6. Insert a new activity log entry for the withdrawal
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

        // 2. Delete corresponding records from `wfh_records` that match the dates to be removed
        const wfhRecordResult = await client.query(`
            DELETE FROM wfh_records
            WHERE requestID = $1 AND wfh_date = ANY($2::DATE[])
            RETURNING recordID, wfh_date;
        `, [requestid, wfh_dates]);

        // 3. Log each removed date in ActivityLog with both requestID and recordID
        const logPromises = wfhRecordResult.rows.map(row => {
            const { recordID, wfh_date } = row;
            return client.query(`
                INSERT INTO ActivityLog (requestID, recordID, activity)
                VALUES ($1, $2, $3)
            `, [requestid, recordID, `Removed WFH date: ${wfh_date}`]);
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




module.exports = router;
