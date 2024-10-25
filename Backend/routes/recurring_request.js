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
    }
});

// New route to get recurring requests by an array of employee IDs
router.get('/by-employee-ids', async (req, res) => {
    try {
        const employeeIds = req.query.employeeIds?.split(',');

        // Validate input
        if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
            return res.status(400).json({ message: 'Invalid input. Must provide an array of employee IDs.' });
        }

        // Create placeholders for the SQL query
        const placeholders = employeeIds.map((_, index) => `$${index + 1}`).join(', ');
        const recurringQuery = `SELECT * FROM recurring_request WHERE staff_id IN (${placeholders})`;

        // Retrieve recurring requests
        const recurringResult = await client.query(recurringQuery, employeeIds);
        const recurring_request_data = recurringResult.rows; // Storing recurring request data

        // If there are no matching records, return an empty array
        if (recurring_request_data.length === 0) {
            return res.status(200).json([]);
        }

        // Loop through each recurring request and fetch corresponding wfh_record
        const combinedDataPromises = recurring_request_data.map(async (recurringRequest) => {
            const wfhQuery = `SELECT wfh_date, status FROM wfh_records WHERE requestID = $1`;
            const wfhResult = await client.query(wfhQuery, [recurringRequest.requestid]);

            // Combine recurring request with corresponding wfh records (if any)
            return {
                ...recurringRequest,
                wfh_records: wfhResult.rows // Add the wfh_records (wfh_date and status)
            };
        });

        // Wait for all the combined data to be fetched
        const combinedData = await Promise.all(combinedDataPromises);

        // Return the combined data
        res.status(200).json(combinedData);
        console.log(combinedData)
    } catch (error) {
        console.error('Error retrieving recurring requests by employee IDs:', error);
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
        // Adding this part to update all entries with request_id == id in recurring request table
        await client.query(
            `
            UPDATE wfh_records
            SET status = 'Approved'
            WHERE requestID = $1;
            `,
            [requestid]
        );
        await client.query(
            `
            INSERT INTO activitylog (requestid, activity)
            VALUES ($1, 'Approved Recurring Request');
            `,
            [requestid]
        );
        // Removed because functionality is transferred to when request is made
        // //Step 2: Insert into wfh_records for each date in wfh_dates
        // await client.query(
        //     `INSERT INTO wfh_records (staffid, wfh_date, recurring, timeslot, status, request_reason, requestid, requestdate)
        //      SELECT $1, unnest($2::DATE[]) AS wfh_date, TRUE, $3, 'Approved', $4, $5, CURRENT_DATE;`,
        //     [staff_id, wfh_dates, timeslot, request_reason, requestid]
        // );
        await client.query('COMMIT');
        // Send a success response
        res.status(200).json({ message: 'Request approved and WFH records created successfully.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving request:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});
// withdraw entire recurring request
router.put('/withdraw_entire/:requestid', async (req, res) => {
    const { requestid } = req.params;
  
    try {
        // Update the status of the record to 'Withdrawn'
        const result = await client.query(`
            UPDATE recurring_request
            SET status = 'Withdrawn'
            WHERE requestid = $1
            RETURNING *
        `, [requestid]);
  
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }
        const result2 = await client.query(
            `UPDATE wfh_records
             SET status = 'Withdrawn'
             WHERE requestid = $1
             RETURNING *;`,
            [requestid]
        );
  
        if (result2.rowCount === 0) {
            return res.status(404).json({ message: 'Record not found' });
        }
  
        await client.query(
          `
          INSERT INTO activitylog (requestid, activity)
          VALUES ($1, 'Recurring Request Withdrawn');
          `,
          [requestid]
        );
  
        res.status(200).json({ message: 'Record withdrawn successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Error withdrawing record:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
  });
  
  
//Withdraw recurring request
// Withdraw a date from a recurring WFH request
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

//   accept change
router.post('/accept-change', async (req, res) => {
    console.log("Request body:", req.body);

    let { requestID, wfhDate } = req.body;

    // Validate requestID
    if (!requestID || isNaN(requestID)) {
        console.error('Invalid or missing requestID:', requestID);
        return res.status(400).json({ message: 'Invalid requestID' });
    }

    // Format wfhDate to YYYY-MM-DD
    wfhDate = new Date(wfhDate).toISOString().slice(0, 10);
    requestID = parseInt(requestID);  // Safely convert requestID to an integer

    console.log(`Received request to accept change. RequestID: ${requestID}, wfhDate: ${wfhDate}`);

    try {
        await client.query('BEGIN');

        // 1. Update the wfh_date in wfh_records where it matches both requestID and the original wfh_date
        console.log('Starting update for wfh_records...');
        const result = await client.query(
            `UPDATE wfh_records
             SET status = 'Approved'
             WHERE requestID = $1 AND wfh_date = $2
             RETURNING *;`,
            [requestID, wfhDate]  // Order: requestID = $1, wfhDate = $2
        );

        if (result.rowCount === 0) {
            console.error('No matching record found.');
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Record not found.' });
        }

        // 2. Update the wfh_dates array in recurring_request
        console.log('Updating wfh_dates array in recurring_request...');
        await client.query(
            `UPDATE recurring_request
             SET wfh_dates = array_remove(wfh_dates, $2)
             WHERE requestID = $1;`,
            [requestID, wfhDate]  // Order: requestID = $1, wfhDate = $2
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



// Reject a pending recurring change request
  router.put('/reject-change', async (req, res) => {
    const { requestID, wfhDate, reject_reason } = req.body;

    wfhDate = new Date(wfhDate).toISOString().slice(0, 10);
    requestID = parseInt(requestID);
    reject_reason = reject_reason.toString();

    try {
        await client.query('BEGIN');

        // 1. Update the status of the corresponding date in wfh_records to 'Rejected' and include rej_reason
        const result = await client.query(
            `UPDATE wfh_records
             SET status = 'Rejected', reject_reason = $3
             WHERE requestID = $1 AND wfh_date = $2
             RETURNING *;`,
            
            [requestID, wfhDate, reject_reason]
        );

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Record not found.' });
        }

        // 2. remove the date from the wfh_dates array in the recurring_request
        await client.query(
            `UPDATE recurring_request
             SET wfh_dates = array_remove(wfh_dates, $1)
             WHERE requestID = $2;`,
            [wfhDate, requestID]
        );

        // 3. Insert a new activity log entry for the rejection
        await client.query(
            `INSERT INTO activitylog (requestID, activity)
             VALUES ($1, $2);`,
            [requestID, `Rejected Change - ${reject_reason}`]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Recurring change request rejected successfully.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error rejecting recurring change request:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
  });
  
  
module.exports = router;
